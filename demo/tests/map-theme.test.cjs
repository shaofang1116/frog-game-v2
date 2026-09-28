const test = require('node:test');
const assert = require('node:assert/strict');

const FrogMapTheme = require('../src/map-theme.js');

const protectedIds = [
  'frog.player',
  'surface.lily-pad.normal',
  'surface.lily-pad.sinking',
  'hazard.crocodile',
  'hazard.crocodile.warning-wake',
  'reward.flower',
  'reward.golden-lotus',
  'item.bomb',
  'item.bomb-pickup',
  'preview.jump-target',
  'ui.hud',
  'ui.control.dpad',
  'ui.control.bomb'
];

test('normalizes a valid manifest into a deeply frozen visual package', () => {
  const result = FrogMapTheme.normalizeManifest(validManifest());

  assert.equal(result.ok, true);
  assert.equal(result.value.packageId, 'fixture-map');
  assert.equal(result.value.layers[0].assetUrl, 'assets/atmosphere.webp');
  assert.ok(Object.isFrozen(result.value));
  assert.ok(Object.isFrozen(result.value.layers));
  assert.ok(Object.isFrozen(result.value.layers[0]));
  assert.ok(Object.isFrozen(result.value.layers[0].motion));
  assert.throws(() => result.value.layers.push({}), TypeError);
  result.value.palette.water = '#000000';
  assert.equal(result.value.palette.water, '#123456');
});

test('rejects malformed manifests, protected registry overrides, and non-local assets', () => {
  for (const [name, mutate] of [
    ['unknown field', (manifest) => { manifest.unapproved = true; }],
    ['duplicate layer ID', (manifest) => { manifest.layers.push({ ...manifest.layers[0] }); }],
    ['protected override', (manifest) => { manifest.protectedElements['frog.player'] = 'custom'; }],
    ['missing protected ID', (manifest) => { delete manifest.protectedElements['ui.hud']; }],
    ['remote asset', (manifest) => { manifest.layers[0].asset = 'https://example.test/asset.webp'; }],
    ['absolute asset', (manifest) => { manifest.layers[0].asset = '/assets/asset.webp'; }],
    ['traversal asset', (manifest) => { manifest.layers[0].asset = '../asset.webp'; }]
  ]) {
    const manifest = validManifest();
    mutate(manifest);
    const result = FrogMapTheme.normalizeManifest(manifest);
    assert.equal(result.ok, false, name);
    assert.match(result.diagnostic, /map theme/i, name);
  }
});

test('validates runtime receipts against the manifest and computed content hash', () => {
  const manifest = validManifest();
  const receipt = validReceipt();

  assert.deepEqual(
    FrogMapTheme.validateRuntimeReceipt(manifest, receipt, { contentHash: receipt.packageContentHash }),
    { ok: true }
  );

  for (const [name, mutate] of [
    ['missing receipt', (_receipt) => null],
    ['package ID mismatch', (value) => { value.packageId = 'other-map'; return value; }],
    ['revision mismatch', (value) => { value.revisionId = 'other-revision'; return value; }],
    ['mapping approval mismatch', (value) => { value.mappingApprovalHash = 'b'.repeat(64); return value; }],
    ['content hash mismatch', (value) => { value.packageContentHash = 'b'.repeat(64); return value; }]
  ]) {
    const value = receipt ? structuredClone(receipt) : receipt;
    const candidate = mutate(value);
    const result = FrogMapTheme.validateRuntimeReceipt(manifest, candidate, { contentHash: receipt.packageContentHash });
    assert.equal(result.ok, false, name);
  }
});

test('loads only receipt-qualified production packages and uses neutral fallback on errors', async () => {
  const manifest = validManifest();
  const receipt = validReceipt();
  const calls = [];
  const result = await FrogMapTheme.loadTheme({
    packageId: 'fixture-map',
    fetchJson: async (url) => {
      calls.push(url);
      return url.endsWith('map-theme.json') ? manifest : receipt;
    },
    hashPackage: async () => receipt.packageContentHash
  });

  assert.equal(result.kind, 'package');
  assert.equal(result.mode, 'production');
  assert.deepEqual(calls, [
    'demo/maps/fixture-map/map-theme.json',
    'demo/maps/fixture-map/import-receipt.json'
  ]);

  const fallback = await FrogMapTheme.loadTheme({
    packageId: 'fixture-map',
    fetchJson: async () => {
      throw new Error('network unavailable');
    }
  });
  assert.equal(fallback.kind, 'fallback');
  assert.equal(fallback.theme.presetId, 'neutral-water');
  assert.match(fallback.diagnostic, /network unavailable/i);
});

test('enforces the preview and production loading matrix and preview-root containment', async () => {
  const manifest = validManifest();
  const previewRoot = 'map-theme-staging/morning-mist-v1/revisions/r0001/build';
  const loadedPreview = await FrogMapTheme.loadTheme({
    packageId: 'fixture-map',
    previewRoots: { morningThemePreviewRoot: previewRoot, stormThemePreviewRoot: 'map-theme-staging/storm-deep-lake-v1/revisions/r0002/build' },
    previewKey: 'morningThemePreviewRoot',
    fetchJson: async (url) => {
      assert.equal(url, `${previewRoot}/map-theme.json`);
      return manifest;
    }
  });
  assert.equal(loadedPreview.kind, 'package');
  assert.equal(loadedPreview.mode, 'preview');

  const productionWithPreviewParameters = await FrogMapTheme.loadTheme({
    packageId: 'fixture-map',
    fetchJson: async (url) => url.endsWith('map-theme.json') ? manifest : validReceipt(),
    hashPackage: async () => validReceipt().packageContentHash
  });
  assert.equal(productionWithPreviewParameters.mode, 'production');

  for (const [name, options] of [
    ['missing preview pair', { previewRoots: { morningThemePreviewRoot: previewRoot }, previewKey: 'morningThemePreviewRoot' }],
    ['unknown preview key', { previewRoots: { morningThemePreviewRoot: previewRoot, stormThemePreviewRoot: previewRoot }, previewKey: 'otherPreviewRoot' }],
    ['absolute preview root', { previewRoots: { morningThemePreviewRoot: '/map-theme-staging/a/build', stormThemePreviewRoot: previewRoot }, previewKey: 'morningThemePreviewRoot' }],
    ['cross-origin preview root', { previewRoots: { morningThemePreviewRoot: 'https://example.test/map-theme-staging/a/build', stormThemePreviewRoot: previewRoot }, previewKey: 'morningThemePreviewRoot' }],
    ['traversal preview root', { previewRoots: { morningThemePreviewRoot: 'map-theme-staging/a/../b/build', stormThemePreviewRoot: previewRoot }, previewKey: 'morningThemePreviewRoot' }],
    ['outside staging root', { previewRoots: { morningThemePreviewRoot: 'demo/maps/fixture-map', stormThemePreviewRoot: previewRoot }, previewKey: 'morningThemePreviewRoot' }]
  ]) {
    const result = await FrogMapTheme.loadTheme({
      packageId: 'fixture-map',
      fetchJson: async () => manifest,
      ...options
    });
    assert.equal(result.kind, 'fallback', name);
    assert.equal(result.mode, 'preview', name);
  }
});

function validManifest() {
  return {
    schemaVersion: 1,
    packageId: 'fixture-map',
    displayName: 'Fixture',
    sourceEvidence: {
      revisionId: 'fixture-map',
      sourceBundleHash: 'a'.repeat(64),
      briefHash: 'a'.repeat(64),
      provenanceId: 'fixture-art',
      provenanceHash: 'a'.repeat(64),
      mappingApprovalHash: 'a'.repeat(64),
      rightsStatus: 'owned'
    },
    compatibility: { rendererVersion: '1', elementLibraryVersion: '1' },
    viewport: { aspectRatio: '8:15', logicalWidth: 960, logicalHeight: 1800, cameraModel: 'top-down', safeZones: [{ x: 0, y: 0, width: 1, height: 0.1 }] },
    palette: { water: '#123456', reflection: '#ffffff', weather: '#abcdef', atmosphere: '#eeeeee' },
    layers: [{ id: 'water', role: 'water-base', zBand: 0, asset: 'assets/atmosphere.webp', blendMode: 'source-over', opacity: 1, parallax: 0, motion: { maxInstances: 0 }, exclusionPolicy: 'avoid-gameplay' }],
    ambience: {},
    exclusionZones: [],
    semanticBindings: [],
    protectedElements: Object.fromEntries(protectedIds.map((id) => [id, 'inherit-only'])),
    budgets: { compressedBytes: 20, drawCalls: 1, visibleInstances: 1, motionInstances: 0 },
    fallback: { presetId: 'neutral-water', color: '#123456', density: 0.2 }
  };
}

function validReceipt() {
  return {
    schemaVersion: 1,
    packageId: 'fixture-map',
    revisionId: 'fixture-map',
    packageContentHash: 'a'.repeat(64),
    mappingApprovalHash: 'a'.repeat(64),
    validationReportHash: 'a'.repeat(64),
    reviewEvidenceHash: 'a'.repeat(64),
    mappingApprovalId: 'mapping-fixture',
    importApprovalHash: 'a'.repeat(64),
    importApprovalId: 'import-fixture',
    importedAt: '2026-09-28T00:00:00Z'
  };
}
