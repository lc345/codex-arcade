import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);

export function classifyDesktop(apps) {
  return apps.find(a => a.bundleId === "com.openai.codex" && a.running) ?? apps.find(a => a.bundleId === "com.openai.codex") ?? null;
}
export async function discoverDesktop() {
  if (process.platform !== "darwin") return null;
  let running = [];
  try { const { stdout } = await exec("/bin/ps", ["-ax", "-o", "comm="]); running = [...new Set(stdout.split("\n").map(s => s.match(/^(.*\.app)\/Contents\/MacOS\/[^/]+$/)?.[1]).filter(Boolean))]; } catch {}
  const paths = [...new Set([...running, "/Applications/Codex.app", "/Applications/ChatGPT.app"])], apps = [];
  for (const path of paths) {
    if (!/\/(Codex|ChatGPT)([^/]*)\.app$/.test(path)) continue;
    try { const { stdout } = await exec("/usr/libexec/PlistBuddy", ["-c", "Print:CFBundleIdentifier", `${path}/Contents/Info.plist`]); apps.push({ path, bundleId: stdout.trim(), running: running.includes(path) }); } catch {}
  }
  return classifyDesktop(apps);
}
export function selectLocalCodexTarget(list, port) {
  if (!Array.isArray(list) || !Number.isInteger(port) || port < 1 || port > 65535) return null;
  return list.find(item => {
    if (item?.type !== "page" || !/^app:\/\//.test(item.url ?? "")) return false;
    try { const u = new URL(item.webSocketDebuggerUrl); return u.protocol === "ws:" && ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname) && Number(u.port) === port && !u.username && !u.password && u.pathname.startsWith("/devtools/page/"); } catch { return false; }
  }) ?? null;
}
export function liveGameURL(state, webPort = 4173) {
  const events = new URL(state?.events);
  if (events.protocol !== "http:" || events.hostname !== "127.0.0.1" || events.username || events.password || events.pathname !== "/v1/events" || events.search || events.hash || !/^[a-f0-9]{48}$/.test(state.token ?? "") || !Number.isInteger(webPort) || webPort < 1 || webPort > 65535) throw new Error("Invalid local Agent Stage state");
  const url = new URL(`http://127.0.0.1:${webPort}/codex-stage`);
  url.hash = new URLSearchParams({ token: state.token, daemon: events.origin }).toString(); return url.toString();
}
