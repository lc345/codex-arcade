import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../apps/codex-stage/", import.meta.url), art = {}, files = [];
for (const [id, extension] of [["ink-archive", "jpg"], ["kitchen-defense", "jpg"], ["yesterday-express", "jpg"], ["rule-smuggler", "webp"], ["temp-stunt", "webp"], ["shadow-crew", "webp"], ["dice-foundry", "webp"], ["toast-hop", "jpg"]]) {
  const path = `assets/studio/${id}-art.${extension}`, data = await readFile(new URL(path, root));
  art[id] = `data:image/${extension === "jpg" ? "jpeg" : extension};base64,${data.toString("base64")}`;
  files.push({ id, path, sha256: createHash("sha256").update(data).digest("hex"), bytes: data.length, source: "OpenAI built-in imagegen", license: "Apache-2.0 project asset grant; generated asset, no claim of exclusivity" });
}
await writeFile(new URL("studio/assets.js", root), `// Generated local assets. See assets/studio/ARTWORK.md.\nexport const STUDIO_ART = ${JSON.stringify(art)};\n`);
await writeFile(new URL("assets/studio/art-manifest.json", root), JSON.stringify({ version: 1, files }, null, 2) + "\n");
console.log(`Bundled ${files.length} original art assets.`);
