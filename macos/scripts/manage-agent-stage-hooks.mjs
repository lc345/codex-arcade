import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { installAgentStageHooks, removeAgentStageHooks } from "../../packages/codex-stage/src/hooks-config.js";

const [operation, file, command] = process.argv.slice(2);
if (!["install", "remove", "check"].includes(operation) || !file) {
  throw new Error("Usage: manage-agent-stage-hooks.mjs <install|remove|check> <hooks.json> [command]");
}
let existing = {};
try { existing = JSON.parse(await readFile(resolve(file), "utf8")); } catch (error) {
  if (error?.code !== "ENOENT") throw new Error("Cannot read hooks.json. Check its JSON syntax and file permissions; no changes were made.");
}
if (!existing || typeof existing !== "object" || Array.isArray(existing) || (existing.hooks !== undefined && (!existing.hooks || typeof existing.hooks !== "object" || Array.isArray(existing.hooks)))) {
  throw new Error("Invalid hooks.json: expected an object with an optional hooks object. No changes were made.");
}
if (operation === "check") process.exit(0);
const output = operation === "install" ? installAgentStageHooks(existing, { command }) : removeAgentStageHooks(existing);
const target = resolve(file);
await mkdir(dirname(target), { recursive: true });
const temporary = `${target}.agent-stage-${process.pid}.tmp`;
await writeFile(temporary, `${JSON.stringify(output, null, 2)}\n`, "utf8");
await rename(temporary, target);
