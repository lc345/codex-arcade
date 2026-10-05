import { createHash } from "node:crypto";
import { mkdtemp, mkdir, writeFile, cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const destination = process.argv[2];
const version = process.env.AGENT_STAGE_NODE_VERSION ?? "24.21.0";
if (!destination || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error("Expected payload directory and a valid Node version");
const base = `https://nodejs.org/dist/v${version}/`;
async function download(name) {
  const response = await fetch(base + name, { signal: AbortSignal.timeout(120000), redirect: "error" });
  if (!response.ok) throw new Error(`Node download failed: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
const sums = (await download("SHASUMS256.txt")).toString();
const temporary = await mkdtemp(join(tmpdir(), "agent-stage-node-"));
try {
  for (const [arch, directory] of [["arm64", "arm64"], ["x64", "x86_64"]]) {
    const name = `node-v${version}-darwin-${arch}.tar.gz`;
    const expected = sums.split("\n").map(line => line.trim().split(/\s+/)).find(([, file]) => file === name)?.[0];
    if (!/^[a-f0-9]{64}$/.test(expected ?? "")) throw new Error(`No official checksum for ${name}`);
    const archive = await download(name);
    if (createHash("sha256").update(archive).digest("hex") !== expected) throw new Error("Node checksum mismatch");
    const archivePath = join(temporary, name);
    await writeFile(archivePath, archive);
    execFileSync("/usr/bin/tar", ["-xzf", archivePath, "-C", temporary]);
    const target = resolve(destination, "runtime", directory);
    await mkdir(join(target, "bin"), { recursive: true });
    const extracted = join(temporary, name.replace(/\.tar\.gz$/, ""));
    await cp(join(extracted, "bin/node"), join(target, "bin/node"));
    await cp(join(extracted, "LICENSE"), join(target, "LICENSE"));
    await writeFile(join(target, "provenance.json"), JSON.stringify({ source: base + name, sha256: expected, version }, null, 2));
    console.log(`Bundled official Node ${version} for ${arch}; checksum verified.`);
  }
} finally { await rm(temporary, { recursive: true, force: true }); }
