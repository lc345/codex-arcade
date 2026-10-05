# MCP Proxy Reference

`examples/mcp-proxy/finalbutton-mcp-proxy.js` is a transparent JSON-lines stdio proxy. It forwards initialization, list and notification messages. On `tools/call`, it creates an Action Definition using the upstream server and tool name, sends it to a FinalButton presenter, and only then forwards the original request upstream.

By design, an unknown MCP tool is high-risk. MCP annotations remain metadata hints; only an explicit host policy may lower the risk. The reference proxy binds a digest of the MCP arguments and original call shape; an upstream service that exposes a resource version should additionally provide a State Witness through a dedicated adapter before production use.

## Presenter contract

The executable in `FINALBUTTON_PRESENT_COMMAND`, with JSON-array arguments in `FINALBUTTON_PRESENT_ARGS`, receives one `ActionRequest` as JSON on stdin and must emit exactly one JSON object on stdout. The proxy uses direct process spawning rather than a shell:

```bash
export FINALBUTTON_PRESENT_COMMAND="node"
export FINALBUTTON_PRESENT_ARGS='["examples/mcp-proxy/approve-demo-presenter.js"]'
```

```json
{ "outcome": "approve_once", "method": "hold", "reason": "Optional local note" }
```

The proxy, not the presenter, creates the final HMAC signature. Put a real presenter behind this command: a local UI, a WebSocket bridge, an M5Stack bridge, Stream Deck software, or a Speakon integration. The included automatic presenter is intentionally demo-only.

## Limitations

This reference implements line-oriented stdio transport and should be treated as a starter adapter, not a production security gateway. Production deployments need upstream process supervision, a persistent receipt store, explicit tool policy, user authentication, hardened local IPC and provider-side authorization.
