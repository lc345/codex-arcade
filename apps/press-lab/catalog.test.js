import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { ACTION_CATALOG, GESTURE_CATALOG, SCENE_CATALOG, defaultSceneForAction, scenesForAction } from "./catalog.js";

test("each Stage Lab action has a curated scene shelf", () => {
  for (const [recipeId, action] of Object.entries(ACTION_CATALOG)) {
    assert.ok(action.scenes.length >= 2, `${recipeId} needs at least two scene choices`);
    assert.equal(defaultSceneForAction(recipeId), action.scenes[0]);
    assert.deepEqual(scenesForAction(recipeId), action.scenes);
    for (const sceneId of action.scenes) assert.ok(SCENE_CATALOG[sceneId], `${sceneId} needs scene metadata`);
  }
});

test("the gesture shelf exposes distinct physical confirmation patterns", () => {
  assert.deepEqual(GESTURE_CATALOG.map((gesture) => gesture.id), ["seal-duo", "seal-one", "pulse", "seal-dial", "tap-three"]);
});

test("call, calendar, and deploy each have a purpose-built performance option", () => {
  assert.ok(scenesForAction("phone-call").includes("voice-orbit"));
  assert.ok(scenesForAction("calendar-create").includes("calendar-orbit"));
  assert.ok(scenesForAction("deploy").includes("launch-rail"));
  assert.ok(scenesForAction("file-share").includes("prism-relay"));
});

test("message actions can opt into the high-energy Neon Run performance", () => {
  for (const recipeId of ["email-send", "slack-send", "file-share"]) {
    assert.ok(scenesForAction(recipeId).includes("neon-run"), `${recipeId} should offer Neon Run`);
  }
  assert.equal(SCENE_CATALOG["neon-run"].family, "neon");
});

test("each task type has a purpose-built story instead of sharing one transfer animation", () => {
  const storyByAction = {
    "email-send": "inkwell-atelier",
    "phone-call": "switchboard",
    "slack-send": "chorus-room",
    "calendar-create": "time-garden",
    deploy: "release-forge",
    "file-share": "vault-ritual",
  };

  for (const [recipeId, sceneId] of Object.entries(storyByAction)) {
    assert.ok(scenesForAction(recipeId).includes(sceneId), `${recipeId} should offer ${sceneId}`);
    assert.equal(SCENE_CATALOG[sceneId].family, "story");
  }
});

test("every scene offered in an action shelf accepts that action category", async () => {
  for (const [recipeId, action] of Object.entries(ACTION_CATALOG)) {
    const recipe = JSON.parse(await readFile(new URL(`../../recipes/${recipeId}/recipe.json`, import.meta.url), "utf8"));
    for (const sceneId of action.scenes) {
      const scene = JSON.parse(await readFile(new URL(`../../scene-packs/${sceneId}/scene.json`, import.meta.url), "utf8"));
      assert.ok(
        scene.matches.categories.includes(recipe.category),
        `${sceneId} must accept ${recipe.category} when offered for ${recipeId}`,
      );
    }
  }
});
