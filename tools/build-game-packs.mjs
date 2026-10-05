import { mkdir, writeFile, readFile, readdir, unlink } from "node:fs/promises";
import { buildReviewedPack, reviewedCatalog } from "../apps/codex-stage/packs/build.js";

const directory = new URL("../apps/codex-stage/packs/built/", import.meta.url);
await mkdir(directory, { recursive: true });
const catalog = reviewedCatalog();
const expected = new Set(['catalog.json', ...catalog.flatMap(p => [p.entry, `${p.id}.json`])]);
for (const file of await readdir(directory)) {
  if (/^[a-z0-9-]+\.(js|json)$/.test(file) && !expected.has(file)) await unlink(new URL(file, directory));
}
for (const entry of catalog) {
  const { source } = buildReviewedPack(entry.id);
  await writeFile(new URL(entry.entry, directory), source);
  await writeFile(new URL(`${entry.id}.json`, directory), JSON.stringify(entry, null, 2) + "\n");
}
const { version } = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
await writeFile(new URL("catalog.json", directory), JSON.stringify({ version, games: catalog }, null, 2) + "\n");
console.log(JSON.stringify({ games: catalog.length, totalBytes: catalog.reduce((sum, p) => sum + p.bytes, 0), largest: Math.max(...catalog.map(p => p.bytes)) }));
