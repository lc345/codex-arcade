import { createReadStream, existsSync, statSync, realpathSync } from "node:fs";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { extname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { createMediaLibrary } from "../../packages/codex-stage/src/media-library.js";

const mime = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".wasm": "application/wasm",
  ".webm": "video/webm",
  ".webp": "image/webp",
};

function json(response, status, body) {
  response.writeHead(status, { "access-control-allow-origin": "*", "cache-control": "no-store", "content-type": "application/json; charset=utf-8" });
  response.end(body === undefined ? undefined : JSON.stringify(body));
}

function safeRootFile(root, pathname) {
  const file = resolve(root, `.${pathname}`);
  const relation = relative(root, file);
  return relation && !relation.startsWith("..") && !relation.includes("..\\") ? file : null;
}

function decodeFileName(value) {
  try { return decodeURIComponent(String(value ?? "")); } catch { throw new Error("Invalid local video file name"); }
}

async function readJson(request) {
  let text = "";
  for await (const chunk of request) {
    text += chunk;
    if (text.length > 32_000) throw new Error("Request body is too large");
  }
  try { return JSON.parse(text || "{}"); } catch { throw new Error("Request body must be JSON"); }
}

function streamMedia(request, response, file, contentType) {
  const size = statSync(file).size;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(String(request.headers.range ?? ""));
  let start = 0;
  let end = size - 1;
  if (match) {
    start = match[1] ? Number(match[1]) : start;
    end = match[2] ? Number(match[2]) : end;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end >= size || start > end) {
      response.writeHead(416, { "content-range": `bytes */${size}` });
      response.end();
      return;
    }
  }
  const headers = {
    "accept-ranges": "bytes",
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
    "content-length": end - start + 1,
    "content-type": contentType,
  };
  if (match) headers["content-range"] = `bytes ${start}-${end}/${size}`;
  response.writeHead(match ? 206 : 200, headers);
  createReadStream(file, { start, end }).pipe(response);
}

export function createStageServer({ root = process.cwd(), mediaDirectory = join(homedir(), "Library", "Application Support", "AgentStage", "media"), maxMediaBytes } = {}) {
  const absoluteRoot = resolve(root);
  const media = createMediaLibrary({ directory: mediaDirectory, ...(maxMediaBytes === undefined ? {} : { maxBytes: maxMediaBytes }) });
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    try {
      if (request.method === "OPTIONS") {
        response.writeHead(204, { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type, x-agent-stage-file-name", "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS" });
        response.end();
        return;
      }
      if (url.pathname === "/v1/media" && request.method === "GET") return json(response, 200, await media.list());
      if (url.pathname === "/v1/media" && request.method === "POST") {
        const fileName = decodeFileName(request.headers["x-agent-stage-file-name"]);
        const entry = await media.add({ fileName, contentType: request.headers["content-type"], contentLength: request.headers["content-length"], source: request });
        return json(response, 201, entry);
      }
      if (url.pathname === "/v1/media/selection" && request.method === "GET") return json(response, 200, await media.selection());
      if (url.pathname === "/v1/media/selection" && request.method === "PUT") return json(response, 200, await media.select((await readJson(request)).id ?? null));
      const mediaMatch = /^\/v1\/media\/([a-f0-9]{16})$/.exec(url.pathname);
      if (mediaMatch && request.method === "GET") {
        const entries = await media.list();
        const entry = entries.find((item) => item.id === mediaMatch[1]);
        if (!entry) return json(response, 404, { error: "Local video was not found" });
        return streamMedia(request, response, await media.pathFor(entry.id), entry.contentType);
      }
      if (mediaMatch && request.method === "DELETE") {
        await media.remove(mediaMatch[1]);
        response.writeHead(204, { "access-control-allow-origin": "*", "cache-control": "no-store" });
        response.end();
        return;
      }

      const requested = url.pathname === "/" ? "/apps/press-lab/index.html" : url.pathname === "/gallery" ? "/apps/stage-gallery/index.html" : url.pathname === "/codex-stage" ? "/apps/codex-stage/index.html" : url.pathname;
      const file = safeRootFile(absoluteRoot, requested);
      if (!file || !existsSync(file) || !statSync(file).isFile()) return json(response, 404, { error: "Not found" });
      response.writeHead(200, { "cache-control": "no-store", "content-type": mime[extname(file)] ?? "application/octet-stream" });
      createReadStream(file).pipe(response);
    } catch (error) {
      json(response, 400, { error: error instanceof Error ? error.message : String(error) });
    }
  });
  return {
    media,
    async start({ host = "127.0.0.1", port = 4173 } = {}) {
      await new Promise((resolveStart, rejectStart) => {
        server.once("error", rejectStart);
        server.listen(port, host, () => { server.off("error", rejectStart); resolveStart(); });
      });
      const address = server.address();
      return { host, port: typeof address === "object" && address ? address.port : port };
    },
    async stop() {
      if (!server.listening) return;
      await new Promise((resolveStop, rejectStop) => server.close((error) => error ? rejectStop(error) : resolveStop()));
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const stage = createStageServer();
  const { port } = await stage.start({ port: Number(process.env.PORT ?? 4173) });
  process.stdout.write(`Agent Stage Lab: http://127.0.0.1:${port}\n`);
}
