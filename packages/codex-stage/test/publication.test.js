import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { auditPublication } from "../../../tools/audit-publication.mjs";

test("publication audits allowlisted files without exposing matched secret values", async () => {
  const root = await mkdtemp(join(tmpdir(), "stage-audit-"));
  try {
    await mkdir(join(root, "apps"));
    await mkdir(join(root, "output"));
    await writeFile(join(root, "README.md"), "# Public project\n");
    await writeFile(join(root, "output", "private.txt"), "local only");
    await writeFile(join(root, "apps", ".npmrc"), "not for publication");
    const secret = "gh" + "p_" + "x".repeat(36);
    await writeFile(join(root, "apps", "sample.js"), `const token = '${secret}';`);
    const result = await auditPublication(root);
    assert.deepEqual(result.files, ["README.md", "apps/sample.js"]);
    assert.equal(result.issues.length, 1);
    assert.equal(result.issues[0].kind, "credential-pattern");
    assert.ok(!JSON.stringify(result).includes(secret));
    await writeFile(join(root, "apps", "sample.js"), "export const game = true;\n");
    assert.deepEqual((await auditPublication(root)).issues, []);
    await writeFile(join(root, "apps", "sample.js"), '"base64' + 'AK' + 'IA' + 'A'.repeat(32) + 'encoded"');
    assert.deepEqual((await auditPublication(root)).issues, []);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("publication rejects symlinks, personal home paths and oversized git blobs", async () => {
  const root = await mkdtemp(join(tmpdir(), "stage-audit-"));
  try {
    await mkdir(join(root, "apps"));
    await writeFile(join(root, "apps", "example.js"), '/Users/' + 'you' + 'ze/private');
    assert.equal((await auditPublication(root)).issues[0].kind, "personal-home-path");
    await writeFile(join(root, "apps", "example.js"), "test fixture");
    assert.equal((await auditPublication(root, { maxFileBytes: 4 })).issues[0].kind, "oversized-file");
    await symlink(join(root, "apps", "example.js"), join(root, "apps", "link"));
    assert.ok((await auditPublication(root)).issues.some(i => i.kind === "symbolic-link"));
  } finally { await rm(root, { recursive: true, force: true }); }
});
