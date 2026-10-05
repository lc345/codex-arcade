import { createHash } from "node:crypto";
import { createServer } from "node:http";

const gestureNames = new Set(["tap", "double-tap", "hold-start", "hold-cancel", "hold-complete", "deny", "defer", "details"]);

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error("Request body is too large"));
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        reject(new Error("Request body must be JSON"));
      }
    });
    request.on("error", reject);
  });
}

function encodeWebSocket(value) {
  const payload = Buffer.from(JSON.stringify(value));
  if (payload.length >= 65_536) throw new Error("Stage Bridge WebSocket message is too large");
  const header = payload.length < 126 ? Buffer.from([0x81, payload.length]) : Buffer.from([0x81, 126, payload.length >> 8, payload.length & 0xff]);
  return Buffer.concat([header, payload]);
}

function parseWebSocketFrames(buffer) {
  const messages = [];
  let offset = 0;
  while (offset + 2 <= buffer.length) {
    const first = buffer[offset];
    const second = buffer[offset + 1];
    const lengthCode = second & 0x7f;
    const masked = Boolean(second & 0x80);
    let length = lengthCode;
    let cursor = offset + 2;
    if (lengthCode === 126) {
      if (cursor + 2 > buffer.length) break;
      length = buffer.readUInt16BE(cursor);
      cursor += 2;
    }
    if (lengthCode === 127 || !masked || cursor + 4 + length > buffer.length) break;
    const mask = buffer.subarray(cursor, cursor + 4);
    cursor += 4;
    const payload = Buffer.alloc(length);
    for (let index = 0; index < length; index += 1) payload[index] = buffer[cursor + index] ^ mask[index % 4];
    offset = cursor + length;
    if ((first & 0x0f) === 0x8) continue;
    if ((first & 0x0f) === 0x1) {
      try {
        messages.push(JSON.parse(payload.toString("utf8")));
      } catch {
        // Invalid device messages are ignored rather than becoming commands.
      }
    }
  }
  return { messages, remainder: buffer.subarray(offset) };
}

function presentationMessage(presentation) {
  return {
    type: "stage.presentation",
    presentationId: presentation.record.id,
    actionDigest: presentation.record.actionDigest,
    scene: presentation.record.scene,
    contract: presentation.contract,
    commands: presentation.commands,
    timeline: presentation.timeline,
    render: presentation.record.render,
  };
}

export class StageBridge {
  constructor({ runtime, onGesture = () => undefined } = {}) {
    if (!runtime || typeof runtime.present !== "function") throw new Error("StageBridge needs a StageRuntime");
    this.runtime = runtime;
    this.onGesture = onGesture;
    this.devices = new Map();
    this.server = null;
  }

  registerVirtualDevice({ id, capabilities = [], deliver }) {
    if (!id || typeof deliver !== "function") throw new Error("Virtual devices need an id and deliver function");
    this.devices.set(id, { id, capabilities: [...capabilities], deliver, kind: "virtual" });
    return () => this.devices.delete(id);
  }

  async present(event) {
    const presentation = await this.runtime.present(event);
    const message = presentationMessage(presentation);
    for (const device of this.devices.values()) device.deliver(message);
    return presentation;
  }

  receiveGesture({ deviceId, requestId, actionDigest, gesture }) {
    if (!this.devices.has(deviceId)) throw new Error("Unknown Stage Bridge device");
    if (!requestId || !/^[a-f0-9]{64}$/.test(actionDigest) || !gestureNames.has(gesture)) {
      throw new Error("Invalid semantic Stage Bridge gesture");
    }
    const event = { deviceId, requestId, actionDigest, gesture };
    this.onGesture(event);
    return { accepted: true };
  }

  async start({ host = "127.0.0.1", port = 4281 } = {}) {
    if (this.server) throw new Error("Stage Bridge is already running");
    this.server = createServer(async (request, response) => {
      const url = new URL(request.url ?? "/", `http://${host}`);
      if (request.method === "GET" && url.pathname === "/v1/health") {
        json(response, 200, { ok: true, devices: this.devices.size });
        return;
      }
      if (request.method === "POST" && url.pathname === "/v1/events") {
        try {
          const body = await readJson(request);
          const presentation = await this.present(body.event);
          json(response, 202, { presentation });
        } catch (error) {
          json(response, 400, { error: error instanceof Error ? error.message : String(error) });
        }
        return;
      }
      json(response, 404, { error: "Not found" });
    });
    this.server.on("upgrade", (request, socket) => this.#acceptWebSocket(request, socket));
    await new Promise((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(port, host, () => {
        this.server.off("error", reject);
        resolve();
      });
    });
    const address = this.server.address();
    return { host, port: typeof address === "object" && address ? address.port : port };
  }

  async stop() {
    if (!this.server) return;
    const server = this.server;
    this.server = null;
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }

  #acceptWebSocket(request, socket) {
    const url = new URL(request.url ?? "/", "http://localhost");
    const key = request.headers["sec-websocket-key"];
    if (url.pathname !== "/v1/devices" || typeof key !== "string") {
      socket.destroy();
      return;
    }
    const accept = createHash("sha1").update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest("base64");
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    let remainder = Buffer.alloc(0);
    let deviceId = null;
    const deliver = (message) => socket.write(encodeWebSocket(message));
    socket.on("data", (chunk) => {
      const parsed = parseWebSocketFrames(Buffer.concat([remainder, chunk]));
      remainder = parsed.remainder;
      for (const message of parsed.messages) {
        if (message.type === "hello" && typeof message.deviceId === "string") {
          deviceId = message.deviceId;
          this.devices.set(deviceId, { id: deviceId, capabilities: Array.isArray(message.capabilities) ? message.capabilities : [], deliver, kind: "websocket" });
          deliver({ type: "stage.ready", deviceId });
        }
        if (message.type === "gesture" && deviceId) {
          try {
            const result = this.receiveGesture({ deviceId, requestId: message.requestId, actionDigest: message.actionDigest, gesture: message.gesture });
            deliver({ type: "stage.gesture.accepted", ...result });
          } catch (error) {
            deliver({ type: "stage.gesture.rejected", error: error instanceof Error ? error.message : String(error) });
          }
        }
      }
    });
    socket.on("close", () => {
      if (deviceId && this.devices.get(deviceId)?.kind === "websocket") this.devices.delete(deviceId);
    });
    socket.on("error", () => undefined);
  }
}

export function createStageBridge(options) {
  return new StageBridge(options);
}
