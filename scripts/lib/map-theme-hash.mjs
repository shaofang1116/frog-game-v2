import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { canonicalize } from 'json-canonicalize';

const HASH = /^[a-f0-9]{64}$/;
const SAFE_PATH = /^(?!\/)(?!.*\\)(?!.*%)(?!.*(?:^|\/)\.{1,2}(?:\/|$))[A-Za-z0-9._/-]+$/;

export function normalizeRelativePath(value) {
  if (typeof value !== 'string' || !SAFE_PATH.test(value) || value.includes('//')) {
    throw new Error(`Invalid package-relative path: ${value}`);
  }
  return value;
}

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function canonicalJsonHash(value) {
  return sha256(Buffer.from(canonicalize(value), 'utf8'));
}

export async function hashFile(filePath) {
  return sha256(await fs.readFile(filePath));
}

export async function sourceBundleHash(bundle) {
  const entries = [...bundle.files].map((entry) => {
    const pathName = normalizeRelativePath(entry.path);
    if (!HASH.test(entry.sha256)) throw new Error(`Invalid source hash: ${pathName}`);
    return { ...entry, path: pathName };
  });
  assertDistinct(entries, 'role');
  entries.sort((a, b) => Buffer.compare(Buffer.from(a.role), Buffer.from(b.role)));
  const preimage = [
    'map-theme-source-bundle-v1\n',
    ...entries.map((entry) => `${entry.role}\0${entry.path}\0${entry.mediaType}\0${entry.sha256}\n`)
  ].join('');
  return sha256(Buffer.from(preimage, 'utf8'));
}

export async function packageContentHash(packageDir, manifest) {
  const assets = manifest.layers.map((layer) => normalizeRelativePath(layer.asset));
  assertDistinct(assets, (item) => item);
  const manifestHash = canonicalJsonHash(manifest);
  const assetHashes = await Promise.all(assets.map(async (asset) => ({
    asset,
    hash: await hashRegularFile(packageDir, asset)
  })));
  assetHashes.sort((a, b) => Buffer.compare(Buffer.from(a.asset), Buffer.from(b.asset)));
  const preimage = [
    `map-theme-package-v1\n${manifestHash}\n`,
    ...assetHashes.map(({ asset, hash }) => `${asset}\0${hash}\n`)
  ].join('');
  return sha256(Buffer.from(preimage, 'utf8'));
}

export async function inspectClosedDirectory(rootDir, allowedFiles) {
  const allowed = new Set([...allowedFiles].map(normalizeRelativePath));
  const actual = new Set();
  async function walk(relative = '') {
    const directory = path.join(rootDir, relative);
    for (const name of await fs.readdir(directory)) {
      const childRelative = relative ? `${relative}/${name}` : name;
      const child = path.join(rootDir, childRelative);
      const info = await fs.lstat(child);
      if (info.isSymbolicLink() || !info.isDirectory() && !info.isFile()) {
        throw new Error(`Unsupported directory entry: ${childRelative}`);
      }
      if (info.isDirectory()) {
        await walk(childRelative);
      } else {
        if (info.nlink > 1) throw new Error(`Hard-linked file is not allowed: ${childRelative}`);
        actual.add(normalizeRelativePath(childRelative));
      }
    }
  }
  await walk();
  for (const file of actual) if (!allowed.has(file)) throw new Error(`Unreferenced file: ${file}`);
  for (const file of allowed) if (!actual.has(file)) throw new Error(`Missing referenced file: ${file}`);
  return [...actual].sort();
}

async function hashRegularFile(rootDir, relativePath) {
  const target = path.resolve(rootDir, relativePath);
  if (!target.startsWith(`${path.resolve(rootDir)}${path.sep}`)) throw new Error('Asset escapes package directory');
  const info = await fs.lstat(target);
  if (!info.isFile() || info.nlink > 1) throw new Error(`Invalid asset file: ${relativePath}`);
  return hashFile(target);
}

function assertDistinct(values, selector) {
  const seen = new Set();
  for (const value of values) {
    const key = typeof selector === 'function' ? selector(value) : value[selector];
    if (seen.has(key)) throw new Error(`Duplicate value: ${key}`);
    seen.add(key);
  }
}
