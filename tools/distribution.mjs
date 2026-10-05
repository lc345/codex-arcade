import { cp, mkdir, readdir, lstat, realpath } from "node:fs/promises";
import { resolve, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

// Only public project inputs belong in a download or an installed runtime.
export const publicationRoots = new Set(["apps", "packages", "macos", "tools", "docs", "games", "examples", "activity-packs", "scene-packs", "recipes", "spec", "skills", ".github", ".gitignore", ".gitattributes", "index.html", "package.json", "pnpm-lock.yaml", "README.md", "TRUSTED_ACTIONS.md", "LICENSE", "CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "SECURITY.md", "CHANGELOG.md", "Install.command", "Check.command", "Uninstall.command", "Pause.command", "Resume.command"]);
export const excludedPublicationEntry = name => ["node_modules", ".git", ".godot", ".tools", "__pycache__", ".DS_Store", ".aws", ".ssh", ".codex", ".agents", ".npmrc", ".pypirc", "hooks.json", "daemon.json", "window.json"].includes(name) || /^\.env(?:\.|$)/.test(name) || /\.(?:log|pem|key|pyc|bak)$/.test(name);

export async function copyDistribution(source, destination) {
  source = resolve(source); destination = resolve(destination);
  if (!relative(source, destination).startsWith("..")) throw new Error("Distribution destination must be outside the source tree");
  async function copy(from, to) {
    const info = await lstat(from);
    if (info.isSymbolicLink()) throw new Error(`Refusing symbolic link: ${relative(source, from)}`);
    if (info.isDirectory()) {
      await mkdir(to, { recursive: true });
      for (const name of await readdir(from)) if (!excludedPublicationEntry(name)) await copy(join(from, name), join(to, name));
    } else if (info.isFile()) await cp(from, to);
  }
  await mkdir(destination, { recursive: true });
  for (const name of await readdir(source)) if (publicationRoots.has(name) || name === "runtime") await copy(join(source, name), join(destination, name));
}

if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(process.argv[1])).href) {
  const [source, destination] = process.argv.slice(2);
  if (!source || !destination) throw new Error("Usage: node tools/distribution.mjs <source> <outside-destination>");
  await copyDistribution(source, destination);
  console.log("Prepared public project files (no local outputs, tools cache or environment files).");
}
