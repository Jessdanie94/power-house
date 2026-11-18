import { readFile, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rules = [
  ['payment-key', /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9_]{16,}\b/],
  ['payment-webhook', /\bwhsec_[A-Za-z0-9]{16,}\b/],
  ['commerce-token', /\bshp(?:at|ss|ca|pa)_[A-Za-z0-9]{16,}\b/],
  ['source-control-token', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ['source-control-pat', /\bgithub_pat_[A-Za-z0-9_]{20,}\b/]
];

export function credentialFindings(text) {
  return rules.filter(([, pattern]) => pattern.test(text)).map(([category]) => category);
}

async function walk(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error('SYMLINK_IN_SELECTED_TREE');
      if (entry.isDirectory()) files.push(...await walk(absolute));
      else if (entry.isFile()) files.push(absolute);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return files;
}

export async function scanSelectedSources({ requireBuild = false } = {}) {
  const files = new Set();
  const directories = ['src', 'scripts', 'tests', '.github/workflows', 'dist'];
  for (const directory of directories) for (const file of await walk(path.join(root, directory))) files.add(file);
  for (const file of ['app/server.js', 'index.html', 'vite.config.js', 'postcss.config.js', 'package.json', 'package-lock.json', '.npmrc', 'README.md', 'ROLLOUT.md', 'public/sync.txt', 'shopify_auth_attempt.js', 'shopify_recon_v2.js', 'stripe_recon.js', 'revenueApp.js', 'revenueVault.js', 'automation/revenueDeposit.js', 'nodes/aiOrchestrator.js']) files.add(path.join(root, file));
  if (requireBuild) {
    await stat(path.join(root, 'dist/index.html'));
    await stat(path.join(root, 'dist/.vite/manifest.json'));
    for (const file of await walk(path.join(root, 'dist'))) {
      const relative = path.relative(path.join(root, 'dist'), file).split(path.sep).join('/');
      if (relative !== 'index.html' && relative !== '.vite/manifest.json' && !/^assets\/[A-Za-z0-9_-]+\.(?:js|css)$/.test(relative)) {
        throw new Error('UNAPPROVED_BUILD_FILE');
      }
    }
  }
  const findings = [];
  for (const file of files) {
    try {
      const text = await readFile(file, 'utf8');
      for (const category of credentialFindings(text)) findings.push({ file: path.relative(root, file), category, location: 'working-tree' });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  // Read the index, not diffs: a staged secret cannot hide behind a clean working copy.
  const staged = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  for (const file of staged) {
    const text = execFileSync('git', ['show', `:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
    for (const category of credentialFindings(text)) findings.push({ file, category, location: 'staged-index' });
  }
  return { checkedFiles: files.size, checkedStagedFiles: staged.length, findings };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await scanSelectedSources({ requireBuild: process.argv.includes('--require-build') });
    if (result.findings.length) {
      for (const finding of result.findings) console.error(`Credential guard blocked ${finding.location}: ${finding.file} (${finding.category}); matched value omitted.`);
      process.exitCode = 1;
    } else console.info(`Credential guard passed: ${result.checkedFiles} selected working-tree files; ${result.checkedStagedFiles} staged files. Selected patterns only; not an exhaustive secret audit.`);
  } catch {
    console.error('Credential guard failed: required source/build/index inspection could not be completed.');
    process.exitCode = 1;
  }
}
