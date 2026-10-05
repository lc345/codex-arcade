import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const [plistPath, runtimeRoot, nodePath, cdpPort, logPath] = process.argv.slice(2);
if (![plistPath, runtimeRoot, nodePath, cdpPort, logPath].every(Boolean)) {
  throw new Error("Usage: write-launch-agent.mjs <plist-path> <runtime-root> <node-path> <cdp-port> <log-path>");
}

function escapeXml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function string(value) {
  return `<string>${escapeXml(value)}</string>`;
}

const launcher = `${runtimeRoot}/macos/scripts/agent-stage-launcher.sh`;
// This job hosts a visible WKWebView. Background policy throttles its timers and input.
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key>${string("com.agentstage.codex")}
  <key>ProgramArguments</key><array>${string("/bin/bash")}${string(launcher)}</array>
  <key>EnvironmentVariables</key><dict>
    <key>AGENT_STAGE_NODE</key>${string(nodePath)}
    <key>AGENT_STAGE_CDP_PORT</key>${string(cdpPort)}
    <key>AGENT_STAGE_RUNTIME_ROOT</key>${string(runtimeRoot)}
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ProcessType</key>${string("Interactive")}
  <key>StandardOutPath</key>${string(logPath)}
  <key>StandardErrorPath</key>${string(logPath)}
</dict></plist>
`;

await mkdir(dirname(plistPath), { recursive: true });
const temporaryPath = `${plistPath}.${process.pid}.tmp`;
await writeFile(temporaryPath, xml, { encoding: "utf8", mode: 0o600 });
await rename(temporaryPath, plistPath);
