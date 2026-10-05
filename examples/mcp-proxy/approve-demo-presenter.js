#!/usr/bin/env node
// Demo only. A real presenter should render the request on a trusted local UI
// or hardware device and output its deliberate human decision as JSON.
process.stdin.resume();
process.stdin.on("end", () => {
  process.stdout.write(JSON.stringify({ outcome: "approve_once", method: "hold", reason: "Demo presenter" }));
});
