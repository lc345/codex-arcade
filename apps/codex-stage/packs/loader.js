import { PLAYABLE_CATALOG as GAME_CATALOG } from "../collection/catalog.js";
import { createStandalonePack } from "./standalone-runtime.js";

// This is an allowlist of shipped first-party code, not a community JS installer.
export async function loadReviewedPack(id) {
  const game = GAME_CATALOG.find(g => g.id === id);
  if (!game) throw new Error("Unknown reviewed game pack");
  if (game.standalone) return (canvas, callbacks) => createStandalonePack(canvas, game, callbacks);
  const root = "/apps/codex-stage/packs/built/";
  const manifestResponse = await fetch(`${root}${id}.json`, { cache: "no-store" });
  if (!manifestResponse.ok) throw new Error("Missing pack manifest");
  const manifest = await manifestResponse.json();
  if (manifest.id !== id || manifest.apiVersion !== 1 || manifest.entry !== `${id}.js` || !manifest.reviewed || !/^[a-f0-9]{64}$/.test(manifest.sha256) || manifest.permissions?.length !== 0) throw new Error("Invalid pack manifest");
  const response = await fetch(`${root}${id}.js`, { cache: "no-store" });
  if (!response.ok) throw new Error("Missing pack");
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== manifest.bytes || bytes.byteLength > 8 * 1024 * 1024) throw new Error("Invalid pack size");
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), b => b.toString(16).padStart(2, "0")).join("");
  if (digest !== manifest.sha256) throw new Error("Pack integrity mismatch");
  const url = URL.createObjectURL(new Blob([bytes], { type: "text/javascript" }));
  try { return (await import(url)).default; } finally { URL.revokeObjectURL(url); }
}
