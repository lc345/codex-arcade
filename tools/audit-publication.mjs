import { readdir, lstat, readFile, realpath } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { publicationRoots, excludedPublicationEntry } from "./distribution.mjs";

// A publication guard, not a comprehensive secret scanner or license review.
const credentialPattern = /(?<![A-Za-z0-9_])(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-proj-[A-Za-z0-9_-]{30,}|AKIA[A-Z0-9]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)(?![A-Za-z0-9_])/;
const homePattern = /\/Users\/(?!(?:example|me|user|runner|Shared)(?:\/|\b))[A-Za-z0-9_.-]+\//;

export async function auditPublication(root, { maxFileBytes = 95 * 1024 * 1024 } = {}) {
  root = resolve(root);
  const files = [], issues = [];
  let bytes = 0;
  async function inspect(path) {
    const full = join(root, path), info = await lstat(full);
    if (info.isSymbolicLink()) { issues.push({ path, kind: "symbolic-link" }); return; }
    if (info.isDirectory()) {
      for (const name of (await readdir(full)).sort()) {
        if (!excludedPublicationEntry(name)) await inspect(`${path}/${name}`);
      }
      return;
    }
    if (!info.isFile()) { issues.push({ path, kind: "unsupported-file-type" }); return; }
    files.push(path); bytes += info.size;
    if (info.size > maxFileBytes) { issues.push({ path, kind: "oversized-file", bytes: info.size }); return; }
    const data = await readFile(full);
    if (data.subarray(0, 8192).includes(0)) return;
    const source = data.toString("utf8");
    for (const [kind, pattern] of [["credential-pattern", credentialPattern], ["personal-home-path", homePattern]]) {
      const match = pattern.exec(source);
      if (match) issues.push({ path, kind, line: source.slice(0, match.index).split("\n").length });
    }
  }
  for (const name of (await readdir(root)).sort()) if (publicationRoots.has(name)) await inspect(name);
  return { files, bytes, issues };
}

if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(process.argv[1])).href) {
  const report = await auditPublication(process.argv[2] || ".");
  console.log(JSON.stringify({ files: report.files.length, bytes: report.bytes, issues: report.issues }, null, 2));
  if (report.issues.length) process.exitCode = 1;
}
