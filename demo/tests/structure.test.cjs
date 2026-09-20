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

function hashFile(filePath) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(filePath))
    .digest('hex');
}
