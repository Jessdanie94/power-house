import { createServer as createHttpServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const blocked = /(?:^|\/)(?:checkout|payments?|pay|paypal|stripe|webhooks?|suppliers?|fulfillment|payouts?|deposits?|transfers?|orders?|refunds?|capture|oauth|sync)(?:\/|$)/i;
const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

export function operatorStatus() {
  return {
    mode: 'operator_read_only',
    process: { live: true },
    business: { ready: false, status: 'unknown', reason: 'External integrations are not connected or verified by this runtime.' },
    revenue: { status: 'unavailable', gross: null, net: null, currency: null, observedAt: null, source: null },
    telemetry: { orders: null, inventory: null, supplierAvailability: null, observedAt: null, source: null },
    ai: { status: 'unavailable', predictions: null },
    capabilities: { checkout: false, paymentCapture: false, webhooks: false, supplierActions: false, payouts: false },
    approvalRequired: true
  };
}

async function buildAllowlist(buildDir) {
  const allowlist = new Map();
  try {
    const base = await realpath(buildDir);
    const manifest = JSON.parse(await readFile(path.join(base, '.vite', 'manifest.json'), 'utf8'));
    const files = new Set(['index.html']);
    for (const entry of Object.values(manifest)) {
      for (const file of [entry.file, ...(entry.css || [])]) {
        if (typeof file === 'string' && /^assets\/[A-Za-z0-9_-]+\.(?:js|css)$/.test(file)) files.add(file);
      }
    }
    for (const file of files) {
      const absolute = await realpath(path.join(base, file));
      // Refuse symlinks and any file outside the selected build tree.
      if (absolute !== path.join(base, file)) continue;
      allowlist.set(file === 'index.html' ? '/' : `/${file}`, absolute);
    }
  } catch {
    // Missing or malformed builds must not fall back to legacy public content.
    allowlist.clear();
  }
  return allowlist;
}

export async function createOperatorServer({ buildDir = path.join(projectRoot, 'dist') } = {}) {
  const allowlist = await buildAllowlist(buildDir);
  const server = createHttpServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    function json(code, data) {
      res.statusCode = code;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(req.method === 'HEAD' ? undefined : JSON.stringify(data));
    }
    let pathname;
    try {
      // Inspect raw path rather than normalizing traversal into an allowed path.
      pathname = decodeURIComponent((req.url || '/').split('?')[0]);
      if (!pathname.startsWith('/') || pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some(part => part === '.' || part === '..')) {
        return json(400, { error: 'INVALID_PATH' });
      }
    } catch {
      return json(400, { error: 'INVALID_PATH' });
    }
    if (blocked.test(pathname)) {
      return json(503, { error: 'ACTION_UNAVAILABLE', executed: false, approvalRequired: true, message: 'This operator runtime does not execute business actions. Merchant and supplier verification plus explicit approval are required.' });
    }
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.setHeader('Allow', 'GET, HEAD');
      return json(405, { error: 'READ_ONLY', executed: false });
    }
    if (['/health/live', '/api/health'].includes(pathname)) {
      return json(200, { live: true, scope: 'process_only', businessReady: false });
    }
    if (pathname === '/health/ready') {
      return json(503, { ready: false, status: 'unknown', reason: 'Business capabilities are unavailable; process liveness is separate.' });
    }
    if (['/api/status', '/api/telemetry', '/api/revenue'].includes(pathname)) {
      return json(200, operatorStatus());
    }
    const assetPath = ['/operator', '/operator/'].includes(pathname) ? '/' : pathname;
    const file = allowlist.get(assetPath);
    if (!file) return json(pathname === '/' || assetPath === '/' ? 503 : 404, { error: assetPath === '/' ? 'OPERATOR_BUILD_UNAVAILABLE' : 'NOT_FOUND' });
    try {
      // Recheck at request time to reject a replaced symlink.
      if (await realpath(file) !== file) return json(404, { error: 'NOT_FOUND' });
      const data = await readFile(file);
      res.statusCode = 200;
      res.setHeader('Content-Type', contentTypes[path.extname(file)]);
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch {
      json(503, { error: 'OPERATOR_BUILD_UNAVAILABLE' });
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  return server;
}

export async function startOperatorServer() {
  const rawPort = process.env.PORT ?? '8001';
  if (!/^\d+$/.test(rawPort) || Number(rawPort) > 65535) throw new Error('PORT must be an integer from 0 to 65535.');
  const server = await createOperatorServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(Number(rawPort), process.env.HOST || '0.0.0.0', resolve);
  });
  console.info(`Operator-only read-only runtime listening on port ${server.address().port}; business actions unavailable.`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
  return server;
}

// Importing this module never starts a listener or imports legacy workers.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startOperatorServer().catch(() => {
    console.error('Operator runtime startup failed. Check PORT and local bind availability.');
    process.exitCode = 1;
  });
}
