import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJsonHash, hashFile, inspectClosedDirectory, packageContentHash, sourceBundleHash } from './lib/map-theme-hash.mjs';
import { loadMapThemeSchemas, validateOrThrow } from './lib/map-theme-schema.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemas = path.join(root, 'schemas', 'map-theme');
const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const fail = (message) => { throw new Error(message); };
const sameSet = (actual, expected, label) => {
  if (actual.length !== expected.length || new Set(actual).size !== actual.length || actual.some((value) => !expected.includes(value))) {
    fail(`${label} must match exactly`);
  }
};
const hash = (value) => canonicalJsonHash(value);

export async function context(revision) {
  const { ajv } = await loadMapThemeSchemas(schemas);
  return { revision: path.resolve(revision), ajv };
}

export async function readArtifact(ctx, relative, schema) {
  return validateOrThrow(ctx.ajv, schema, await readJson(path.join(ctx.revision, relative)));
}

async function closedArtifactDirectory(ctx, directory, files) {
  await inspectClosedDirectory(path.join(ctx.revision, directory), files);
}

async function closedEvidence(ctx) {
  const artifact = await readArtifact(ctx, 'review/review-evidence.json', 'review-evidence-v1.schema.json');
  const roles = artifact.entries.map((entry) => entry.role);
  const requiredRoles = [
    'viewport-preview', 'visual-diff', 'asset-size-report', 'protected-element-report',
    'accessibility-motion-report', 'performance-report', 'deviation-list'
  ];
  sameSet(roles, requiredRoles, 'Review evidence roles');
  await closedArtifactDirectory(ctx, 'review', [
    'review-evidence.json',
    ...artifact.entries.map((entry) => `files/${entry.path}`)
  ]);
  for (const entry of artifact.entries) {
    if (await hashFile(path.join(ctx.revision, 'review', 'files', entry.path)) !== entry.sha256) {
      fail(`Evidence hash mismatch: ${entry.path}`);
    }
  }
  return { artifact, reviewHash: hash(artifact) };
}

function assertIdsMatch(value, expected, label) {
  sameSet(value, expected, label);
}

function validateRects(rects, label) {
  for (const rect of rects) {
    if (rect.x + rect.width > 1 || rect.y + rect.height > 1) fail(`${label} escapes normalized viewport`);
  }
}

export async function validateSubmission(revision) {
  const ctx = await context(revision);
  const bundle = await readArtifact(ctx, 'source/source-bundle.json', 'source-bundle-v1.schema.json');
  const brief = await readArtifact(ctx, 'source/map-design-brief.json', 'map-design-brief-v1.schema.json');
  const provenance = await readArtifact(ctx, 'source/provenance.json', 'provenance-v1.schema.json');
  const admission = await readArtifact(ctx, 'analysis/admission-report.json', 'admission-report-v1.schema.json');
  const inventory = await readArtifact(ctx, 'analysis/element-inventory.json', 'element-inventory-v1.schema.json');
  const proposal = await readArtifact(ctx, 'proposal/mapping-proposal.json', 'mapping-proposal-v1.schema.json');
  const layerPlan = await readArtifact(ctx, 'proposal/layer-plan.json', 'layer-plan-v1.schema.json');
  const semanticMap = await readArtifact(ctx, 'proposal/semantic-map.json', 'semantic-map-v1.schema.json');

  const requestId = bundle.requestId;
  const revisionId = bundle.revisionId;
  if (brief.requestId !== requestId) fail('Submission request mismatch');
  for (const artifact of [admission, inventory, proposal, layerPlan, semanticMap]) {
    if (artifact.requestId !== requestId || artifact.revisionId !== revisionId) fail('Submission artifact request/revision mismatch');
  }
  if (brief.provenance.provenanceId !== provenance.provenanceId || brief.provenance.provenanceHash !== hash(provenance)) {
    fail('Brief provenance mismatch');
  }
  const sourceHash = await sourceBundleHash(bundle);
  if (!provenance.sourceHashes.includes(...bundle.files.map((file) => file.sha256))) fail('Provenance source hash mismatch');
  if (admission.submissionClass !== 'IMPORT_CANDIDATE' || admission.workflowState !== 'APPROVED' ||
      admission.score < 85 || admission.hardGates.some((gate) => !gate.passed)) fail('Admission is not import eligible');
  validateRects([brief.gameplayCorridor, ...brief.safeZones], 'Brief geometry');

  await closedArtifactDirectory(ctx, 'source', [
    'source-bundle.json', 'map-design-brief.json', 'provenance.json',
    ...bundle.files.map((file) => `files/${file.path}`)
  ]);
  for (const file of bundle.files) {
    if (await hashFile(path.join(ctx.revision, 'source', 'files', file.path)) !== file.sha256) fail(`Source hash mismatch: ${file.path}`);
  }
  await closedArtifactDirectory(ctx, 'analysis', ['admission-report.json', 'element-inventory.json']);
  await closedArtifactDirectory(ctx, 'proposal', [
    'mapping-proposal.json', 'layer-plan.json', 'semantic-map.json', 'diff-report.md', 'preview.png'
  ]);

  const regionIds = inventory.regions.map((region) => region.id);
  if (new Set(regionIds).size !== regionIds.length) fail('Inventory region IDs must be unique');
  assertIdsMatch(proposal.regionDecisions.map((decision) => decision.regionId), regionIds, 'Proposal region decisions');
  for (const decision of proposal.regionDecisions) {
    if (inventory.regions.find((region) => region.id === decision.regionId).disposition !== decision.disposition) {
      fail(`Proposal disposition mismatch: ${decision.regionId}`);
    }
  }
  assertIdsMatch(proposal.layerPlan, layerPlan.layers.map((layer) => layer.id), 'Proposal layer plan');
  for (const layer of layerPlan.layers) {
    for (const regionId of layer.sourceRegionIds) {
      const region = inventory.regions.find((entry) => entry.id === regionId);
      if (!region || !['KEEP_BACKGROUND', 'REBUILD_BACKGROUND'].includes(region.disposition)) {
        fail(`Layer references unapproved background region: ${regionId}`);
      }
    }
  }
  assertIdsMatch(proposal.semanticBindings, semanticMap.bindings.map((binding) => binding.sourceRegionId), 'Proposal semantic bindings');
  for (const binding of semanticMap.bindings) {
    if (!regionIds.includes(binding.sourceRegionId)) fail(`Semantic binding has unknown region: ${binding.sourceRegionId}`);
  }
  if (proposal.sourceBundleHash !== sourceHash || proposal.briefHash !== hash(brief) || proposal.provenanceHash !== hash(provenance)) {
    fail('Proposal source binding mismatch');
  }
  return { ctx, bundle, brief, provenance, admission, inventory, proposal, layerPlan, semanticMap, sourceHash, proposalHash: hash(proposal) };
}

export async function checkBuild(revision) {
  const submission = await validateSubmission(revision);
  const { ctx } = submission;
  const manifest = await readArtifact(ctx, 'build/map-theme.json', 'map-theme-package-v1.schema.json');
  const approval = await readArtifact(ctx, 'approval/mapping-approval.json', 'mapping-approval-v1.schema.json');
  if (approval.requestId !== submission.bundle.requestId || approval.revisionId !== submission.bundle.revisionId ||
      approval.proposalHash !== submission.proposalHash || approval.sourceBundleHash !== submission.sourceHash ||
      approval.briefHash !== hash(submission.brief) || approval.provenanceHash !== hash(submission.provenance)) {
    fail('Mapping approval source binding mismatch');
  }
  assertIdsMatch(approval.acceptedLayerIds, submission.layerPlan.layers.map((layer) => layer.id), 'Mapping approval layers');
  assertIdsMatch(approval.rejectedRegionIds, submission.inventory.regions.filter((region) => region.disposition === 'REJECT').map((region) => region.id), 'Mapping approval rejected regions');
  assertIdsMatch(approval.canonicalBindings, submission.semanticMap.bindings.map((binding) => binding.canonicalElementId), 'Mapping approval canonical bindings');
  const source = manifest.sourceEvidence;
  if (source.revisionId !== submission.bundle.revisionId || source.sourceBundleHash !== submission.sourceHash ||
      source.briefHash !== hash(submission.brief) || source.provenanceId !== submission.provenance.provenanceId ||
      source.provenanceHash !== hash(submission.provenance) || source.mappingApprovalHash !== hash(approval)) {
    fail('Manifest source binding mismatch');
  }
  validateRects(manifest.viewport.safeZones, 'Manifest safe zones');
  if (manifest.viewport.cameraModel !== submission.brief.cameraModel) fail('Manifest camera model mismatch');
  assertIdsMatch(manifest.layers.map((layer) => layer.id), approval.acceptedLayerIds, 'Manifest layers');
  const motion = manifest.layers.reduce((sum, layer) => sum + layer.motion.maxInstances, 0);
  if (motion > manifest.budgets.motionInstances || manifest.budgets.motionInstances > 48 || manifest.layers.length > manifest.budgets.drawCalls) {
    fail('Manifest motion or draw budget exceeded');
  }
  await closedArtifactDirectory(ctx, 'build', ['map-theme.json', ...manifest.layers.map((layer) => layer.asset)]);
  const contentHash = await packageContentHash(path.join(ctx.revision, 'build'), manifest);
  const bytes = (await Promise.all(manifest.layers.map((layer) => fs.stat(path.join(ctx.revision, 'build', layer.asset))))).reduce((sum, entry) => sum + entry.size, 0);
  if (bytes > manifest.budgets.compressedBytes) fail('Asset budget exceeded');
  return { ...submission, manifest, approval, contentHash };
}

export async function validatePackage(revision) {
  const build = await checkBuild(revision);
  const { artifact: review, reviewHash } = await closedEvidence(build.ctx);
  const report = await readArtifact(build.ctx, 'validation/validation-report.json', 'validation-report-v1.schema.json');
  await closedArtifactDirectory(build.ctx, 'validation', ['validation-report.json']);
  if (review.packageId !== build.manifest.packageId || review.revisionId !== build.bundle.revisionId ||
      !report.passed || report.packageId !== build.manifest.packageId || report.revisionId !== build.bundle.revisionId ||
      report.mappingApprovalHash !== hash(build.approval) || report.packageContentHash !== build.contentHash ||
      report.reviewEvidenceHash !== reviewHash || report.checks.some((check) => !check.passed)) {
    fail('Validation report binding mismatch');
  }
  return { ...build, review, report, reviewHash };
}

export function receiptBytes(result, importApproval) {
  const receipt = {
    schemaVersion: 1, packageId: result.manifest.packageId, revisionId: result.bundle.revisionId,
    packageContentHash: result.contentHash, mappingApprovalHash: hash(result.approval),
    validationReportHash: hash(result.report), reviewEvidenceHash: result.reviewHash,
    mappingApprovalId: result.approval.approvalId, importApprovalHash: hash(importApproval),
    importApprovalId: importApproval.approvalId, importedAt: importApproval.approvedAt
  };
  return Buffer.from(`${JSON.stringify(receipt)}\n`, 'utf8');
}

export async function validateImportChain(revision, runtimeDirectory) {
  const result = await validatePackage(revision);
  const ctx = await context(revision);
  const importApproval = await readArtifact(ctx, 'approval/import-approval.json', 'import-approval-v1.schema.json');
  const expectedDeviations = result.report.deviations;
  if (importApproval.packageId !== result.manifest.packageId || importApproval.revisionId !== result.bundle.revisionId ||
      importApproval.mappingApprovalHash !== hash(result.approval) || importApproval.packageContentHash !== result.contentHash ||
      importApproval.validationReportHash !== hash(result.report) || importApproval.reviewEvidenceHash !== result.reviewHash) {
    fail('Import approval does not authorize exact validated package');
  }
  assertIdsMatch(importApproval.acceptedDeviationIds, expectedDeviations, 'Accepted deviations');
  const archived = path.join(result.ctx.revision, 'import', 'import-receipt.json');
  const runtime = path.resolve(runtimeDirectory);
  const archivedBytes = await fs.readFile(archived);
  const runtimeBytes = await fs.readFile(path.join(runtime, 'import-receipt.json'));
  if (!archivedBytes.equals(runtimeBytes) || !archivedBytes.equals(receiptBytes(result, importApproval))) fail('Archived/runtime receipt mismatch');
  const receipt = validateOrThrow(ctx.ajv, 'import-receipt-v1.schema.json', JSON.parse(archivedBytes));
  if (receipt.packageId !== result.manifest.packageId || receipt.revisionId !== result.bundle.revisionId ||
      receipt.packageContentHash !== result.contentHash || receipt.mappingApprovalHash !== hash(result.approval) ||
      receipt.validationReportHash !== hash(result.report) || receipt.reviewEvidenceHash !== result.reviewHash ||
      receipt.mappingApprovalId !== result.approval.approvalId || receipt.importApprovalHash !== hash(importApproval) ||
      receipt.importApprovalId !== importApproval.approvalId) fail('Receipt chain mismatch');
  await inspectClosedDirectory(runtime, ['map-theme.json', 'import-receipt.json', ...result.manifest.layers.map((layer) => layer.asset)]);
  if (await hashFile(path.join(runtime, 'map-theme.json')) !== await hashFile(path.join(result.ctx.revision, 'build', 'map-theme.json'))) {
    fail('Runtime manifest differs from staged manifest');
  }
  if (await packageContentHash(runtime, result.manifest) !== result.contentHash) fail('Runtime content hash mismatch');
  return { ...result, importApproval, receipt };
}

async function main() {
  const [command, revision] = process.argv.slice(2);
  if (!command || !revision || !['submission', 'check-build', 'validate', 'budget'].includes(command)) {
    fail('Usage: map-theme-validate.mjs <submission|check-build|validate|budget> <explicit-revision-path>');
  }
  const result = command === 'submission' ? await validateSubmission(revision) :
    command === 'check-build' || command === 'budget' ? await checkBuild(revision) : await validatePackage(revision);
  console.log(command === 'budget' ? JSON.stringify({ compressedBytes: result.manifest.budgets.compressedBytes }) : 'PASS');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
