import { readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(process.argv[2]);
const payload = join(root, ".agent-stage");
const { version } = JSON.parse(await readFile(join(payload, "package.json")));
const { PLAYABLE_CATALOG } = await import(pathToFileURL(join(payload, "apps/codex-stage/collection/catalog.js")));
const runtimes = {};
for (const arch of ["arm64", "x86_64"]) runtimes[arch] = JSON.parse(await readFile(join(payload, "runtime", arch, "provenance.json")));
await writeFile(join(root, "RELEASE.json"), JSON.stringify({
  version, builtAt: new Date().toISOString(), platform: "macOS", signing: "unsigned-unnotarized",
  games: new Set(PLAYABLE_CATALOG.map(game => game.id)).size, processType: "Interactive", runtimes,
}, null, 2) + "\n");
