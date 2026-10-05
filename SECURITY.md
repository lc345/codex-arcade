# Security Policy

Do not publish credentials, hook input, task content, private paths, daemon/window state files or hook backups in an issue. Report vulnerabilities privately to the repository maintainers with a minimal reproduction and impact assessment. Use GitHub's private vulnerability reporting when enabled; otherwise first ask for a private contact without disclosing exploit details.

Relevant boundaries include authenticated loopback services, executable game-pack integrity, privacy filtering, installer ownership of hooks, native-window visibility and immediate input/audio cleanup when a task stops. Community game code is reviewed before inclusion; it is not sandboxed arbitrary third-party code.

The macOS beta is unsigned and unnotarized. Never disable Gatekeeper globally to install it. FinalButton/ActionProof compatibility modules do not claim secure hardware attestation or replace provider-side authorization.
