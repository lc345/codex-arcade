// Test-only instrumentation of the companion's own WebKit documents.
(() => {
  const raf = window.requestAnimationFrame.bind(window), started = performance.now();
  const gaps = [], costs = []; let last = 0, mutations = 0, calls = 0, moves = 0;
  const visibility = [];
  let zipperProgress = 0;
  if (new URLSearchParams(location.search).get('game') === 'zipper-run') {
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
      if (/^\d+ \/ 410$/.test(text)) zipperProgress = Math.max(zipperProgress, Number(text.split(' ')[0]));
      return fillText.call(this, text, ...args);
    };
  }
  const inputGaps = []; let lastInput = 0, trustedMoves = 0;
  document.addEventListener('pointermove', e => { if (!e.isTrusted) return; trustedMoves++; const now = performance.now(); if (lastInput) inputGaps.push(now-lastInput); lastInput = now; });
  for (const type of ['blur', 'focus', 'agent-stage-host-visibility']) window.addEventListener(type, e => visibility.push({type, at: performance.now(), visible: e.detail?.visible}));
  function sample(t) {
    if (last && t - started > 2500) { gaps.push(t - last); if (gaps.length > 1200) gaps.shift(); }
    last = t; raf(sample);
  }
  raf(sample);
  window.requestAnimationFrame = callback => raf(t => {
    const before = performance.now();
    try { callback(t); } finally {
      if (t - started > 2500) { calls++; costs.push(performance.now() - before); if (costs.length > 1200) costs.shift(); }
    }
  });
  new MutationObserver(records => { if (performance.now() - started > 2500) mutations += records.length; }).observe(document, { attributes: true, childList: true, subtree: true, characterData: true });
  window.__agentStageProfile = () => {
    const sorted = [...gaps].sort((a, b) => a - b), work = [...costs].sort((a, b) => a - b);
    const q = (xs, p) => xs[Math.floor((xs.length - 1) * p)] ?? 0;
    return { samples: gaps.length, fps: gaps.length ? 1000 * gaps.length / gaps.reduce((a, b) => a + b, 0) : 0, p50: q(sorted, .5), p95: q(sorted, .95), p99: q(sorted, .99), maxGap: q(sorted, 1), over25: gaps.filter(x => x > 25).length, callbackP95: q(work, .95), callbackMax: q(work, 1), calls, mutations, moves, visibility,
      zipperProgress, trustedMoves, inputP95: q([...inputGaps].sort((a,b)=>a-b), .95), inputMax: Math.max(0, ...inputGaps), canvases: [...document.querySelectorAll('canvas')].filter(c => !c.hidden).map(c => ({ width: c.width, height: c.height, cssWidth: c.getBoundingClientRect().width })), hidden: document.hidden };
  };
  // Exercise gameplay without automating or inspecting another application's UI.
  if (window === window.top && !window.__agentStageManualProfile) {
    const timer = setInterval(() => {
      const fire = document.querySelector('#fire');
      if (fire && !fire.disabled) {
        fire.click(); clearInterval(timer);
        if (!window.__agentStageNativeInput && new URLSearchParams(location.search).get('game') === 'zipper-run') {
          const canvas = document.querySelector('#stage-canvas');
          // Synthetic input in this isolated test only; no system cursor or other app is touched.
          canvas.setPointerCapture = () => {};
          const emit = (type, y) => {
            const r = canvas.getBoundingClientRect(), x = 480 + Math.sin((y - 118) * .013) * 115;
            canvas.dispatchEvent(new PointerEvent(type, {pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1, bubbles: true, clientX: r.x + x / 960 * r.width, clientY: r.y + y / 640 * r.height}));
          };
          const begin = performance.now(); emit('pointerdown', 120);
          const drag = now => { const y = 120 + Math.min(390, (now - begin) * .018); emit('pointermove', y); moves++; if (now - begin < 22000) raf(drag); else emit('pointerup', y); };
          raf(drag);
        }
      }
    }, 200);
    setTimeout(() => clearInterval(timer), 10000);
  }
})();
