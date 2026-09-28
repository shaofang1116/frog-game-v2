import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJsonHash, inspectClosedDirectory, packageContentHash } from './lib/map-theme-hash.mjs';
import { context, readArtifact, receiptBytes, validatePackage } from './map-theme-validate.mjs';

async function absent(target, message) {
  try {
    await fs.lstat(target);
    throw new Error(message);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function main() {
  const [flag, revision, destination] = process.argv.slice(2);
  if (flag !== '--revision' || !revision || !destination) {
    throw new Error('Usage: map-theme-import.mjs --revision <explicit-revision-path> <new-demo-maps-directory>');
  }
  const result = await validatePackage(revision);
  const ctx = await context(revision);
  const approval = await readArtifact(ctx, 'approval/import-approval.json', 'import-approval-v1.schema.json');
  if (approval.packageId !== result.manifest.packageId || approval.revisionId !== result.bundle.revisionId ||
      approval.mappingApprovalHash !== canonicalJsonHash(result.approval) || approval.packageContentHash !== result.contentHash ||
      approval.validationReportHash !== canonicalJsonHash(result.report) || approval.reviewEvidenceHash !== result.reviewHash ||
      approval.acceptedDeviationIds.length !== result.report.deviations.length ||
      approval.acceptedDeviationIds.some((id) => !result.report.deviations.includes(id))) {
    throw new Error('Import approval does not authorize exact validated package');
  }
  const expected = receiptBytes(result, approval);
  const archive = path.join(result.ctx.revision, 'import');
  await fs.mkdir(archive, { recursive: true });
  const archivedReceipt = path.join(archive, 'import-receipt.json');
  await absent(archivedReceipt, 'Import receipt is append-only');
  const target = path.resolve(destination);
  await absent(target, 'Refusing to overwrite existing destination');
  const temporary = `${target}.tmp-${process.pid}`;
  await absent(temporary, 'Refusing to reuse temporary destination');
  try {
    await fs.cp(path.join(result.ctx.revision, 'build'), temporary, { recursive: true, errorOnExist: true, dereference: false });
    await fs.writeFile(path.join(temporary, 'import-receipt.json'), expected, { flag: 'wx' });
    await inspectClosedDirectory(temporary, ['map-theme.json', 'import-receipt.json', ...result.manifest.layers.map((layer) => layer.asset)]);
    if (await packageContentHash(temporary, result.manifest) !== result.contentHash) {
      throw new Error('Temporary import content hash mismatch');
    }
    await fs.writeFile(archivedReceipt, expected, { flag: 'wx' });
    await fs.rename(temporary, target);
  } catch (error) {
    await fs.rm(temporary, { recursive: true, force: true });
    await fs.rm(archivedReceipt, { force: true });
    throw error;
  }
  console.log('PASS');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
