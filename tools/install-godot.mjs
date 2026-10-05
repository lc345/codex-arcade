import { stat, createReadStream } from "node:fs";
import { mkdir as mkdirAsync } from "node:fs/promises";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
const exec = promisify(execFile);
export const version = "4.5.2";
const dir = new URL("../.tools/godot/", import.meta.url).pathname;
await mkdirAsync(dir, { recursive: true });
const files = [
  ["macos.universal.zip", "2a3f35cf5813b0d26e3f4c15dabc5e7c58407fceec7bae5291740772f72d141a"],
];
if (process.platform !== "darwin") throw new Error("This local installer is for macOS. Use the official Godot 4.5.2 editor elsewhere.");
for (const [suffix, digest] of files) {
  const name = `Godot_v${version}-stable_${suffix}`, path = dir + name;
  if ((await promisify(stat)(path).catch(() => null))?.size !== 162276911) {
    console.log(`Downloading official ${name}`);
    await exec("curl", ["--fail", "--location", "--continue-at", "-", "--retry", "2", "--max-time", "900", "--silent", "--show-error", "--output", path, `https://godot-releases.nbg1.your-objectstorage.com/${version}-stable/${name}?agent-stage=editor`], { maxBuffer: 1024 * 1024 });
  }
  const hash = createHash("sha256"); for await (const chunk of createReadStream(path)) hash.update(chunk);
  if (hash.digest("hex") !== digest) throw new Error(`Checksum mismatch: ${path}`);
  console.log(`Verified ${name}`);
  if (suffix === "macos.universal.zip") await exec("ditto", ["-x", "-k", path, dir]);
}
const { stdout } = await exec(dir + "Godot.app/Contents/MacOS/Godot", ["--headless", "--version"]);
if (!stdout.startsWith(version + ".stable")) throw new Error("Unexpected Godot runtime");
console.log(stdout.trim());
