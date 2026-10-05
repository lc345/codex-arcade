import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

import { createScenePack } from "../../stage-core-ts/src/index.js";

type Recipe = {
  id?: unknown;
  label?: unknown;
  category?: unknown;
  risk?: unknown;
  holdMs?: unknown;
  tone?: unknown;
  card?: Record<string, unknown>;
};

export function verifyRecipe(value: Recipe): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const field of ["id", "label", "category", "tone"]) {
    if (typeof value[field as keyof Recipe] !== "string" || !(value[field as keyof Recipe] as string).trim()) errors.push(`${field} must be a non-empty string`);
  }
  if (!["low", "medium", "high", "critical"].includes(String(value.risk))) errors.push("risk must be low, medium, high, or critical");
  if (!Number.isInteger(value.holdMs) || Number(value.holdMs) <= 0) errors.push("holdMs must be a positive integer");
  if (!value.card || typeof value.card !== "object") {
    errors.push("card must be an object");
  } else {
    for (const field of ["title", "summary", "target", "impact"]) {
      if (typeof value.card[field] !== "string" || !String(value.card[field]).trim()) errors.push(`card.${field} must be a non-empty string`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function verifyStagePack(value: unknown): { valid: boolean; errors: string[] } {
  try {
    createScenePack(value as Parameters<typeof createScenePack>[0]);
    return { valid: true, errors: [] };
  } catch (error) {
    return { valid: false, errors: [error instanceof Error ? error.message : String(error)] };
  }
}

function jsonFiles(path: string, fileName: string): string[] {
  const absolute = resolve(path);
  const entries = readdirSync(absolute, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const target = join(absolute, entry.name);
    if (entry.isDirectory()) return jsonFiles(target, fileName);
    return entry.name === fileName ? [target] : [];
  });
}

function runVerify(target = "recipes", kind: "recipe" | "stage" = "recipe"): number {
  let failures = 0;
  const label = kind === "stage" ? "Stage Pack" : "recipe";
  const fileName = kind === "stage" ? "scene.json" : "recipe.json";
  for (const file of jsonFiles(target, fileName)) {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    const validation = kind === "stage" ? verifyStagePack(parsed) : verifyRecipe(parsed as Recipe);
    if (validation.valid) {
      console.log(`ok ${file}`);
    } else {
      failures += 1;
      console.error(`invalid ${file}`);
      for (const error of validation.errors) console.error(`  - ${error}`);
    }
  }
  if (failures === 0) console.log(`FinalButton ${label} verification passed.`);
  return failures === 0 ? 0 : 1;
}

const isCli = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isCli) {
  const [command, kindOrTarget, explicitTarget] = process.argv.slice(2);
  if (command !== "verify") {
    console.error("Usage: finalbutton verify [recipes|scene-packs] [directory]");
    process.exitCode = 1;
  } else {
    const isStage = kindOrTarget === "scene-packs" || kindOrTarget === "stage-packs";
    process.exitCode = runVerify(explicitTarget ?? kindOrTarget ?? "recipes", isStage ? "stage" : "recipe");
  }
}
