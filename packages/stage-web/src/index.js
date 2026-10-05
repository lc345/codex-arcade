import { createPixiStageRenderer } from "./pixi-renderer.js";
import { createCanvasStageRenderer } from "./renderer.js";

export * from "./timeline.js";
export { createCanvasStageRenderer, createPixiStageRenderer };

/** Uses PixiJS when the host loaded it, while retaining a no-dependency Canvas fallback. */
export function createStageRenderer(canvas, options = {}) {
  if (!globalThis.PIXI?.Application) return createCanvasStageRenderer(canvas, options);
  let fallback = null;
  const canvasFallback = (request) => {
    fallback ??= createCanvasStageRenderer(canvas, options);
    if (request?.presentation) fallback.render(request.presentation, { slots: request.labels, reducedMotion: request.reducedMotion });
  };
  return createPixiStageRenderer(canvas, { ...options, onFailure: canvasFallback });
}
