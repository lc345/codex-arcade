import { createServer } from "node:http";
import { ActivityCollector } from "../../stage-core-ts/src/index.js";

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 250_000) reject(new Error("Request body is too large"));
    });
    request.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); } catch { reject(new Error("Request body must be JSON")); }
    });
    request.on("error", reject);
  });
}

export class CodexStageDaemon {
  constructor({ token, collector = new ActivityCollector(), slowIntervalMs = 500 } = {}) {
    if (!token || typeof token !== "string") throw new Error("Codex Stage daemon needs a local token");
    this.token = token;
    this.collector = collector;
    this.slowIntervalMs = slowIntervalMs;
    this.listeners = new Set();
    this.streams = new Set();
    this.activityHistory = [];
    this.activityCursor = 0;
    this.activeTurns = new Map();
    this.server = null;
    this.timer = null;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  #publish(event) {
    if (!event) return;
    if (event.type === "turn.started") this.activeTurns.set(event.runId, event);
    if (event.type === "turn.completed") this.activeTurns.delete(event.runId);
    const entry = { id: ++this.activityCursor, event };
    this.activityHistory.push(entry);
    if (this.activityHistory.length > 200) this.activityHistory.shift();
    for (const listener of this.listeners) listener(event);
    const payload = `event: activity\ndata: ${JSON.stringify(event)}\n\n`;
    for (const response of this.streams) response.write(payload);
  }

  async start({ host = "127.0.0.1", port = 4282 } = {}) {
    if (host !== "127.0.0.1" && host !== "::1") throw new Error("Codex Stage daemon must bind to loopback");
    if (this.server) throw new Error("Codex Stage daemon is already running");
    this.server = createServer(async (request, response) => {
      const url = new URL(request.url ?? "/", `http://${host}`);
      if (request.method === "OPTIONS") {
        response.writeHead(204, { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type, authorization", "access-control-allow-methods": "GET, POST, OPTIONS" });
        response.end();
        return;
      }
      if (request.method === "GET" && url.pathname === "/v1/health") return json(response, 200, { ok: true });
      if (request.method === "GET" && url.pathname === "/v1/state") {
        if (url.searchParams.get("token") !== this.token) return json(response, 401, { error: "Unauthorized" });
        return json(response, 200, { active: [...this.activeTurns.values()] });
      }
      if (request.method === "GET" && url.pathname === "/v1/events") {
        if (url.searchParams.get("token") !== this.token) return json(response, 401, { error: "Unauthorized" });
        response.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", connection: "keep-alive", "access-control-allow-origin": "*" });
        response.write(": agent-stage-ready\n\n");
        response.write(`event: snapshot\ndata: ${JSON.stringify({ active: [...this.activeTurns.values()] })}\n\n`);
        this.streams.add(response);
        request.on("close", () => this.streams.delete(response));
        return;
      }
      if (request.method === "GET" && url.pathname === "/v1/activity") {
        if (url.searchParams.get("token") !== this.token) return json(response, 401, { error: "Unauthorized" });
        const after = Math.max(0, Number.parseInt(url.searchParams.get("after") ?? "0", 10) || 0);
        return json(response, 200, { cursor: this.activityCursor, events: this.activityHistory.filter((entry) => entry.id > after) });
      }
      if (request.method !== "POST" || url.pathname !== "/v1/hooks") return json(response, 404, { error: "Not found" });
      if (request.headers.authorization !== `Bearer ${this.token}`) return json(response, 401, { error: "Unauthorized" });
      try {
        const event = this.collector.ingestHook(await readJson(request));
        this.#publish(event);
        json(response, 202, { accepted: true, event });
      } catch (error) {
        json(response, 400, { error: error instanceof Error ? error.message : String(error) });
      }
    });
    await new Promise((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(port, host, () => {
        this.server.off("error", reject);
        resolve();
      });
    });
    this.timer = setInterval(() => this.collector.flushSlow().forEach((event) => this.#publish(event)), this.slowIntervalMs);
    const address = this.server.address();
    return { host, port: typeof address === "object" && address ? address.port : port };
  }

  async stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    for (const response of this.streams) response.end();
    this.streams.clear();
    if (!this.server) return;
    const server = this.server;
    this.server = null;
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

export function createCodexStageDaemon(options) {
  return new CodexStageDaemon(options);
}
