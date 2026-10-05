// App switching changes presentation only. Real turn completion remains in live-turns.
export function bindHostVisibility(host, arcade, changed = () => {}) {
  const apply = visible => { arcade.setPaused(!visible); changed(!visible); };
  const receive = event => { if (typeof event.detail?.visible === "boolean") apply(event.detail.visible); };
  host.addEventListener("agent-stage-host-visibility", receive);
  apply(host.__agentStageHostVisible !== false);
  return () => host.removeEventListener("agent-stage-host-visibility", receive);
}
