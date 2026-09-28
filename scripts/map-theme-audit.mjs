import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateImportChain } from './map-theme-validate.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function valueFor(args, flag) {
  const index = args.indexOf(flag);
  return index < 0 ? undefined : args[index + 1];
}

async function main() {
  const args = process.argv.slice(2);
  const root = valueFor(args, '--root') || repositoryRoot;
  const revision = valueFor(args, '--staging-fixture') ||
    path.join(repositoryRoot, 'demo', 'tests', 'fixtures', 'map-theme', 'valid');
  const runtime = valueFor(args, '--runtime') || path.join(revision, 'runtime', 'fixture-map');
  if ((args.includes('--root') && !valueFor(args, '--root')) ||
      (args.includes('--staging-fixture') && !valueFor(args, '--staging-fixture')) ||
      (args.includes('--runtime') && !valueFor(args, '--runtime'))) {
    throw new Error('Usage: map-theme-audit.mjs --root <repository-root> --staging-fixture <explicit-revision-path> --runtime <imported-package-directory>');
  }
  const resolvedRoot = path.resolve(root);
  await fs.access(resolvedRoot);
  await validateImportChain(path.resolve(revision), path.resolve(runtime));
  console.log('PASS');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
