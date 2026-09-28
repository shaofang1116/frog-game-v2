import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJsonHash, hashFile } from './lib/map-theme-hash.mjs';
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

function stableText(label, value) {
  return `${label}\n${JSON.stringify(value)}\n`;
}

async function renderProposal(revision) {
  const result = await checkBuild(revision);
  const review = path.join(result.ctx.revision, 'review');
  try {
    await fs.lstat(review);
    throw new Error('Review evidence is append-only');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
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
    const content = contents.get(role);
    await fs.writeFile(path.join(review, 'files', name), content, { flag: 'wx' });
    entries.push({ role, path: name, mediaType: 'text/plain', sha256: await hashFile(path.join(review, 'files', name)) });
  }
  await fs.writeFile(path.join(review, 'review-evidence.json'), `${JSON.stringify({ schemaVersion: 1, packageId: result.manifest.packageId, revisionId: result.bundle.revisionId, entries })}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ reviewEvidenceHash: canonicalJsonHash({ schemaVersion: 1, packageId: result.manifest.packageId, revisionId: result.bundle.revisionId, entries }) }));
}

async function approveImport(revision, authorization) {
  const record = JSON.parse(await fs.readFile(authorization, 'utf8'));
  if (!record.approvedBy || !record.approvedAt || !record.packageContentHash || !record.validationReportHash || !record.reviewEvidenceHash) {
    throw new Error('Explicit recorded authorization with exact hashes is required');
  }
  const ctx = await context(revision);
  const output = path.join(ctx.revision, 'approval', 'import-approval.json');
  try {
    await fs.lstat(output);
    throw new Error('Import approval is append-only');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await fs.writeFile(output, `${JSON.stringify({ ...record, schemaVersion: 1, approvalId: record.approvalId || `approval-${canonicalJsonHash(record).slice(0, 12)}` })}\n`, { flag: 'wx' });
  console.log('PASS');
}

async function main() {
  const [command, revision, authorization] = process.argv.slice(2);
  if (command === 'render-proposal' && revision && !authorization) return renderProposal(revision);
  if (command === 'approve-import' && revision && authorization) return approveImport(revision, authorization);
  throw new Error('Usage: map-theme-evidence.mjs <render-proposal|approve-import> <explicit-revision-path> [authorization.json]');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
