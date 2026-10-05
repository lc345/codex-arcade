import { randomBytes } from "node:crypto";
import { createCodexStageDaemon } from "./daemon.js";

const token = process.env.AGENT_STAGE_TOKEN ?? randomBytes(24).toString("hex");
const daemon = createCodexStageDaemon({ token });
const { port } = await daemon.start({ port: Number(process.env.AGENT_STAGE_PORT ?? 4282) });
process.stdout.write(JSON.stringify({ type: "agent-stage.ready", port, token }) + "\n");
process.on("SIGINT", () => daemon.stop().then(() => process.exit(0)));
process.on("SIGTERM", () => daemon.stop().then(() => process.exit(0)));
