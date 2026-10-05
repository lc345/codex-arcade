#!/usr/bin/env node

import { createHash } from "node:crypto";
import { access, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

import { createStageEvent } from "./event.js";
import { createScenePack } from "./pack.js";
import { StageRuntime } from "./runtime.js";

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

function digest(value) {
  return createHash("sha256").update(Buffer.isBuffer(value) || value instanceof Uint8Array ? value : typeof value === "string" ? value : stableStringify(value)).digest("hex");
}

function previewFor(pack, preview) {
  if (!preview || typeof preview !== "object") throw new Error("preview.json must contain an object");
  const event = preview.event ?? {};
  if (event.status && !pack.matches.states.includes(event.status)) {
    throw new Error(`preview status ${event.status} is not supported by ${pack.id}`);
  }
  return preview;
}

function isUnsafeSvg(source) {
  return /<\s*(script|foreignobject|iframe|object|embed)\b|javascript:|\son[a-z]+\s*=/i.test(source);
}

async function validateAssets(directory, pack) {
  for (const asset of pack.assets ?? []) {
    const assetPath = resolve(directory, asset.path);
    if (!assetPath.startsWith(resolve(directory) + "/")) throw new Error("Scene asset escapes its pack directory");
    if (!(await fileExists(assetPath))) throw new Error(`Missing asset declared by Scene Pack: ${asset.path}`);
    if (typeof asset.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(asset.sha256)) {
      throw new Error(`Scene asset ${asset.path} needs a SHA-256 digest`);
    }
    if (digest(await readFile(assetPath)) !== asset.sha256) throw new Error(`Asset digest mismatch: ${asset.path}`);
    if (asset.path.toLowerCase().endsWith(".svg") && isUnsafeSvg(await readFile(assetPath, "utf8"))) {
      throw new Error(`Unsafe SVG asset: ${asset.path}`);
    }
  }
}

async function validateResourceDigests(directory, rawPack, pack) {
  if (typeof rawPack.assetDigest !== "string" || !/^[a-f0-9]{64}$/.test(rawPack.assetDigest)) {
    throw new Error(`v2 Scene Pack ${pack.id} needs an assetDigest`);
  }
  if (typeof rawPack.contentDigest !== "string" || !/^[a-f0-9]{64}$/.test(rawPack.contentDigest)) {
    throw new Error(`v2 Scene Pack ${pack.id} needs a contentDigest`);
  }
  const assetManifest = (rawPack.assets ?? []).map(({ id, path, type, sha256 }) => ({ id, path, type, sha256 }));
  if (digest(assetManifest) !== rawPack.assetDigest) throw new Error(`Asset digest mismatch for Scene Pack ${pack.id}`);
  const content = { ...rawPack };
  delete content.contentDigest;
  if (digest(content) !== rawPack.contentDigest) throw new Error(`Content digest mismatch for Scene Pack ${pack.id}`);
  await validateAssets(directory, pack);
}

export async function verifyStagePackDirectory(directory) {
  const absolute = resolve(directory);
  const scenePath = join(absolute, "scene.json");
  const rawPack = await readJson(scenePath);
  const pack = createScenePack(rawPack);
  let preview = null;

  if (pack.schemaVersion === "2") {
    for (const requiredFile of ["README.md", "LICENSE", "preview.json"]) {
      if (!(await fileExists(join(absolute, requiredFile)))) {
        throw new Error(`v2 Scene Pack ${pack.id} is missing ${requiredFile}`);
      }
    }
    preview = previewFor(pack, await readJson(join(absolute, "preview.json")));
    await validateResourceDigests(absolute, rawPack, pack);
  }

  return { directory: absolute, pack, preview };
}

async function listPackDirectories(source) {
  const directory = resolve(source);
  if (await fileExists(join(directory, "scene.json"))) return [directory];
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => listPackDirectories(join(directory, entry.name))));
  return nested.flat();
}

export async function verifyStagePackTree(source) {
  const directories = await listPackDirectories(source);
  if (directories.length === 0) throw new Error(`No Scene Packs found in ${source}`);
  return Promise.all(directories.map(verifyStagePackDirectory));
}

export async function simulatePack(directory, options = {}) {
  const { pack } = await verifyStagePackDirectory(directory);
  const category = options.category ?? pack.matches.categories[0];
  const status = options.status ?? pack.matches.states[0];
  const event = createStageEvent({
    request: {
      actionDigest: options.actionDigest ?? "a".repeat(64),
      action: { category, risk: options.risk ?? "medium" },
      card: {
        title: "Quarterly review",
        summary: "A trusted sample action for Scene Pack simulation.",
        target: "Morgan Lee",
        impact: "Sends one message.",
      },
    },
    status,
    contract: {
      holdMs: 1200,
      allowedOutcomes: ["approve_once", "deny", "defer"],
      deviceProfile: "browser-virtual-device",
    },
    descriptor: {
      actionKind: category === "communication.send" ? "email.send" : category,
      channel: category === "communication.send" ? "email" : "generic",
      actorLabel: "You",
      recipientLabel: "Morgan Lee",
      recipientCount: 1,
      actionSummary: "Quarterly review",
    },
    context: {
      privacyMode: options.privacyMode ?? "summary-only",
      locale: options.locale ?? "zh-CN",
      timeOfDay: options.timeOfDay ?? "day",
      reducedMotion: Boolean(options.reducedMotion),
      deviceCapabilities: ["screen", "light", "audio"],
      selectionSeed: options.actionDigest ?? "a".repeat(64),
    },
  });
  const presentation = await new StageRuntime({ packs: [pack] }).present(event);
  return { event, presentation };
}

export async function buildGalleryManifest(source, output) {
  const root = resolve(source);
  const verified = await verifyStagePackTree(root);
  const packs = verified.map(({ directory, pack, preview }) => ({
    id: pack.id,
    version: pack.version,
    schemaVersion: pack.schemaVersion,
    categories: pack.matches.categories,
    states: pack.matches.states,
    locales: pack.locales ?? [],
    license: pack.license ?? "unspecified",
    path: relative(dirname(resolve(output)), directory).replaceAll("\\\\", "/"),
    preview: preview?.event ?? null,
  }));
  await writeFile(output, JSON.stringify({ generatedAt: new Date().toISOString(), packs }, null, 2) + "\n");
  return packs;
}

export async function calculatePackDigests(directory) {
  const rawPack = await readJson(join(resolve(directory), "scene.json"));
  const assets = await Promise.all((rawPack.assets ?? []).map(async (asset) => ({
    ...asset,
    sha256: digest(await readFile(resolve(directory, asset.path))),
  })));
  const assetDigest = digest(assets.map(({ id, path, type, sha256 }) => ({ id, path, type, sha256 })));
  const content = { ...rawPack, assets, assetDigest };
  delete content.contentDigest;
  return { assets, assetDigest, contentDigest: digest(content) };
}

async function main(args) {
  const [command, source = "scene-packs", output] = args;
  if (command === "verify") {
    const packs = await verifyStagePackTree(source);
    console.log(`Verified ${packs.length} Agent Stage pack(s).`);
    return;
  }
  if (command === "preview") {
    const result = await verifyStagePackDirectory(source);
    console.log(JSON.stringify({ pack: result.pack.id, preview: result.preview }, null, 2));
    return;
  }
  if (command === "simulate") {
    const status = args[2] ?? "waiting";
    const result = await simulatePack(source, { status });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === "gallery") {
    const target = output ?? "apps/stage-gallery/packs.json";
    const packs = await buildGalleryManifest(source, target);
    console.log(`Built Gallery manifest for ${packs.length} Agent Stage pack(s): ${target}`);
    return;
  }
  if (command === "digest") {
    console.log(JSON.stringify(await calculatePackDigests(source), null, 2));
    return;
  }
  throw new Error("Usage: agent-stage <verify|preview|simulate|gallery|digest> [scene-pack directory] [output]");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
