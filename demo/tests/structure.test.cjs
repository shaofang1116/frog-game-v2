const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const expectedBaselineHash =
  '00a079310d941c0238b8dca505811369ef1448b0e60c80088ffccca353f830bd';

test('the authoritative root and frozen demo baseline remain unchanged', () => {
  assert.equal(hashFile(path.join(repoRoot, 'index.html')), expectedBaselineHash);
  assert.equal(
    hashFile(path.join(repoRoot, 'demo', 'baseline-6376422', 'index.html')),
    expectedBaselineHash
  );
});

test('the demo loads input and journey policies without the legacy charge control', () => {
  const html = fs.readFileSync(path.join(repoRoot, 'demo', 'index.html'), 'utf8');

  assert.match(html, /<script src="\.\/src\/input\.js"><\/script>/);
  assert.match(html, /<script src="\.\/src\/journey\.js"><\/script>/);
  assert.doesNotMatch(html, /id="btn-charge"/);
  assert.doesNotMatch(html, /chargeMode/);
});

test('the demo inline script parses as JavaScript', () => {
  const html = fs.readFileSync(path.join(repoRoot, 'demo', 'index.html'), 'utf8');
  const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];

  assert.equal(inlineScripts.length, 1);
  assert.doesNotThrow(() => new Function(inlineScripts[0][1]));
});

test('the demo buffers one jump while airborne and clears it at reset boundaries', () => {
  const html = fs.readFileSync(path.join(repoRoot, 'demo', 'index.html'), 'utf8');

  assert.match(html, /inputBuffer:\s*FrogInput\.createSingleInputBuffer\(\)/);
  assert.match(
    html,
    /if \(this\.frog\.isJumping\) \{\s*this\.inputBuffer\.put\(jump\);\s*return;\s*\}/
  );
  assert.match(html, /const nextJump = this\.inputBuffer\.take\(\)/);
  assert.match(html, /this\.triggerJump\(nextJump\.direction, nextJump\.steps\)/);
  assert.ok(
    [...html.matchAll(/this\.inputBuffer\.clear\(\)/g)].length >= 3,
    'start, gameOver, and touchcancel must clear buffered input'
  );
});

test('the D-Pad binds one touch identifier and suppresses compatibility clicks', () => {
  const html = fs.readFileSync(path.join(repoRoot, 'demo', 'index.html'), 'utf8');

  assert.match(html, /holdGesture\.start\(dir,\s*touch\.identifier\)/);
  assert.match(html, /holdGesture\.end\(e\.changedTouches\[i\]\.identifier\)/);
  assert.match(html, /holdGesture\.cancel\(e\.changedTouches\[i\]\.identifier\)/);
  assert.match(
    html,
    /FrogInput\.isCompatibilityClick\(lastTouchAt,\s*Date\.now\(\)\)/
  );
});

test('the D-Pad cancels its owned gesture when the touch leaves its button', () => {
  const html = fs.readFileSync(path.join(repoRoot, 'demo', 'index.html'), 'utf8');
  const touchMoveHandler = html.match(
    /btn\.addEventListener\('touchmove', \(e\) => \{([\s\S]*?)\n\s*\}, \{ passive: false \}\);/
  );

  assert.ok(touchMoveHandler);
  assert.match(touchMoveHandler[1], /btn\.getBoundingClientRect\(\)/);
  assert.match(
    touchMoveHandler[1],
    /holdGesture\.cancel\(touch\.identifier\)[\s\S]*?lastTouchAt = Date\.now\(\);[\s\S]*?this\.inputBuffer\.clear\(\)/
  );
});

test('page interruptions cancel the active D-Pad gesture and buffered input', () => {
  const html = fs.readFileSync(path.join(repoRoot, 'demo', 'index.html'), 'utf8');
  const cancelActiveTouch = html.match(
    /const cancelActiveTouch = \(\) => \{([\s\S]*?)\n\s*\};/
  );

  assert.ok(cancelActiveTouch);
  assert.match(cancelActiveTouch[1], /holdGesture\.cancelActive\(\)/);
  assert.match(cancelActiveTouch[1], /lastTouchAt = Date\.now\(\)/);
  assert.match(cancelActiveTouch[1], /this\.inputBuffer\.clear\(\)/);
  assert.match(html, /window\.addEventListener\('blur', cancelActiveTouch\)/);
  assert.match(
    html,
    /document\.addEventListener\('visibilitychange',[\s\S]*?document\.hidden[\s\S]*?cancelActiveTouch\(\)/
  );
  assert.match(
    html,
    /window\.addEventListener\('orientationchange', cancelActiveTouch\)/
  );
});

test('the Canvas binds the swipe hold policy and shares global cancellation', () => {
  const html = fs.readFileSync(path.join(repoRoot, 'demo', 'index.html'), 'utf8');
  const cancelActiveTouch = html.match(
    /const cancelActiveTouch = \(\) => \{([\s\S]*?)\n\s*\};/
  );

  assert.match(html, /const swipeGesture = FrogInput\.createSwipeHoldGesture\(\{/);
  assert.match(
    html,
    /swipeGesture\.start\(touch\.identifier,\s*touch\.clientX,\s*touch\.clientY\)/
  );
  assert.match(
    html,
    /swipeGesture\.move\(touch\.identifier,\s*touch\.clientX,\s*touch\.clientY\)/
  );
  assert.match(html, /swipeGesture\.end\(e\.changedTouches\[i\]\.identifier\)/);
  assert.match(html, /swipeGesture\.cancel\(e\.changedTouches\[i\]\.identifier\)/);
  assert.ok(cancelActiveTouch);
  assert.match(cancelActiveTouch[1], /swipeGesture\.cancelActive\(\)/);
  assert.doesNotMatch(html, /touchStart[XY]/);
});

test('the bomb touch stays independent and suppresses its compatibility click', () => {
  const html = fs.readFileSync(path.join(repoRoot, 'demo', 'index.html'), 'utf8');

  assert.match(html, /let lastBombTouchAt = 0/);
  assert.match(html, /lastBombTouchAt = Date\.now\(\)[\s\S]*?this\.throwBomb\(\)/);
  assert.match(
    html,
    /FrogInput\.isCompatibilityClick\(lastBombTouchAt,\s*Date\.now\(\)\)/
  );
});

function hashFile(filePath) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(filePath))
    .digest('hex');
}
