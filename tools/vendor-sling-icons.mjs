import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const lucide = process.argv[2];
if (!lucide) throw new Error("Pass the installed lucide package directory");
const out = new URL("../apps/codex-stage/assets/icons/", import.meta.url);
await mkdir(out, { recursive: true });
for (const name of ["volume-2", "volume-x", "rotate-ccw", "sparkles", "minimize-2", "maximize-2", "shuffle", "x"]) {
  const { default: nodes } = await import(pathToFileURL(`${lucide}/dist/esm/icons/${name}.js`));
  const content = nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([key, value]) => `${key}="${value}"`).join(" ")}/>`).join("");
  await writeFile(new URL(`${name}.svg`, out), `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#476a5b" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${content}</svg>\n`);
}
await copyFile(`${lucide}/LICENSE`, new URL("LICENSE", out));
