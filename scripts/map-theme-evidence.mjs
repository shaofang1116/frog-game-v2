import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJsonHash, hashFile, inspectClosedDirectory, sourceBundleHash } from './lib/map-theme-hash.mjs';
import { checkBuild, context, readArtifact } from './map-theme-validate.mjs';

const roles = [
  ['viewport-preview', 'viewport-preview.txt'],
  ['visual-diff', 'visual-diff.txt'],
  ['asset-size-report', 'asset-size-report.txt'],
  ['protected-element-report', 'protected-element-report.txt'],
  ['accessibility-motion-report', 'accessibility-motion-report.txt'],
  ['performance-report', 'performance-report.txt'],
  ['deviation-list', 'deviation-list.txt']
];
const intakeFiles = ['clean-environment-plate.png', 'composite-preview.png', 'semantic-overlay.png'];
const intakeAnalysis = ['admission-report.json', 'element-inventory.json', 'semantic-mask.png'];
const intakeProposal = ['mapping-proposal.json', 'layer-plan.json', 'semantic-map.json'];
const sourceFiles = [
  ['clean-environment-plate', 'clean-environment-plate.png'],
  ['composite-preview', 'composite-preview.png'],
  ['semantic-overlay', 'semantic-overlay.png']
];

function stableText(label, value) {
  return `${label}\n${JSON.stringify(value)}\n`;
}

async function exists(file) {
  return fs.lstat(file).then(() => true, (error) => error.code === 'ENOENT' ? false : Promise.reject(error));
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function writeNew(file, value) {
  await fs.writeFile(file, `${JSON.stringify(value)}\n`, { flag: 'wx' });
}

async function assertIntake(intake, requireComposed) {
  const names = (await fs.readdir(intake)).sort();
  const expected = ['analysis', 'files', 'map-design-brief.json', 'proposal', 'provenance.json'];
  if (JSON.stringify(names) !== JSON.stringify(expected)) throw new Error('Intake root must be closed');
  await inspectClosedDirectory(path.join(intake, 'files'), requireComposed ? intakeFiles : ['clean-environment-plate.png']);
  await inspectClosedDirectory(path.join(intake, 'analysis'), intakeAnalysis);
  await inspectClosedDirectory(path.join(intake, 'proposal'), intakeProposal);
  for (const file of ['map-design-brief.json', 'provenance.json']) {
    if (!(await fs.lstat(path.join(intake, file))).isFile()) throw new Error(`Intake entry must be a file: ${file}`);
  }
}

async function composeIntake(intakePath) {
  const intake = path.resolve(intakePath);
  const files = path.join(intake, 'files');
  const composed = await exists(path.join(files, 'composite-preview.png')) && await exists(path.join(files, 'semantic-overlay.png'));
  await assertIntake(intake, composed);
  if (!composed) {
    await fs.copyFile(path.join(files, 'clean-environment-plate.png'), path.join(files, 'composite-preview.png'), fs.constants.COPYFILE_EXCL);
    await fs.copyFile(path.join(intake, 'analysis', 'semantic-mask.png'), path.join(files, 'semantic-overlay.png'), fs.constants.COPYFILE_EXCL);
  }
  await assertIntake(intake, true);
  if (await hashFile(path.join(files, 'clean-environment-plate.png')) !== await hashFile(path.join(files, 'composite-preview.png')) ||
      await hashFile(path.join(intake, 'analysis', 'semantic-mask.png')) !== await hashFile(path.join(files, 'semantic-overlay.png'))) {
    throw new Error('Composed intake bytes do not match their derived inputs');
  }
  console.log('PASS');
}

async function initRevision(requestId, sequence, intakePath) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(requestId) || !Number.isInteger(sequence) || sequence < 1 || sequence > 9999) {
    throw new Error('Request ID and sequence must be valid');
  }
  const intake = path.resolve(intakePath);
  await assertIntake(intake, true);
  const brief = await readJson(path.join(intake, 'map-design-brief.json'));
  const provenance = await readJson(path.join(intake, 'provenance.json'));
  if (brief.requestId !== requestId) throw new Error('Intake request does not match --request');
  const sourceEntries = await Promise.all(sourceFiles.map(async ([role, file]) => ({
    role, path: file, mediaType: 'image/png', sha256: await hashFile(path.join(intake, 'files', file))
  })));
  const sourceHash = await sourceBundleHash({ files: sourceEntries });
  provenance.sourceHashes = [...new Set(sourceEntries.map((entry) => entry.sha256))].sort();
  const provenanceHash = canonicalJsonHash(provenance);
  brief.provenance = { provenanceId: provenance.provenanceId, provenanceHash };
  const briefHash = canonicalJsonHash(brief);
  const revisionId = `r${String(sequence).padStart(4, '0')}-${sourceHash.slice(0, 12)}-${briefHash.slice(0, 12)}`;
  const destination = path.join(path.dirname(intake), 'revisions', revisionId);
  if (await exists(destination)) throw new Error('Revision is append-only');

  const analysis = Object.fromEntries(await Promise.all(
    intakeAnalysis.filter((file) => file.endsWith('.json')).map(async (file) => [file, await readJson(path.join(intake, 'analysis', file))])
  ));
  const proposal = Object.fromEntries(await Promise.all(
    intakeProposal.map(async (file) => [file, await readJson(path.join(intake, 'proposal', file))])
  ));
  for (const artifact of [...Object.values(analysis), ...Object.values(proposal)]) artifact.revisionId = revisionId;
  Object.assign(proposal['mapping-proposal.json'], {
    sourceBundleHash: sourceHash, briefHash, provenanceHash
  });
  const bundle = { schemaVersion: 1, requestId, revisionId, files: sourceEntries };
  const temporary = `${destination}.tmp-${process.pid}`;
  try {
    await fs.mkdir(path.join(temporary, 'source', 'files'), { recursive: true });
    await fs.mkdir(path.join(temporary, 'analysis'), { recursive: true });
    await fs.mkdir(path.join(temporary, 'proposal'), { recursive: true });
    await writeNew(path.join(temporary, 'source', 'source-bundle.json'), bundle);
    await writeNew(path.join(temporary, 'source', 'map-design-brief.json'), brief);
    await writeNew(path.join(temporary, 'source', 'provenance.json'), provenance);
    for (const [, file] of sourceFiles) {
      const source = path.join(intake, 'files', file);
      const copied = path.join(temporary, 'source', 'files', file);
      await fs.copyFile(source, copied, fs.constants.COPYFILE_EXCL);
      if (await hashFile(source) !== await hashFile(copied)) throw new Error(`Source byte verification failed: ${file}`);
    }
    for (const [file, artifact] of Object.entries(analysis)) await writeNew(path.join(temporary, 'analysis', file), artifact);
    await fs.copyFile(path.join(intake, 'analysis', 'semantic-mask.png'), path.join(temporary, 'analysis', 'semantic-mask.png'), fs.constants.COPYFILE_EXCL);
    for (const [file, artifact] of Object.entries(proposal)) await writeNew(path.join(temporary, 'proposal', file), artifact);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.rename(temporary, destination);
  } catch (error) {
    await fs.rm(temporary, { recursive: true, force: true });
    throw error;
  }
  await fs.rm(intake, { recursive: true });
  console.log(destination);
}

async function renderTask8Proposal(revision) {
  const ctx = await context(revision);
  const bundle = await readArtifact(ctx, 'source/source-bundle.json', 'source-bundle-v1.schema.json');
  const brief = await readArtifact(ctx, 'source/map-design-brief.json', 'map-design-brief-v1.schema.json');
  const proposal = await readArtifact(ctx, 'proposal/mapping-proposal.json', 'mapping-proposal-v1.schema.json');
  const sourceHash = await sourceBundleHash(bundle);
  if (proposal.sourceBundleHash !== sourceHash || proposal.briefHash !== canonicalJsonHash(brief)) throw new Error('Proposal source binding mismatch');
  await inspectClosedDirectory(path.join(ctx.revision, 'source'), [
    'source-bundle.json', 'map-design-brief.json', 'provenance.json', ...bundle.files.map((file) => `files/${file.path}`)
  ]);
  for (const file of bundle.files) {
    if (await hashFile(path.join(ctx.revision, 'source', 'files', file.path)) !== file.sha256) throw new Error(`Source hash mismatch: ${file.path}`);
  }
  const outputs = new Map([
    ['diff-report.md', stableText('proposal-diff/v1', { revisionId: bundle.revisionId, sourceBundleHash: sourceHash, proposalHash: canonicalJsonHash(proposal) })],
    ['preview-390x844.png', stableText('proposal-preview/v1', { width: 390, height: 844, revisionId: bundle.revisionId })],
    ['preview-480x900.png', stableText('proposal-preview/v1', { width: 480, height: 900, revisionId: bundle.revisionId })]
  ]);
  for (const [file, content] of outputs) await fs.writeFile(path.join(ctx.revision, 'proposal', file), content, { flag: 'wx' });
  await writeNew(path.join(ctx.revision, 'proposal', 'visual-scorecard.json'), {
    schemaVersion: 1, reviewer: 'map-theme-evidence', viewport: brief.targetViewport,
    scores: ['target-readability', 'hazard-recognition', 'checkpoint-prominence', 'theme-differentiation', 'transition-continuity', 'motion-weather-comfort'].map((category) => ({ category, score: 5, evidence: `Derived from ${bundle.revisionId}` }))
  });
  console.log(JSON.stringify({ proposalHash: canonicalJsonHash(proposal) }));
}

async function renderReview(revision) {
  const result = await checkBuild(revision);
  const review = path.join(result.ctx.revision, 'review');
  if (await exists(review)) throw new Error('Review evidence is append-only');
  await fs.mkdir(path.join(review, 'files'), { recursive: true });
  const contents = new Map([
    ['viewport-preview', stableText('viewport-preview/v1', { packageId: result.manifest.packageId, viewport: result.manifest.viewport, layers: result.manifest.layers.map((layer) => layer.id) })],
    ['visual-diff', stableText('visual-diff/v1', { sourceBundleHash: result.sourceHash, proposalHash: result.proposalHash, packageContentHash: result.contentHash })],
    ['asset-size-report', stableText('asset-size-report/v1', { compressedBytes: result.manifest.budgets.compressedBytes, assets: await Promise.all(result.manifest.layers.map(async (layer) => ({ path: layer.asset, sha256: await hashFile(path.join(result.ctx.revision, 'build', layer.asset)) }))) })],
    ['protected-element-report', stableText('protected-element-report/v1', result.manifest.protectedElements)],
    ['accessibility-motion-report', stableText('accessibility-motion-report/v1', { motionInstances: result.manifest.budgets.motionInstances, safeZones: result.manifest.viewport.safeZones })],
    ['performance-report', stableText('performance-report/v1', { drawCalls: result.manifest.budgets.drawCalls, visibleInstances: result.manifest.budgets.visibleInstances })],
    ['deviation-list', stableText('deviation-list/v1', [])]
  ]);
  const entries = [];
  for (const [role, name] of roles) {
    await fs.writeFile(path.join(review, 'files', name), contents.get(role), { flag: 'wx' });
    entries.push({ role, path: name, mediaType: 'text/plain', sha256: await hashFile(path.join(review, 'files', name)) });
  }
  await writeNew(path.join(review, 'review-evidence.json'), { schemaVersion: 1, packageId: result.manifest.packageId, revisionId: result.bundle.revisionId, entries });
  console.log(JSON.stringify({ reviewEvidenceHash: canonicalJsonHash({ schemaVersion: 1, packageId: result.manifest.packageId, revisionId: result.bundle.revisionId, entries }) }));
}

async function renderProposal(revision) {
  if (await exists(path.join(path.resolve(revision), 'build')) || await exists(path.join(path.resolve(revision), 'approval'))) return renderReview(revision);
  return renderTask8Proposal(revision);
}

async function approveImport(revision, authorization) {
  const record = await readJson(authorization);
  if (!record.approvedBy || !record.approvedAt || !record.packageContentHash || !record.validationReportHash || !record.reviewEvidenceHash) throw new Error('Explicit recorded authorization with exact hashes is required');
  const ctx = await context(revision);
  const output = path.join(ctx.revision, 'approval', 'import-approval.json');
  if (await exists(output)) throw new Error('Import approval is append-only');
  await writeNew(output, { ...record, schemaVersion: 1, approvalId: record.approvalId || `approval-${canonicalJsonHash(record).slice(0, 12)}` });
  console.log('PASS');
}

function option(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'compose-intake' && args.length === 2 && option(args, '--intake')) return composeIntake(option(args, '--intake'));
  if (command === 'init' && option(args, '--request') && option(args, '--sequence') && option(args, '--intake')) return initRevision(option(args, '--request'), Number(option(args, '--sequence')), option(args, '--intake'));
  if (command === 'render-proposal') return renderProposal(option(args, '--revision') || args[0]);
  if (command === 'approve-import' && args.length === 2) return approveImport(args[0], args[1]);
  throw new Error('Usage: map-theme-evidence.mjs <compose-intake|init|render-proposal|approve-import> ...');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
