(function exposeGameElements(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.FrogGameElements = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createGameElements() {
  const libraryVersion = 1;
  const definitions = freezeDefinitions([
    ['frog.player', ['default']],
    ['surface.lily-pad.normal', ['default']],
    ['surface.lily-pad.sinking', ['default', 'damage']],
    ['hazard.crocodile', ['default']],
    ['hazard.crocodile.warning-wake', ['default']],
    ['reward.flower', ['default']],
    ['reward.golden-lotus', ['collectible', 'landmark']],
    ['item.bomb', ['default']],
    ['item.bomb-pickup', ['default']],
    ['preview.jump-target', ['default', 'charged']],
    ['ui.hud', ['default']],
    ['ui.control.dpad', ['default']],
    ['ui.control.bomb', ['default']]
  ]);
  const protectedElements = Object.freeze(
    Object.fromEntries(Object.keys(definitions).map((id) => [id, 'inherit-only']))
  );

  function getElementDefinition(id) {
    return definitions[id] || null;
  }

  function hasVariant(id, variant) {
    const definition = getElementDefinition(id);
    return Boolean(definition && definition.variants.includes(variant));
  }

  function drawLilyPad(ctx, x, y, r, isSinking, sinkTime) {
    if (r <= 2) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(10, 30, 45, 0.4)';
    ctx.beginPath();
    ctx.ellipse(2, 6, r * 1.05, r * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isSinking ? '#8cb369' : '#2d6a4f';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0.25, Math.PI * 2 - 0.25);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = isSinking ? '#bc4749' : '#52b788';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    if (isSinking && sinkTime > 0) {
      ctx.fillStyle = 'rgba(230, 57, 70, 0.7)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⏳', 0, 0);
    }
    ctx.restore();
  }

  function drawFlower(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y - 4);
    const petals = 6;
    ctx.fillStyle = '#ff4d6d';
    for (let i = 0; i < petals; i++) {
      ctx.rotate((Math.PI * 2) / petals);
      ctx.beginPath();
      ctx.ellipse(0, 7, 3.5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawGoldenLotus(ctx, x, y, variant) {
    const isLandmark = variant === 'landmark';
    const scale = isLandmark ? 1.45 : 1;
    const petalColor = isLandmark ? '#ffd166' : '#ffb703';

    ctx.save();
    ctx.translate(x, y - 5);
    ctx.scale(scale, scale);
    ctx.fillStyle = petalColor;
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.ellipse(0, 8, 3.8, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBombPickup(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(0, 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffb703';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(2, -4);
    ctx.lineTo(6, -8);
    ctx.stroke();
    ctx.restore();
  }

  function drawWarningWake(ctx) {
    ctx.strokeStyle = 'rgba(230, 57, 70, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-25, -12, 50, 24);
  }

  function drawCrocodile(ctx, x, y, goingRight) {
    ctx.save();
    ctx.translate(x, y);
    if (!goingRight) ctx.scale(-1, 1);
    drawWarningWake(ctx);
    ctx.fillStyle = '#1e441e';
    ctx.beginPath();
    ctx.roundRect(-22, -9, 44, 18, [8, 14, 14, 8]);
    ctx.fill();
    ctx.fillStyle = '#2d6a4f';
    for (let sx = -14; sx <= 14; sx += 8) {
      ctx.beginPath();
      ctx.moveTo(sx, -9);
      ctx.lineTo(sx + 3, -14);
      ctx.lineTo(sx + 6, -9);
      ctx.fill();
    }
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.arc(10, -5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(11, -6, 1.5, 3);
    ctx.restore();
  }

  function drawFrog(ctx, frog) {
    ctx.save();
    ctx.translate(frog.visualX, frog.visualY);

    let jumpElevation = 0;
    let scaleX = 1;
    let scaleY = 1;
    if (frog.isJumping) {
      jumpElevation = Math.sin(frog.jumpProgress * Math.PI) * (frog.jumpSteps === 2 ? 32 : 22);
      scaleX = 1 - Math.sin(frog.jumpProgress * Math.PI) * 0.25;
      scaleY = 1 + Math.sin(frog.jumpProgress * Math.PI) * 0.35;
    }
    ctx.translate(0, -jumpElevation);
    ctx.scale(scaleX, scaleY);

    if (jumpElevation > 0) {
      ctx.save();
      ctx.translate(0, jumpElevation);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 16 * (1 - jumpElevation / 60), 8 * (1 - jumpElevation / 60), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = frog.isJumping && frog.jumpSteps === 2 ? '#9ef01a' : '#70e000';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38b000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#70e000';
    ctx.beginPath();
    ctx.arc(-8, -10, 6.5, 0, Math.PI * 2);
    ctx.arc(8, -10, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-8, -10, 4.5, 0, Math.PI * 2);
    ctx.arc(8, -10, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#102027';
    ctx.beginPath();
    ctx.arc(-8, -10, 2.5, 0, Math.PI * 2);
    ctx.arc(8, -10, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 77, 109, 0.45)';
    ctx.beginPath();
    ctx.arc(-10, 2, 3, 0, Math.PI * 2);
    ctx.arc(10, 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#004b23';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 2, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.restore();
  }

  function drawJumpPreview(ctx, x, y, tileSize, pulse, variant) {
    const isCharged = variant === 'charged';
    ctx.save();
    ctx.strokeStyle = isCharged ? '#ffb703' : '#52b788';
    ctx.fillStyle = isCharged ? 'rgba(255, 183, 3, 0.18)' : 'rgba(82, 183, 136, 0.18)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(x, y, tileSize * 0.32 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function freezeDefinitions(entries) {
    const result = {};
    for (const [id, variants] of entries) {
      result[id] = Object.freeze({
        id,
        variants: Object.freeze(variants.slice())
      });
    }
    return Object.freeze(result);
  }

  return Object.freeze({
    libraryVersion,
    protectedElements,
    getElementDefinition,
    hasVariant,
    drawLilyPad,
    drawFlower,
    drawGoldenLotus,
    drawBombPickup,
    drawWarningWake,
    drawCrocodile,
    drawFrog,
    drawJumpPreview
  });
});
