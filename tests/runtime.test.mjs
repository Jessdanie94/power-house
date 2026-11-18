import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createOperatorServer, operatorStatus } from '../app/server.js';
import { root } from '../scripts/credential-scan.mjs';

async function running(t, options) {
  const server = await createOperatorServer(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return `http://127.0.0.1:${server.address().port}`;
}

test('liveness is process-only and independent of business readiness', async t => {
  const base = await running(t);
  for (const route of ['/health/live', '/api/health']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { live: true, scope: 'process_only', businessReady: false });
  }
  const ready = await fetch(base + '/health/ready');
  assert.equal(ready.status, 503);
  assert.equal((await ready.json()).status, 'unknown');
});

test('read-only status and telemetry keep missing actuals null', async t => {
  const base = await running(t);
  for (const route of ['/api/status', '/api/telemetry', '/api/revenue']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), operatorStatus());
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  assert.equal(operatorStatus().revenue.gross, null);
  assert.equal(operatorStatus().telemetry.orders, null);
  assert.equal(operatorStatus().ai.predictions, null);
});

test('unsupported payment, webhook, supplier, payout and legacy routes always fail closed', async t => {
  const base = await running(t);
  const routes = ['/api/checkout', '/checkout', '/api/payments/capture', '/api/payment', '/api/paypal', '/api/stripe', '/api/webhooks/shopify', '/webhook', '/api/suppliers/fulfill', '/api/supplier', '/api/payout', '/api/payouts', '/api/deposit', '/api/transfers', '/api/orders', '/api/refunds', '/api/oauth', '/api/sync'];
  for (const route of routes) for (const method of ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']) {
    const response = await fetch(base + route, { method });
    assert.equal(response.status, 503, `${method} ${route}`);
    const data = await response.json();
    assert.equal(data.executed, false);
    assert.equal(data.approvalRequired, true);
  }
});

test('status mutations are rejected instead of acknowledged', async t => {
  const base = await running(t);
  const response = await fetch(base + '/api/status', { method: 'POST', body: '{"gross":100}' });
  assert.equal(response.status, 405);
  assert.equal((await response.json()).executed, false);
});

test('unapproved public files, source files and SPA fallback routes are never served', async t => {
  const base = await running(t);
  for (const route of ['/sync.txt', '/public/sync.txt', '/shop.html', '/dashboard.html', '/.env', '/server.js', '/package.json', '/src/App.jsx', '/.vite/manifest.json', '/assets/unlisted.js', '/customer-store', '/api/products']) {
    assert.equal((await fetch(base + route)).status, 404, route);
  }
});

test('malformed and encoded traversal paths are rejected', async t => {
  const base = await running(t);
  for (const route of ['/%ZZ', '/%00', '/assets/%2e%2e%2findex.html', '/assets/%5cindex.html']) {
    assert.equal((await fetch(base + route)).status, 400, route);
  }
});

test('missing operator build does not fall back to customer public directory', async t => {
  const base = await running(t, { buildDir: `${root}/.validation/nonexistent-build` });
  assert.equal((await fetch(base + '/')).status, 503);
  assert.equal((await fetch(base + '/health/live')).status, 200);
});

test('HEAD status has no body and safe response headers', async t => {
  const base = await running(t);
  const response = await fetch(base + '/api/status', { method: 'HEAD' });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.match(response.headers.get('content-security-policy'), /connect-src 'self'/);
});

test('expected npm entrypoint starts and stops without legacy provider activity', async t => {
  const child = spawn(process.execPath, ['app/server.js'], {
    cwd: root,
    env: { PATH: process.env.PATH, PORT: '0', HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(() => { if (child.exitCode === null) child.kill('SIGTERM'); });
  let output = '';
  const port = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Runtime startup timed out')), 5000);
    child.once('error', error => { clearTimeout(timeout); reject(error); });
    child.stdout.on('data', data => {
      output += data.toString();
      const match = output.match(/listening on port (\d+)/);
      if (match) { clearTimeout(timeout); resolve(Number(match[1])); }
    });
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Runtime exited early (${code})`)); });
  });
  assert.equal((await fetch(`http://127.0.0.1:${port}/health/live`)).status, 200);
  const exited = once(child, 'exit');
  child.kill('SIGTERM');
  assert.equal((await exited)[0], 0);
});
