import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { credentialFindings, scanSelectedSources, root } from '../scripts/credential-scan.mjs';
import { runRevenueCheck } from '../revenueApp.js';
import { calculateRevenueAllocation, processAutomatedRevenueDeposit } from '../automation/revenueDeposit.js';
import { calculateNetRevenue, determinePayoutDestination } from '../revenueVault.js';
import { getMissionPredictions } from '../nodes/aiOrchestrator.js';

test('credential scanner detects synthetic patterns without revealing values', () => {
  // Construct fixtures, never use actual credentials from the repository.
  const fixtures = [['sk', 'live'], ['pk', 'test'], ['rk', 'live'], ['shpat'], ['shpss'], ['ghp'], ['github', 'pat'], ['whsec']];
  for (const parts of fixtures) {
    const sample = `${parts.join('_')}_${'A'.repeat(40)}`;
    const findings = credentialFindings(sample);
    assert.equal(findings.length, 1, 'Expected selected credential category');
    assert.ok(!JSON.stringify(findings).includes(sample));
  }
  assert.deepEqual(credentialFindings('process.env.STRIPE_SECRET_KEY'), []);
});

test('selected source, staged contents and built artifacts pass the offline credential guard', async () => {
  const scan = await scanSelectedSources({ requireBuild: true });
  assert.equal(scan.findings.length, 0, 'Selected credential pattern detected; values omitted.');
  assert.ok(scan.checkedFiles > 20);
});

test('legacy revenue check reports unavailable instead of fabricated daily sales', async () => {
  const result = await runRevenueCheck();
  assert.equal(result.grossRevenue, null);
  assert.equal(result.netRevenue, null);
  assert.equal(result.payout, null);
  assert.equal(result.executed, false);
});

test('revenue allocation is an explicit pure proposal, not a bank deposit', async () => {
  assert.deepEqual(calculateRevenueAllocation(10000, 7000), { totalOrderAmount: 10000, supplierShare: 7000, retainedShare: 3000, status: 'proposal_only', approvalRequired: true, executed: false });
  const result = await processAutomatedRevenueDeposit(10000, 'unverified-supplier');
  assert.equal(result.status, 'unavailable');
  assert.equal(result.executed, false);
  assert.equal(result.transferId, null);
});

test('allocation requires reviewed inputs and handles integer rounding safely', () => {
  for (const args of [[100], [-1, 7000], [1.5, 7000], [100, 10001], [Number.MAX_SAFE_INTEGER + 1, 7000]]) assert.throws(() => calculateRevenueAllocation(...args));
  const result = calculateRevenueAllocation(Number.MAX_SAFE_INTEGER, 7000);
  assert.ok(Number.isSafeInteger(result.supplierShare));
  assert.equal(result.supplierShare + result.retainedShare, Number.MAX_SAFE_INTEGER);
});

test('legacy vault has no default account destination or available payout claim', async () => {
  assert.equal(calculateNetRevenue().gross, null);
  assert.equal(calculateNetRevenue(100, 0.25).available_for_payout, null);
  const payout = await determinePayoutDestination(100000);
  assert.equal(payout.destination, null);
  assert.equal(payout.executed, false);
});

test('legacy AI returns unavailable rather than mocked live predictions', async () => {
  const result = await getMissionPredictions();
  assert.equal(result.status, 'unavailable');
  assert.equal(result.predicted_high_demand_sku, null);
  assert.equal(result.scaling_multiplier, null);
});

test('selected financial modules never import network clients, env loaders or auto-run', async () => {
  for (const file of ['revenueApp.js', 'revenueVault.js', 'automation/revenueDeposit.js', 'app/server.js']) {
    const text = await readFile(`${root}/${file}`, 'utf8');
    assert.doesNotMatch(text, /from ['"](?:stripe|axios|dotenv|.*workers\/)/);
    assert.doesNotMatch(text, /transfers\.create|runRevenueCheck\(\)\.catch|dotenv\/config/);
  }
  for (const file of ['shopify_auth_attempt.js', 'shopify_recon_v2.js', 'stripe_recon.js']) {
    const text = await readFile(`${root}/${file}`, 'utf8');
    assert.doesNotMatch(text, /^run\(\);|^attempt\(/m);
    assert.doesNotMatch(text, /console\.(?:log|error).*response\.data\.access_token/);
  }
});

test('all workflows are UTF-8 validation-only and do not use provider secrets', async () => {
  for (const file of ['core.yml', 'deploy.yml', 'shopify-api-check.yml']) {
    const bytes = await readFile(`${root}/.github/workflows/${file}`);
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    assert.match(text, /run: npm ci/);
    assert.match(text, /run: npm run validate/);
    assert.doesNotMatch(text, /\$\{\{\s*secrets\.|curl |run-shell:|node validateEnv|run:.*(?:deploy|shopify|testShopify)/i);
  }
  const manual = await readFile(`${root}/.github/workflows/deploy.yml`, 'utf8');
  assert.doesNotMatch(manual, /push:|schedule:/);
});
