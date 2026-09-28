(function exposeMapTheme(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.FrogMapTheme = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMapTheme() {
  const manifestFields = [
    'schemaVersion', 'packageId', 'displayName', 'sourceEvidence', 'compatibility',
    'viewport', 'palette', 'layers', 'ambience', 'exclusionZones',
    'semanticBindings', 'protectedElements', 'budgets', 'fallback'
  ];
  const receiptFields = [
    'schemaVersion', 'packageId', 'revisionId', 'packageContentHash',
    'mappingApprovalHash', 'validationReportHash', 'reviewEvidenceHash',
    'mappingApprovalId', 'importApprovalHash', 'importApprovalId', 'importedAt'
  ];
  const protectedIds = [
    'frog.player', 'surface.lily-pad.normal', 'surface.lily-pad.sinking',
    'hazard.crocodile', 'hazard.crocodile.warning-wake', 'reward.flower',
    'reward.golden-lotus', 'item.bomb', 'item.bomb-pickup',
    'preview.jump-target', 'ui.hud', 'ui.control.dpad', 'ui.control.bomb'
  ];
  const previewKeys = Object.freeze(['morningThemePreviewRoot', 'stormThemePreviewRoot']);
  const hashPattern = /^[a-f0-9]{64}$/;
  const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const neutralTheme = deepFreeze({
    presetId: 'neutral-water',
    palette: { water: '#1d5d7a', reflection: '#b9d8e8', weather: '#6f9eaf', atmosphere: '#dbeaf0' },
    layers: []
  });

  function normalizeManifest(manifest, options) {
    try {
      validateManifest(manifest, options);
      const normalized = clone(manifest);
      normalized.layers = normalized.layers.map((layer) => ({
        ...layer,
        assetUrl: layer.asset
      }));
      return { ok: true, value: deepFreeze(normalized) };
    } catch (error) {
      return invalid(error);
    }
  }

  function validateRuntimeReceipt(manifest, receipt, options) {
    try {
      validateManifest(manifest);
      requireObject(receipt, 'Runtime receipt is required');
      requireExactFields(receipt, receiptFields, 'receipt');
      if (receipt.schemaVersion !== 1) fail('Runtime receipt schema version is unsupported');
      for (const field of ['packageId', 'revisionId', 'mappingApprovalId', 'importApprovalId']) {
        if (!isId(receipt[field])) fail(`Runtime receipt ${field} is invalid`);
      }
      for (const field of ['packageContentHash', 'mappingApprovalHash', 'validationReportHash', 'reviewEvidenceHash', 'importApprovalHash']) {
        if (!isHash(receipt[field])) fail(`Runtime receipt ${field} is invalid`);
      }
      if (!isDate(receipt.importedAt)) fail('Runtime receipt importedAt is invalid');
      if (receipt.packageId !== manifest.packageId) fail('Runtime receipt package ID does not match manifest');
      if (receipt.revisionId !== manifest.sourceEvidence.revisionId) fail('Runtime receipt revision does not match manifest');
      if (receipt.mappingApprovalHash !== manifest.sourceEvidence.mappingApprovalHash) fail('Runtime receipt approval hash does not match manifest');
      if (!options || !isHash(options.contentHash) || receipt.packageContentHash !== options.contentHash) {
        fail('Runtime receipt content hash does not match package');
      }
      return { ok: true };
    } catch (error) {
      return invalid(error);
    }
  }

  async function loadTheme(options) {
    const settings = options || {};
    const mode = resolveMode(settings);
    try {
      if (mode.invalid) fail(mode.invalid);
      if (!isId(settings.packageId)) fail('Map theme package ID is invalid');
      const packageRoot = mode.mode === 'preview'
        ? mode.root
        : `demo/maps/${settings.packageId}`;
      const fetchJson = settings.fetchJson || defaultFetchJson;
      const manifest = await fetchJson(`${packageRoot}/map-theme.json`);
      const normalized = normalizeManifest(manifest, settings);
      if (!normalized.ok) fail(normalized.diagnostic);

      if (mode.mode === 'production') {
        const receipt = await fetchJson(`${packageRoot}/import-receipt.json`);
        const hashPackage = settings.hashPackage || defaultHashPackage;
        const contentHash = await hashPackage({ root: packageRoot, manifest: normalized.value });
        const eligibility = validateRuntimeReceipt(manifest, receipt, { contentHash });
        if (!eligibility.ok) fail(eligibility.diagnostic);
      }

      return deepFreeze({
        kind: 'package',
        mode: mode.mode,
        root: packageRoot,
        theme: normalized.value,
        diagnostic: null
      });
    } catch (error) {
      return fallback(mode.mode, diagnostic(error));
    }
  }

  function resolveMode(options) {
    const roots = options.previewRoots;
    const key = options.previewKey;
    if (!roots && !key) return { mode: 'production' };
    if (!roots || !key || !previewKeys.includes(key)) {
      return { mode: 'preview', invalid: 'Map theme preview requires an approved root pair and key' };
    }
    if (!isPlainObject(roots) || Object.keys(roots).length !== previewKeys.length || !previewKeys.every((name) => typeof roots[name] === 'string')) {
      return { mode: 'preview', invalid: 'Map theme preview roots must be an exact pair' };
    }
    for (const name of previewKeys) {
      if (!isPreviewRoot(roots[name], name)) {
        return { mode: 'preview', invalid: 'Map theme preview root is outside approved staging builds' };
      }
    }
    return { mode: 'preview', root: roots[key] };
  }

  function previewRootsFromSearch(search) {
    const params = new URLSearchParams(search || '');
    const roots = {};
    for (const key of previewKeys) {
      const value = params.get(key);
      if (value !== null) roots[key] = value;
    }
    return Object.keys(roots).length ? roots : null;
  }

  function validateManifest(manifest, options) {
    requireObject(manifest, 'Map theme manifest must be an object');
    requireExactFields(manifest, manifestFields, 'map theme manifest');
    if (manifest.schemaVersion !== 1) fail('Map theme schema version is unsupported');
    if (!isId(manifest.packageId) || !nonEmptyString(manifest.displayName)) fail('Map theme identity is invalid');
    validateSourceEvidence(manifest.sourceEvidence);
    validateCompatibility(manifest.compatibility, options);
    validateViewport(manifest.viewport);
    validatePalette(manifest.palette);
    validateLayers(manifest.layers);
    if (!isPlainObject(manifest.ambience) || !Array.isArray(manifest.exclusionZones) || !Array.isArray(manifest.semanticBindings)) {
      fail('Map theme visual configuration is invalid');
    }
    validateProtectedElements(manifest.protectedElements, options && options.protectedRegistry);
    validateBudgets(manifest.budgets);
    validateFallback(manifest.fallback);
  }

  function validateSourceEvidence(value) {
    const fields = ['revisionId', 'sourceBundleHash', 'briefHash', 'provenanceId', 'provenanceHash', 'mappingApprovalHash', 'rightsStatus'];
    requireExactFields(value, fields, 'source evidence');
    if (!isId(value.revisionId) || !isId(value.provenanceId) || !nonEmptyString(value.rightsStatus)) fail('Map theme source evidence is invalid');
    for (const field of ['sourceBundleHash', 'briefHash', 'provenanceHash', 'mappingApprovalHash']) {
      if (!isHash(value[field])) fail('Map theme source evidence hash is invalid');
    }
  }

  function validateCompatibility(value, options) {
    requireExactFields(value, ['rendererVersion', 'elementLibraryVersion'], 'compatibility');
    if (!nonEmptyString(value.rendererVersion) || !nonEmptyString(value.elementLibraryVersion)) fail('Map theme compatibility is invalid');
    if (options && options.elementLibraryVersion && value.elementLibraryVersion !== String(options.elementLibraryVersion)) {
      fail('Map theme element library version is incompatible');
    }
  }

  function validateViewport(value) {
    requireExactFields(value, ['aspectRatio', 'logicalWidth', 'logicalHeight', 'cameraModel', 'safeZones'], 'viewport');
    if (!/^[0-9]+:[0-9]+$/.test(value.aspectRatio) || !positiveInteger(value.logicalWidth) || !positiveInteger(value.logicalHeight) ||
      !['top-down', 'near-orthographic'].includes(value.cameraModel) || !Array.isArray(value.safeZones) || !value.safeZones.length) {
      fail('Map theme viewport is invalid');
    }
  }

  function validatePalette(value) {
    requireExactFields(value, ['water', 'reflection', 'weather', 'atmosphere'], 'palette');
    if (!Object.values(value).every(nonEmptyString)) fail('Map theme palette is invalid');
  }

  function validateLayers(layers) {
    if (!Array.isArray(layers) || !layers.length) fail('Map theme layers are invalid');
    const ids = new Set();
    for (const layer of layers) {
      requireExactFields(layer, ['id', 'role', 'zBand', 'asset', 'blendMode', 'opacity', 'parallax', 'motion', 'exclusionPolicy'], 'layer');
      if (!isId(layer.id) || ids.has(layer.id)) fail('Map theme layer IDs must be unique');
      ids.add(layer.id);
      if (!['far-environment', 'water-base', 'underwater-texture', 'edge-vegetation', 'background-atmosphere', 'foreground-weather', 'landmark-backdrop'].includes(layer.role) ||
        !Number.isInteger(layer.zBand) || layer.zBand < 0 || !isLocalAsset(layer.asset) ||
        !['source-over', 'multiply', 'screen', 'overlay', 'lighter'].includes(layer.blendMode) ||
        !unitInterval(layer.opacity) || !unitInterval(layer.parallax) ||
        !['avoid-gameplay', 'edge-only', 'none'].includes(layer.exclusionPolicy)) {
        fail('Map theme layer is invalid');
      }
      requireExactFields(layer.motion, ['maxInstances'], 'layer motion');
      if (!Number.isInteger(layer.motion.maxInstances) || layer.motion.maxInstances < 0 || layer.motion.maxInstances > 48) fail('Map theme layer motion is invalid');
    }
  }

  function validateProtectedElements(value, registry) {
    requireExactFields(value, protectedIds, 'protected elements');
    for (const id of protectedIds) {
      if (value[id] !== 'inherit-only') fail('Map theme cannot override protected elements');
      if (registry && typeof registry.getElementDefinition === 'function' && !registry.getElementDefinition(id)) {
        fail('Map theme protected registry is incompatible');
      }
    }
  }

  function validateBudgets(value) {
    requireExactFields(value, ['compressedBytes', 'drawCalls', 'visibleInstances', 'motionInstances'], 'budgets');
    if (!nonNegativeInteger(value.compressedBytes) || !nonNegativeInteger(value.drawCalls) ||
      !nonNegativeInteger(value.visibleInstances) || value.visibleInstances > 24 ||
      !nonNegativeInteger(value.motionInstances) || value.motionInstances > 48) {
      fail('Map theme budgets are invalid');
    }
  }

  function validateFallback(value) {
    requireExactFields(value, ['presetId', 'color', 'density'], 'fallback');
    if (!nonEmptyString(value.presetId) || !nonEmptyString(value.color) || !unitInterval(value.density)) fail('Map theme fallback is invalid');
  }

  function isPreviewRoot(root, key) {
    if (typeof root !== 'string' || root.startsWith('/') || root.includes('\\') || root.includes('..') || /^[a-z][a-z0-9+.-]*:/i.test(root)) return false;
    const expected = key === 'morningThemePreviewRoot' ? 'morning-mist-v1' : 'storm-deep-lake-v1';
    return new RegExp(`^map-theme-staging/${expected}/revisions/[a-z0-9]+(?:-[a-z0-9]+)*/build$`).test(root);
  }

  function isLocalAsset(value) {
    return typeof value === 'string' && value.length > 0 && !value.startsWith('/') &&
      !value.includes('\\') && !value.includes('..') && !/^[a-z][a-z0-9+.-]*:/i.test(value) &&
      !value.startsWith('//');
  }

  async function defaultFetchJson(url) {
    if (typeof fetch !== 'function') fail('Map theme loader requires fetch');
    const response = await fetch(url, { credentials: 'same-origin' });
    if (!response.ok) fail(`Map theme request failed: ${response.status}`);
    return response.json();
  }

  async function defaultHashPackage({ root, manifest }) {
    if (typeof fetch !== 'function' || !globalThis.crypto || !globalThis.crypto.subtle) {
      fail('Map theme loader requires Web Crypto package hashing');
    }
    const manifestHash = await sha256Text(canonicalJson(manifest));
    const assets = await Promise.all(manifest.layers.map(async (layer) => ({
      path: layer.asset,
      hash: await hashFetchedAsset(`${root}/${layer.asset}`)
    })));
    assets.sort((left, right) => left.path.localeCompare(right.path));
    const preimage = [
      `map-theme-package-v1\n${manifestHash}\n`,
      ...assets.map((asset) => `${asset.path}\0${asset.hash}\n`)
    ].join('');
    return sha256Text(preimage);
  }

  async function hashFetchedAsset(url) {
    const response = await fetch(url, { credentials: 'same-origin' });
    if (!response.ok) fail(`Map theme asset request failed: ${response.status}`);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', await response.arrayBuffer());
    return hex(digest);
  }

  async function sha256Text(value) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return hex(digest);
  }

  function canonicalJson(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }

  function hex(buffer) {
    return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  function fallback(mode, message) {
    return deepFreeze({ kind: 'fallback', mode, root: null, theme: neutralTheme, diagnostic: message });
  }

  function invalid(error) {
    return { ok: false, diagnostic: diagnostic(error) };
  }

  function diagnostic(error) {
    return error && error.message ? `Map theme unavailable: ${error.message}` : 'Map theme unavailable';
  }

  function requireExactFields(value, fields, name) {
    requireObject(value, `${name} must be an object`);
    const actual = Object.keys(value);
    if (actual.length !== fields.length || actual.some((field) => !fields.includes(field))) fail(`Map theme ${name} contains unsupported fields`);
    if (fields.some((field) => !Object.hasOwn(value, field))) fail(`Map theme ${name} is missing required fields`);
  }

  function requireObject(value, message) {
    if (!isPlainObject(value)) fail(message);
  }

  function fail(message) {
    throw new Error(message);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.freeze(value);
      for (const child of Object.values(value)) deepFreeze(child);
    }
    return value;
  }

  function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
  }

  function nonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
  }

  function isHash(value) {
    return typeof value === 'string' && hashPattern.test(value);
  }

  function isId(value) {
    return typeof value === 'string' && idPattern.test(value);
  }

  function positiveInteger(value) {
    return Number.isInteger(value) && value > 0;
  }

  function nonNegativeInteger(value) {
    return Number.isInteger(value) && value >= 0;
  }

  function unitInterval(value) {
    return typeof value === 'number' && value >= 0 && value <= 1;
  }

  function isDate(value) {
    return typeof value === 'string' && !Number.isNaN(Date.parse(value));
  }

  return Object.freeze({
    neutralTheme,
    normalizeManifest,
    validateRuntimeReceipt,
    loadTheme,
    previewRootsFromSearch
  });
});
