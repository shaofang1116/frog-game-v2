const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const schemaDir = path.join(repoRoot, 'schemas', 'map-theme');
const hashes = 'a'.repeat(64);

test('all version-1 governance schemas load with immutable identifiers', async () => {
  const { loadMapThemeSchemas } = await import('../../scripts/lib/map-theme-schema.mjs');
  const { schemas } = await loadMapThemeSchemas(schemaDir);
  assert.equal(schemas.length, 17);
  for (const { file, schema } of schemas) {
    assert.match(schema.$id, /-v1\.schema\.json$/);
    if (file !== 'common-v1.schema.json') assert.equal(schema.additionalProperties, false);
  }
});

test('package schema rejects unknown fields, invalid assets, and protected overrides', async () => {
  const { loadMapThemeSchemas } = await import('../../scripts/lib/map-theme-schema.mjs');
  const { ajv } = await loadMapThemeSchemas(schemaDir);
  const validate = ajv.getSchema('map-theme-package-v1.schema.json');
  const packageData = validPackage();
  assert.equal(validate(packageData), true, ajv.errorsText(validate.errors));
  assert.equal(validate({ ...packageData, status: 'APPROVED' }), false);
  packageData.layers[0].asset = '../outside.webp';
  assert.equal(validate(packageData), false);
  packageData.layers[0].asset = 'assets/atmosphere.webp';
  packageData.protectedElements['frog.player'] = 'custom';
  assert.equal(validate(packageData), false);
});

test('canonical JSON and source/package hash protocols are deterministic', async () => {
  const { canonicalJsonHash, packageContentHash, sourceBundleHash } =
    await import('../../scripts/lib/map-theme-hash.mjs');
  assert.equal(canonicalJsonHash({ b: 'x', a: 1 }), canonicalJsonHash({ a: 1, b: 'x' }));
  const sourceHash = await sourceBundleHash({
    files: [{ role: 'source-design', path: 'design.png', mediaType: 'image/png', sha256: hashes }]
  });
  assert.match(sourceHash, /^[a-f0-9]{64}$/);
  await assert.rejects(
    sourceBundleHash({ files: [
      { role: 'source-design', path: 'a.png', mediaType: 'image/png', sha256: hashes },
      { role: 'source-design', path: 'b.png', mediaType: 'image/png', sha256: hashes }
    ] }),
    /Duplicate/
  );
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'map-theme-'));
  try {
    await fs.mkdir(path.join(root, 'assets'));
    await fs.writeFile(path.join(root, 'assets', 'atmosphere.webp'), 'asset');
    const manifest = validPackage();
    const value = await packageContentHash(root, manifest);
    assert.match(value, /^[a-f0-9]{64}$/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

function validPackage() {
  const protectedElements = {};
  for (const id of [
    'frog.player', 'surface.lily-pad.normal', 'surface.lily-pad.sinking',
    'hazard.crocodile', 'hazard.crocodile.warning-wake', 'reward.flower',
    'reward.golden-lotus', 'item.bomb', 'item.bomb-pickup',
    'preview.jump-target', 'ui.hud', 'ui.control.dpad', 'ui.control.bomb'
  ]) protectedElements[id] = 'inherit-only';
  return {
    schemaVersion: 1, packageId: 'morning-mist', displayName: 'Morning Mist',
    sourceEvidence: { revisionId: 'r0001', sourceBundleHash: hashes, briefHash: hashes,
      provenanceId: 'original-art', provenanceHash: hashes, mappingApprovalHash: hashes, rightsStatus: 'owned' },
    compatibility: { rendererVersion: '1', elementLibraryVersion: '1' },
    viewport: { aspectRatio: '8:15', logicalWidth: 960, logicalHeight: 1800,
      cameraModel: 'top-down', safeZones: [{ x: 0, y: 0, width: 1, height: 0.1 }] },
    palette: { water: '#123456', reflection: '#ffffff', weather: '#abcdef', atmosphere: '#eeeeee' },
    layers: [{ id: 'water', role: 'water-base', zBand: 0, asset: 'assets/atmosphere.webp',
      blendMode: 'source-over', opacity: 1, parallax: 0, motion: { maxInstances: 0 }, exclusionPolicy: 'avoid-gameplay' }],
    ambience: {}, exclusionZones: [], semanticBindings: [], protectedElements,
    budgets: { compressedBytes: 1, drawCalls: 1, visibleInstances: 1, motionInstances: 0 },
    fallback: { presetId: 'neutral-water', color: '#123456', density: 0.2 }
  };
}
