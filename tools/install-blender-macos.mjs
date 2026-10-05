import { mkdir, access, writeFile, mkdtemp } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

const exec = promisify(execFile), version = "4.5.14";
if (process.platform !== "darwin" || process.arch !== "arm64") throw new Error("This installer is pinned to macOS Apple Silicon; see Blender's official downloads for other platforms.");
const filename = `blender-${version}-macos-arm64.dmg`, url = `https://download.blender.org/release/Blender4.5/${filename}`;
const sha256 = "65134d9b07b20e2fa8d3c9e44f6f44ffb5c9774dd521b95f50387310241ca170";
const cache = join(homedir(), "Library/Caches/AgentStageTools"), target = join(homedir(), `Applications/Blender ${version}.app`), binary = join(target, "Contents/MacOS/Blender");
try { await access(target); console.log(`Already exists; not replacing ${target}`); process.exit(0); } catch {}
await mkdir(cache, { recursive: true }); await mkdir(join(homedir(), "Applications"), { recursive: true });
const archive = join(cache, filename);
try { await access(archive); } catch { await exec("curl", ["--fail", "--location", "--retry", "2", "--output", archive, url], { maxBuffer: 1024 * 1024 }); }
const hash = createHash("sha256"); for await (const chunk of createReadStream(archive)) hash.update(chunk);
if (hash.digest("hex") !== sha256) throw new Error(`Blender checksum mismatch; no application installed. Remove the bad archive at ${archive} before retrying.`);
const mount = await mkdtemp(join(tmpdir(), "agent-stage-blender-"));
await exec("hdiutil", ["attach", "-nobrowse", "-readonly", "-mountpoint", mount, archive]);
try { await exec("ditto", [join(mount, "Blender.app"), target]); } finally { await exec("hdiutil", ["detach", mount]); }
const output = await exec(binary, ["--version"]);
await writeFile(join(cache, "blender-install.json"), JSON.stringify({ version, url, sha256, target, binary, verifiedVersion: output.stdout.split("\n")[0] }, null, 2) + "\n");
console.log(output.stdout.split("\n")[0]); console.log(binary);
