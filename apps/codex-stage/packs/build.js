import { createHash } from "node:crypto";
import { createAgentArcadeSource } from "../arcade.js";
import { GAME_CATALOG } from "../collection/catalog.js";
import { readFileSync } from "node:fs";
import {buildCanvasFactory} from './canvas-build.js';

const cache = new Map();
export function buildReviewedPack(id) {
  const game = GAME_CATALOG.find(g => g.id === id);
  if (!game) throw new Error("Unknown reviewed game pack");
  if (cache.has(id)) return cache.get(id);
  if(game.canvasPack){const factory=buildCanvasFactory(game),source=`// Reviewed Agent Stage Canvas pack. Apache-2.0. Matter.js retains its MIT notice.\nexport default ${factory};\n`;const result={factory,source,manifest:{schemaVersion:1,id,title:game.title,version:'1.0.0',apiVersion:1,category:game.category,release:game.release,reviewed:true,permissions:[],input:['pointer','keyboard'],offline:true,entry:`${id}.js`,sha256:createHash('sha256').update(source).digest('hex'),bytes:Buffer.byteLength(source),license:'Apache-2.0',dependencies:game.physics==='rules'?[]:[{id:'matter-js',version:'0.20.0',license:'MIT'}],levels:game.levels.length}};cache.set(id,result);return result;}
  const body = createAgentArcadeSource({ packId: id });
  const factory = `(() => {\n${body}\nconst program = GAME_CATALOG.find(g => g.id === ${JSON.stringify(id)});\nreturn (canvas, callbacks = {}) => { const forwarded = { ...callbacks, onProgram: (_program, controls) => callbacks.onProgram?.(program, controls), onState: notice => callbacks.onState?.({ ...notice, program }) }; const studio = STUDIO_PACKS[program.id]; return studio.prepare ? createPreparedStudioRuntime(canvas, program, studio, forwarded) : createStudioRuntime(canvas, program, studio.create, studio.paint, forwarded, studio.createPainter); };\n})()`;
  const license = game.renderer === "three" ? `/* ${readFileSync(new URL("../vendor/THREE-LICENSE.txt", import.meta.url), "utf8")}\n${readFileSync(new URL("../assets/icons/LICENSE", import.meta.url), "utf8")} */\n` : "";
  const physicsLicense = game.physics === "rapier" ? `/* ${readFileSync(new URL("../vendor/RAPIER-LICENSE.txt", import.meta.url), "utf8")} */\n` : "";
  const source = `// Generated first-party game pack. Apache-2.0; dependencies retain their license notices.\n${license}${physicsLicense}export default ${factory};\n`;
  const sha256 = createHash("sha256").update(source).digest("hex");
  const result = { factory, source, manifest: { schemaVersion: 1, id, title: game.title, version: "1.0.0", apiVersion: 1, category: game.category ?? "legacy-arcade", release: game.release ?? "stable", reviewed: true, permissions: [], input: ["pointer", "keyboard"], offline: true, entry: `${id}.js`, sha256, bytes: Buffer.byteLength(source), license: "Apache-2.0", dependencies: game.edition !== "studio" || id === "tidal-putt" || game.physics === "matter" ? [{ id: "matter-js", version: "0.20.0", license: "MIT" }] : [], levels: game.levels.length } };
  if (game.renderer === "three") result.manifest.dependencies.push({ id: "three", version: "0.180.0", license: "MIT" });
  if (game.physics === "rapier") result.manifest.dependencies.push({ id: "@dimforge/rapier3d-compat", version: "0.17.3", license: "Apache-2.0" });
  cache.set(id, result); return result;
}

export function reviewedCatalog() { return GAME_CATALOG.map(g => buildReviewedPack(g.id).manifest); }
