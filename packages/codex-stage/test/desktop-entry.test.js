import test from "node:test";
import assert from "node:assert/strict";
import { classifyDesktop, selectLocalCodexTarget, liveGameURL } from "../src/desktop-entry.js";
test("desktop recognition uses verified bundle id, not the app filename", () => {
  assert.equal(classifyDesktop([{ path: "/Applications/ChatGPT.app", bundleId: "com.openai.codex", running: true }]).path, "/Applications/ChatGPT.app");
  assert.equal(classifyDesktop([{ path: "/Applications/Codex.app", bundleId: "evil", running: true }]), null);
});
test("CDP refuses web pages, remote sockets, credentials and wrong ports", () => {
  const good = { type: "page", url: "app://-/index.html", webSocketDebuggerUrl: "ws://127.0.0.1:9341/devtools/page/abc" };
  assert.equal(selectLocalCodexTarget([good], 9341), good);
  for (const item of [{ ...good, url: "https://example.org" }, { ...good, webSocketDebuggerUrl: "ws://example.org:9341/a" }, { ...good, webSocketDebuggerUrl: "ws://user@127.0.0.1:9341/a" }, { ...good, webSocketDebuggerUrl: "ws://127.0.0.1:9222/a" }]) assert.equal(selectLocalCodexTarget([item], 9341), null);
});
test("live window URL keeps credentials in a fragment and never accepts a remote endpoint", () => {
  const state = { token: "a".repeat(48), events: "http://127.0.0.1:4282/v1/events" };
  const url = new URL(liveGameURL(state)); assert.equal(url.origin, "http://127.0.0.1:4173"); assert.equal(url.searchParams.has("token"), false); assert.ok(url.hash.includes("token="));
  for (const events of ["https://example.org/v1/events", "http://user@127.0.0.1:4282/v1/events", "http://127.0.0.1:4282/other"]) assert.throws(() => liveGameURL({ ...state, events }));
  assert.throws(() => liveGameURL({ ...state, token: "not-token" }));
});
