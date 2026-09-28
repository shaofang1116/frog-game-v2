const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const schemaDir = path.join(repoRoot, 'schemas', 'map-theme');
const sha = (value) => crypto.createHash('sha256').update(value).digest('hex');
const run = (script, args) => spawnSync(process.execPath, [path.join(repoRoot, 'scripts', script), ...args], {
  cwd: repoRoot, encoding: 'utf8'
});
const writeJson = (file, value) => fs.writeFile(file, `${JSON.stringify(value)}\n`);

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
  const { canonicalJsonHash, packageContentHash, sourceBundleHash } = await import('../../scripts/lib/map-theme-hash.mjs');
  assert.equal(canonicalJsonHash({ b: 'x', a: 1 }), canonicalJsonHash({ a: 1, b: 'x' }));
  const sourceHash = await sourceBundleHash({
    files: [{ role: 'source-design', path: 'design.png', mediaType: 'image/png', sha256: 'a'.repeat(64) }]
  });
  assert.match(sourceHash, /^[a-f0-9]{64}$/);
  await assert.rejects(sourceBundleHash({ files: [
    { role: 'source-design', path: 'a.png', mediaType: 'image/png', sha256: 'a'.repeat(64) },
    { role: 'source-design', path: 'b.png', mediaType: 'image/png', sha256: 'a'.repeat(64) }
  ] }), /Duplicate/);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'map-theme-'));
  try {
    await fs.mkdir(path.join(root, 'assets'));
    await fs.writeFile(path.join(root, 'assets', 'atmosphere.webp'), 'asset');
    assert.match(await packageContentHash(root, validPackage()), /^[a-f0-9]{64}$/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('governance chain, deterministic evidence, import receipts, and fail-closed negatives', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'map-theme-chain-'));
  try {
    const revision = await createRevision(root);
    const destination = path.join(root, 'runtime', 'fixture-map');
    for (const [script, args] of [
      ['map-theme-validate.mjs', ['submission', revision]],
      ['map-theme-validate.mjs', ['check-build', revision]],
      ['map-theme-evidence.mjs', ['render-proposal', revision]]
    ]) expectPass(run(script, args));
    await writeValidationAndImportApproval(revision);
    expectPass(run('map-theme-validate.mjs', ['validate', revision]));
    expectPass(run('map-theme-import.mjs', ['--revision', revision, destination]));
    expectPass(run('map-theme-audit.mjs', ['--root', root, '--staging-fixture', revision, '--runtime', destination]));
    assert.deepEqual(await fs.readFile(path.join(revision, 'import', 'import-receipt.json')), await fs.readFile(path.join(destination, 'import-receipt.json')));
    if (process.env.MAP_THEME_FIXTURE_OUTPUT) {
      await fs.rm(process.env.MAP_THEME_FIXTURE_OUTPUT, { recursive: true, force: true });
      await fs.cp(revision, process.env.MAP_THEME_FIXTURE_OUTPUT, { recursive: true });
      await fs.cp(destination, path.join(process.env.MAP_THEME_FIXTURE_OUTPUT, 'runtime', 'fixture-map'), { recursive: true });
    }

    const deterministic = await createRevision(path.join(root, 'deterministic'));
    expectPass(run('map-theme-evidence.mjs', ['render-proposal', deterministic]));
    assert.deepEqual(
      await fs.readFile(path.join(revision, 'review', 'files', 'viewport-preview.txt')),
      await fs.readFile(path.join(deterministic, 'review', 'files', 'viewport-preview.txt'))
    );

    for (const [name, mutate] of [
      ['missing approval', async (copy) => fs.rm(path.join(copy, 'approval', 'mapping-approval.json'))],
      ['changed asset', async (copy) => fs.appendFile(path.join(copy, 'build', 'assets', 'atmosphere.webp'), 'changed')],
      ['extra file', async (copy) => fs.writeFile(path.join(copy, 'build', 'unexpected.txt'), 'no')],
      ['symlink', async (copy) => fs.symlink('assets/atmosphere.webp', path.join(copy, 'build', 'link.webp'))],
      ['changed report', async (copy) => {
        const file = path.join(copy, 'validation', 'validation-report.json');
        const value = JSON.parse(await fs.readFile(file));
        value.validatorVersion = 'forged';
        await writeJson(file, value);
      }],
      ['unaccepted deviation', async (copy) => {
        const file = path.join(copy, 'approval', 'import-approval.json');
        const value = JSON.parse(await fs.readFile(file));
        value.acceptedDeviationIds = ['unexpected-deviation'];
        await writeJson(file, value);
      }],
      ['forged receipt', async (copy) => fs.writeFile(path.join(copy, 'import', 'import-receipt.json'), '{"forged":true}\n')]
    ]) {
      const copy = path.join(root, name.replaceAll(' ', '-'));
      await fs.cp(revision, copy, { recursive: true, dereference: false });
      await mutate(copy);
      const unchanged = await fs.readFile(path.join(destination, 'import-receipt.json'));
      assert.notEqual(run('map-theme-audit.mjs', ['--root', root, '--staging-fixture', copy, '--runtime', destination]).status, 0, name);
      assert.deepEqual(await fs.readFile(path.join(destination, 'import-receipt.json')), unchanged, `${name} changed runtime`);
    }
    assert.notEqual(run('map-theme-import.mjs', ['--revision', revision, destination]).status, 0, 'existing destination');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('Task8 intake composition creates reproducible, closed revisions without build dependencies', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'map-theme-task8-'));
  try {
    const intake = await createIntake(root);
    expectPass(run('map-theme-evidence.mjs', ['compose-intake', '--intake', intake]));
    expectPass(run('map-theme-evidence.mjs', ['compose-intake', '--intake', intake]));
    const first = run('map-theme-evidence.mjs', ['init', '--request', 'task8-fixture', '--sequence', '1', '--intake', intake]);
    expectPass(first);
    const revision = first.stdout.trim();
    const bundle = JSON.parse(await fs.readFile(path.join(revision, 'source', 'source-bundle.json')));
    const { canonicalJsonHash, sourceBundleHash } = await import('../../scripts/lib/map-theme-hash.mjs');
    const expectedId = `r0001-${(await sourceBundleHash(bundle)).slice(0, 12)}-${canonicalJsonHash(JSON.parse(await fs.readFile(path.join(revision, 'source', 'map-design-brief.json')))).slice(0, 12)}`;
    assert.equal(path.basename(revision), expectedId);
    assert.equal(await fs.stat(intake).then(() => true, () => false), false, 'verified intake is removed');
    assert.deepEqual(bundle.files.map((file) => file.role).sort(), ['clean-environment-plate', 'composite-preview', 'semantic-overlay']);
    for (const file of bundle.files) assert.equal(file.sha256, sha(await fs.readFile(path.join(revision, 'source', 'files', file.path))));

    expectPass(run('map-theme-evidence.mjs', ['render-proposal', '--revision', revision]));
    for (const file of ['diff-report.md', 'preview-390x844.png', 'preview-480x900.png', 'visual-scorecard.json']) {
      await fs.access(path.join(revision, 'proposal', file));
    }
    expectPass(run('map-theme-validate.mjs', ['submission', revision]));
    const scorecardFile = path.join(revision, 'proposal', 'visual-scorecard.json');
    const scorecard = JSON.parse(await fs.readFile(scorecardFile));
    assert.deepEqual(scorecard.scores.map(({ category }) => category).sort(), scorecardCategories());

    await writeJson(scorecardFile, { ...scorecard, scores: scorecard.scores.slice(1) });
    assert.notEqual(run('map-theme-validate.mjs', ['submission', revision]).status, 0, 'scorecard must match its schema');
    await writeJson(scorecardFile, scorecard);
    expectPass(run('map-theme-validate.mjs', ['submission', revision]));

    await fs.writeFile(path.join(revision, 'proposal', 'unexpected.txt'), 'not allowed');
    assert.notEqual(run('map-theme-validate.mjs', ['submission', revision]).status, 0, 'proposal directory must reject non-whitelisted files');
    await fs.rm(path.join(revision, 'proposal', 'unexpected.txt'));
    for (const absent of ['build', 'approval', 'review', 'import']) {
      assert.equal(await fs.stat(path.join(revision, absent)).then(() => true, () => false), false, `${absent} must not be created`);
    }

    const duplicateIntake = await createIntake(root, 'duplicate');
    expectPass(run('map-theme-evidence.mjs', ['compose-intake', '--intake', duplicateIntake]));
    assert.notEqual(run('map-theme-evidence.mjs', ['init', '--request', 'task8-fixture', '--sequence', '1', '--intake', duplicateIntake]).status, 0, 'revision IDs are append-only');

    const reproducibleIntake = await createIntake(path.join(root, 'reproducible'));
    expectPass(run('map-theme-evidence.mjs', ['compose-intake', '--intake', reproducibleIntake]));
    const reproducible = run('map-theme-evidence.mjs', ['init', '--request', 'task8-fixture', '--sequence', '1', '--intake', reproducibleIntake]);
    expectPass(reproducible);
    assert.equal(path.basename(reproducible.stdout.trim()), expectedId, 'same source and brief yield the same revision ID');

    const unclosed = await createIntake(path.join(root, 'unclosed'));
    await fs.writeFile(path.join(unclosed, 'files', 'unlisted.png'), 'unlisted');
    assert.notEqual(run('map-theme-evidence.mjs', ['compose-intake', '--intake', unclosed]).status, 0, 'intake file directory must be closed');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

function expectPass(result) {
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
}

async function createIntake(root, name = 'intake') {
  const intake = path.join(root, name);
  for (const dir of ['files', 'analysis', 'proposal']) await fs.mkdir(path.join(intake, dir), { recursive: true });
  await fs.writeFile(path.join(intake, 'files', 'clean-environment-plate.png'), 'clean-source');
  const provenance = { schemaVersion: 1, provenanceId: 'task8-art', creator: 'fixture', creationMethod: 'original', rightsHolder: 'fixture', allowedUses: ['runtime'], sourceHashes: [sha('clean-source')], createdAt: '2026-09-28T00:00:00Z' };
  const brief = { schemaVersion: 1, requestId: 'task8-fixture', mapId: 'task8-fixture', displayName: 'Task8', designPurpose: 'test', chapterRole: 'test', sourceType: 'original', targetViewport: { width: 960, height: 1800 }, cameraModel: 'top-down', gameplayCorridor: rect(), safeZones: [rect(0, 0, 1, 0.1)], themeKeywords: ['test'], backgroundIntent: 'test', canonicalElements: [], newElementProposals: [], motionIntent: 'none', prohibitedChanges: ['gameplay'], provenance: { provenanceId: provenance.provenanceId, provenanceHash: canonical(provenance) } };
  const pending = 'pending';
  const inventory = { schemaVersion: 1, requestId: 'task8-fixture', revisionId: pending, regions: [{ id: 'water-region', region: rect(), confidence: 1, disposition: 'KEEP_BACKGROUND', rationale: 'background', targetLayer: 'water', occlusionRisk: 'none', reviewerDecision: 'approved' }] };
  const admission = { schemaVersion: 1, requestId: 'task8-fixture', revisionId: pending, submissionClass: 'IMPORT_CANDIDATE', workflowState: 'APPROVED', score: 100, hardGates: [{ id: 'rights', passed: true }], createdAt: '2026-09-28T00:00:00Z' };
  const layerPlan = { schemaVersion: 1, requestId: 'task8-fixture', revisionId: pending, layers: [{ id: 'water', role: 'water-base', sourceRegionIds: ['water-region'] }] };
  const semanticMap = { schemaVersion: 1, requestId: 'task8-fixture', revisionId: pending, bindings: [] };
  const proposal = { schemaVersion: 1, requestId: 'task8-fixture', revisionId: pending, sourceBundleHash: 'a'.repeat(64), briefHash: 'a'.repeat(64), provenanceHash: 'a'.repeat(64), regionDecisions: [{ regionId: 'water-region', disposition: 'KEEP_BACKGROUND' }], layerPlan: ['water'], semanticBindings: [], budgets: rect() };
  for (const [file, value] of Object.entries({
    'map-design-brief.json': brief, 'provenance.json': provenance,
    'analysis/admission-report.json': admission, 'analysis/element-inventory.json': inventory,
    'proposal/mapping-proposal.json': proposal, 'proposal/layer-plan.json': layerPlan, 'proposal/semantic-map.json': semanticMap
  })) await writeJson(path.join(intake, file), value);
  await fs.writeFile(path.join(intake, 'analysis', 'semantic-mask.png'), 'semantic-mask');
  return intake;
}

async function createRevision(root) {
  const revision = path.join(root, 'revision');
  for (const dir of ['source/files', 'analysis', 'proposal', 'approval', 'build/assets']) await fs.mkdir(path.join(revision, dir), { recursive: true });
  await fs.writeFile(path.join(revision, 'source/files/plate.webp'), 'fixture-source');
  await fs.writeFile(path.join(revision, 'build/assets/atmosphere.webp'), 'fixture-asset');
  const sourceFileHash = sha('fixture-source');
  const provenance = { schemaVersion: 1, provenanceId: 'fixture-art', creator: 'fixture', creationMethod: 'original', rightsHolder: 'fixture', allowedUses: ['runtime'], sourceHashes: [sourceFileHash], createdAt: '2026-09-28T00:00:00Z' };
  const brief = { schemaVersion: 1, requestId: 'fixture-request', mapId: 'fixture-map', displayName: 'Fixture', designPurpose: 'test', chapterRole: 'test', sourceType: 'original', targetViewport: { width: 960, height: 1800 }, cameraModel: 'top-down', gameplayCorridor: rect(), safeZones: [rect(0, 0, 1, 0.1)], themeKeywords: ['test'], backgroundIntent: 'test', canonicalElements: [], newElementProposals: [], motionIntent: 'none', prohibitedChanges: ['gameplay'], provenance: { provenanceId: provenance.provenanceId, provenanceHash: canonical(provenance) } };
  const bundle = { schemaVersion: 1, requestId: 'fixture-request', revisionId: 'fixture-map', files: [{ role: 'source-design', path: 'plate.webp', mediaType: 'image/webp', sha256: sourceFileHash }] };
  const sourceHash = await sourceBundle(bundle);
  const inventory = { schemaVersion: 1, requestId: 'fixture-request', revisionId: 'fixture-map', regions: [{ id: 'water-region', region: rect(), confidence: 1, disposition: 'KEEP_BACKGROUND', rationale: 'background', targetLayer: 'water', occlusionRisk: 'none', reviewerDecision: 'approved' }] };
  const layerPlan = { schemaVersion: 1, requestId: 'fixture-request', revisionId: 'fixture-map', layers: [{ id: 'water', role: 'water-base', sourceRegionIds: ['water-region'] }] };
  const semanticMap = { schemaVersion: 1, requestId: 'fixture-request', revisionId: 'fixture-map', bindings: [] };
  const proposal = { schemaVersion: 1, requestId: 'fixture-request', revisionId: 'fixture-map', sourceBundleHash: sourceHash, briefHash: canonical(brief), provenanceHash: canonical(provenance), regionDecisions: [{ regionId: 'water-region', disposition: 'KEEP_BACKGROUND' }], layerPlan: ['water'], semanticBindings: [], budgets: rect() };
  const approval = { schemaVersion: 1, approvalId: 'mapping-fixture', requestId: 'fixture-request', revisionId: 'fixture-map', proposalHash: canonical(proposal), sourceBundleHash: sourceHash, briefHash: canonical(brief), provenanceHash: canonical(provenance), regionDecisions: [{}], acceptedLayerIds: ['water'], canonicalBindings: [], rejectedRegionIds: [], acknowledgedCoreProposalIds: [], budgets: {}, visualScorecard: {}, approvedBy: 'human', approvedAt: '2026-09-28T00:00:00Z' };
  const manifest = validPackage({ revisionId: 'fixture-map', sourceBundleHash: sourceHash, briefHash: canonical(brief), provenanceId: provenance.provenanceId, provenanceHash: canonical(provenance), mappingApprovalHash: canonical(approval) });
  const admission = { schemaVersion: 1, requestId: 'fixture-request', revisionId: 'fixture-map', submissionClass: 'IMPORT_CANDIDATE', workflowState: 'APPROVED', score: 100, hardGates: [{ id: 'rights', passed: true }], createdAt: '2026-09-28T00:00:00Z' };
  for (const [file, value] of Object.entries({
    'source/source-bundle.json': bundle, 'source/map-design-brief.json': brief, 'source/provenance.json': provenance,
    'analysis/admission-report.json': admission, 'analysis/element-inventory.json': inventory,
    'proposal/mapping-proposal.json': proposal, 'proposal/layer-plan.json': layerPlan, 'proposal/semantic-map.json': semanticMap,
    'approval/mapping-approval.json': approval, 'build/map-theme.json': manifest
  })) await writeJson(path.join(revision, file), value);
  await fs.writeFile(path.join(revision, 'analysis/semantic-mask.png'), 'semantic-mask');
  await fs.writeFile(path.join(revision, 'proposal/diff-report.md'), 'deterministic diff\n');
  await fs.writeFile(path.join(revision, 'proposal/preview-390x844.png'), 'deterministic image data');
  await fs.writeFile(path.join(revision, 'proposal/preview-480x900.png'), 'deterministic image data');
  await writeJson(path.join(revision, 'proposal/visual-scorecard.json'), visualScorecard());
  return revision;
}

async function writeValidationAndImportApproval(revision) {
  const { canonicalJsonHash, packageContentHash } = await import('../../scripts/lib/map-theme-hash.mjs');
  const manifest = JSON.parse(await fs.readFile(path.join(revision, 'build/map-theme.json')));
  const mapping = JSON.parse(await fs.readFile(path.join(revision, 'approval/mapping-approval.json')));
  const review = JSON.parse(await fs.readFile(path.join(revision, 'review/review-evidence.json')));
  const report = { schemaVersion: 1, reportId: 'validation-fixture', validatorVersion: '1', packageId: manifest.packageId, revisionId: 'fixture-map', mappingApprovalHash: canonicalJsonHash(mapping), packageContentHash: await packageContentHash(path.join(revision, 'build'), manifest), reviewEvidenceHash: canonicalJsonHash(review), checks: [{ id: 'fixture', passed: true }], deviations: [], passed: true, createdAt: '2026-09-28T00:00:00Z' };
  await fs.mkdir(path.join(revision, 'validation'));
  await writeJson(path.join(revision, 'validation/validation-report.json'), report);
  const approval = { schemaVersion: 1, approvalId: 'import-fixture', packageId: manifest.packageId, revisionId: 'fixture-map', mappingApprovalHash: canonicalJsonHash(mapping), packageContentHash: report.packageContentHash, validationReportHash: canonicalJsonHash(report), reviewEvidenceHash: report.reviewEvidenceHash, acceptedDeviationIds: [], approvedBy: 'human', approvedAt: '2026-09-28T00:00:00Z' };
  await writeJson(path.join(revision, 'approval/import-approval.json'), approval);
}

function rect(x = 0, y = 0, width = 1, height = 1) { return { x, y, width, height }; }
function scorecardCategories() {
  return ['checkpoint-prominence', 'hazard-recognition', 'motion-weather-comfort', 'target-readability', 'theme-differentiation', 'transition-continuity'];
}
function visualScorecard() {
  return {
    schemaVersion: 1,
    reviewer: 'fixture',
    viewport: { width: 960, height: 1800 },
    scores: scorecardCategories().map((category) => ({ category, score: 5, evidence: 'fixture evidence' }))
  };
}
function canonical(value) {
  const { canonicalize } = require('json-canonicalize');
  return sha(Buffer.from(canonicalize(value), 'utf8'));
}
async function sourceBundle(bundle) {
  const { sourceBundleHash } = await import('../../scripts/lib/map-theme-hash.mjs');
  return sourceBundleHash(bundle);
}
function validPackage(sourceEvidence = { revisionId: 'r0001', sourceBundleHash: 'a'.repeat(64), briefHash: 'a'.repeat(64), provenanceId: 'original-art', provenanceHash: 'a'.repeat(64), mappingApprovalHash: 'a'.repeat(64) }) {
  const protectedElements = {};
  for (const id of ['frog.player', 'surface.lily-pad.normal', 'surface.lily-pad.sinking', 'hazard.crocodile', 'hazard.crocodile.warning-wake', 'reward.flower', 'reward.golden-lotus', 'item.bomb', 'item.bomb-pickup', 'preview.jump-target', 'ui.hud', 'ui.control.dpad', 'ui.control.bomb']) protectedElements[id] = 'inherit-only';
  return { schemaVersion: 1, packageId: 'fixture-map', displayName: 'Fixture', sourceEvidence: { ...sourceEvidence, rightsStatus: 'owned' }, compatibility: { rendererVersion: '1', elementLibraryVersion: '1' }, viewport: { aspectRatio: '8:15', logicalWidth: 960, logicalHeight: 1800, cameraModel: 'top-down', safeZones: [rect(0, 0, 1, 0.1)] }, palette: { water: '#123456', reflection: '#ffffff', weather: '#abcdef', atmosphere: '#eeeeee' }, layers: [{ id: 'water', role: 'water-base', zBand: 0, asset: 'assets/atmosphere.webp', blendMode: 'source-over', opacity: 1, parallax: 0, motion: { maxInstances: 0 }, exclusionPolicy: 'avoid-gameplay' }], ambience: {}, exclusionZones: [], semanticBindings: [], protectedElements, budgets: { compressedBytes: 20, drawCalls: 1, visibleInstances: 1, motionInstances: 0 }, fallback: { presetId: 'neutral-water', color: '#123456', density: 0.2 } };
}
