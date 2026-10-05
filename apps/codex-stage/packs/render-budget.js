// Layout stays in game coordinates; the backing buffer follows displayed pixels.
export function stagePixelRatio(canvas, cap = 2, deviceRatio = globalThis.devicePixelRatio || 1) {
  const scale = Number(canvas.ownerDocument?.documentElement?.dataset.stageRenderScale);
  return Math.min(cap, deviceRatio) * (Number.isFinite(scale) && scale > 0 && scale <= 1 ? scale : 1);
}
