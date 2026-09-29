(function exposeStageTransition(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.FrogStageTransition = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createStageTransitionModule() {
  const DURATION_MS = 1100;
  const COVER_END_MS = 420;
  const REVEAL_START_MS = 650;

  function create(options) {
    const startTime = options.startTime;
    const reducedMotion = Boolean(options.reducedMotion);
    let switched = false;
    let completed = false;
    let lastFrame = { active: true, phase: reducedMotion ? 'covered' : 'covering', progress: 0 };

    function update(now) {
      if (completed) return frame(false, 'complete', 1);

      if (reducedMotion) {
        if (!switched) {
          switched = true;
          lastFrame = frame(true, 'covered', 1, true);
          return lastFrame;
        }
        completed = true;
        lastFrame = frame(false, 'complete', 1, false, true);
        return lastFrame;
      }

      const elapsed = Math.max(0, now - startTime);
      const progress = Math.min(1, elapsed / DURATION_MS);
      const switchStage = !switched && elapsed >= COVER_END_MS;
      if (switchStage) switched = true;

      if (elapsed >= DURATION_MS) {
        completed = true;
        lastFrame = frame(false, 'complete', 1, false, true);
      } else if (elapsed < COVER_END_MS) {
        lastFrame = frame(true, 'covering', progress, switchStage);
      } else if (elapsed <= REVEAL_START_MS) {
        lastFrame = frame(true, 'covered', progress, switchStage);
      } else {
        lastFrame = frame(true, 'revealing', progress, switchStage);
      }
      return lastFrame;
    }

    function render(ctx, width, height) {
      if (!lastFrame.active) return;
      const cover = coverage(lastFrame);
      const leaves = [
        { x: width * 0.01, y: height * 0.29, radius: height * 0.43, color: '#1b604d', rotation: -0.76, dx: -1, dy: 0 },
        { x: width * 0.99, y: height * 0.25, radius: height * 0.42, color: '#4a914e', rotation: 1.4, dx: 1, dy: -0.2 },
        { x: width * 0.98, y: height * 0.74, radius: height * 0.43, color: '#286e51', rotation: 2.82, dx: 1, dy: 0.4 },
        { x: width * 0.02, y: height * 0.76, radius: height * 0.42, color: '#397e4d', rotation: -1.5, dx: -1, dy: 0.35 }
      ];

      ctx.save();
      leaves.forEach((leaf) => {
        const offset = (1 - cover) * leaf.radius * 1.08;
        const x = leaf.x + leaf.dx * offset;
        const y = leaf.y + leaf.dy * offset;
        drawLeaf(ctx, x, y, leaf.radius, leaf.rotation, leaf.color);
      });
      ctx.restore();
    }

    return Object.freeze({
      duration: DURATION_MS,
      update,
      render
    });
  }

  function frame(active, phase, progress, switchStage = false, completed = false) {
    return { active, phase, progress, switchStage, completed };
  }

  function coverage(frameState) {
    if (frameState.phase === 'covered') return 1;
    if (frameState.phase === 'covering') return easeOut(frameState.progress / (COVER_END_MS / DURATION_MS));
    if (frameState.phase === 'revealing') {
      return 1 - easeIn((frameState.progress - REVEAL_START_MS / DURATION_MS) / (1 - REVEAL_START_MS / DURATION_MS));
    }
    return 0;
  }

  function easeOut(value) {
    const clamped = clamp(value);
    return 1 - Math.pow(1 - clamped, 3);
  }

  function easeIn(value) {
    return Math.pow(clamp(value), 3);
  }

  function clamp(value) {
    return Math.max(0, Math.min(1, value));
  }

  function drawLeaf(ctx, x, y, radius, rotation, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(radius * 0.48, -radius * 0.35, radius * 0.84, -radius * 0.3);
    ctx.arc(0, 0, radius, -0.34, Math.PI * 2 + 0.34);
    ctx.quadraticCurveTo(radius * 0.48, radius * 0.35, 0, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(190, 235, 181, 0.48)';
    ctx.lineWidth = Math.max(2, radius * 0.012);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius * 0.92, 0);
    ctx.stroke();
    ctx.lineWidth = Math.max(1.5, radius * 0.006);
    for (let index = 1; index <= 5; index += 1) {
      const progress = index / 6;
      const start = radius * progress;
      const spread = radius * (0.43 - progress * 0.2);
      ctx.beginPath();
      ctx.moveTo(start, 0);
      ctx.lineTo(start + radius * 0.22, -spread);
      ctx.moveTo(start, 0);
      ctx.lineTo(start + radius * 0.22, spread);
      ctx.stroke();
    }
    ctx.restore();
  }

  return Object.freeze({ create });
});
