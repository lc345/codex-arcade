import { createHash, randomBytes } from "node:crypto";
import { createReadStream, promises as fs } from "node:fs";
import { basename, extname, join } from "node:path";
import { Readable } from "node:stream";

const mediaTypes = new Map([
  [".mp4", "video/mp4"],
  [".webm", "video/webm"],
  [".mov", "video/quicktime"],
]);
const opaqueId = /^[a-f0-9]{16}$/;

function safeFileName(value) {
  const name = basename(String(value ?? "").replace(/\0/g, "")).trim();
  if (!name || name.length > 120) throw new Error("A video file name is required");
  return name;
}

function mediaTypeFor(fileName, contentType = "") {
  const extension = extname(fileName).toLowerCase();
  const expected = mediaTypes.get(extension);
  if (!expected) throw new Error("Only MP4, WebM, or MOV video files are supported");
  const supplied = String(contentType).split(";", 1)[0].trim().toLowerCase();
  if (supplied && supplied !== expected && supplied !== "application/octet-stream") throw new Error("The selected file type does not match its video extension");
  return { extension, contentType: expected };
}

function publicEntry(entry) {
  if (!entry) return null;
  const { id, fileName, contentType, bytes, createdAt, sha256 } = entry;
  return { id, fileName, contentType, bytes, createdAt, sha256 };
}

function sourceFrom(data, source) {
  if (source) return source;
  if (data === undefined) throw new Error("A local video stream is required");
  return Readable.from([data]);
}

export class MediaLibrary {
  constructor({ directory, maxBytes = 500 * 1024 * 1024 } = {}) {
    if (!directory) throw new Error("A local media directory is required");
    this.directory = directory;
    this.filesDirectory = join(directory, "files");
    this.manifestPath = join(directory, "media.json");
    this.maxBytes = maxBytes;
    this.manifest = null;
  }

  async #load() {
    if (this.manifest) return this.manifest;
    await fs.mkdir(this.filesDirectory, { recursive: true, mode: 0o700 });
    try {
      const parsed = JSON.parse(await fs.readFile(this.manifestPath, "utf8"));
      if (!Array.isArray(parsed.items)) throw new Error("Invalid media manifest");
      this.manifest = { version: 1, selection: parsed.selection ?? null, items: parsed.items };
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      this.manifest = { version: 1, selection: null, items: [] };
      await this.#save();
    }
    return this.manifest;
  }

  async #save() {
    const temporary = `${this.manifestPath}.${randomBytes(6).toString("hex")}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify(this.manifest, null, 2)}\n`, { mode: 0o600 });
    await fs.rename(temporary, this.manifestPath);
  }

  async list() {
    const manifest = await this.#load();
    return manifest.items.map(publicEntry);
  }

  async selection() {
    const manifest = await this.#load();
    return publicEntry(manifest.items.find((entry) => entry.id === manifest.selection) ?? null);
  }

  async add({ fileName, contentType, data, source, contentLength } = {}) {
    const safeName = safeFileName(fileName);
    const type = mediaTypeFor(safeName, contentType);
    const declaredSize = Number(contentLength);
    if (Number.isFinite(declaredSize) && declaredSize > this.maxBytes) throw new Error(`Video exceeds the maximum size of ${this.maxBytes} bytes`);

    await this.#load();
    const temporary = join(this.filesDirectory, `.upload-${randomBytes(12).toString("hex")}.tmp`);
    const handle = await fs.open(temporary, "wx", 0o600);
    const hash = createHash("sha256");
    let bytes = 0;
    try {
      for await (const chunk of sourceFrom(data, source)) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        bytes += buffer.length;
        if (bytes > this.maxBytes) throw new Error(`Video exceeds the maximum size of ${this.maxBytes} bytes`);
        hash.update(buffer);
        await handle.write(buffer);
      }
      if (!bytes) throw new Error("The selected video is empty");
    } catch (error) {
      await handle.close();
      await fs.rm(temporary, { force: true });
      throw error;
    }
    await handle.close();

    const sha256 = hash.digest("hex");
    const known = this.manifest.items.find((entry) => entry.sha256 === sha256);
    if (known) {
      await fs.rm(temporary, { force: true });
      return publicEntry(known);
    }
    const id = sha256.slice(0, 16);
    const storedFile = `${id}${type.extension}`;
    await fs.rename(temporary, join(this.filesDirectory, storedFile));
    const entry = { id, fileName: safeName, contentType: type.contentType, bytes, createdAt: new Date().toISOString(), sha256, storedFile };
    this.manifest.items.unshift(entry);
    await this.#save();
    return publicEntry(entry);
  }

  async select(id) {
    const manifest = await this.#load();
    if (id === null || id === undefined) {
      manifest.selection = null;
      await this.#save();
      return null;
    }
    if (!opaqueId.test(id)) throw new Error("Invalid local media id");
    const entry = manifest.items.find((item) => item.id === id);
    if (!entry) throw new Error("Local video was not found");
    manifest.selection = entry.id;
    await this.#save();
    return publicEntry(entry);
  }

  async pathFor(id) {
    const manifest = await this.#load();
    if (!opaqueId.test(id)) throw new Error("Invalid local media id");
    const entry = manifest.items.find((item) => item.id === id);
    if (!entry) throw new Error("Local video was not found");
    return join(this.filesDirectory, entry.storedFile);
  }

  async open(id, options) {
    return createReadStream(await this.pathFor(id), options);
  }

  async remove(id) {
    const manifest = await this.#load();
    if (!opaqueId.test(id)) throw new Error("Invalid local media id");
    const index = manifest.items.findIndex((entry) => entry.id === id);
    if (index < 0) throw new Error("Local video was not found");
    const [entry] = manifest.items.splice(index, 1);
    if (manifest.selection === entry.id) manifest.selection = null;
    await fs.rm(join(this.filesDirectory, entry.storedFile), { force: true });
    await this.#save();
  }
}

export function createMediaLibrary(options) {
  return new MediaLibrary(options);
}
