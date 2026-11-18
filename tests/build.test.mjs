import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { createOperatorServer } from '../app/server.js';
import { root } from '../scripts/credential-scan.mjs';

async function serve(t, options) {
  const server = await createOperatorServer(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return `http://127.0.0.1:${server.address().port}`;
}

test('build contains only operator index, manifest and bundled JS/CSS, never public notes', async () => {
  const names = await readdir(`${root}/dist`);
  assert.deepEqual(names.sort(), ['.vite', 'assets', 'index.html']);
  const html = await readFile(`${root}/dist/index.html`, 'utf8');
  assert.match(html, /Read-only Operator Status/);
  assert.doesNotMatch(html, /googletagmanager|sync\.txt|shop\.html/);
  const assets = await readdir(`${root}/dist/assets`);
  for (const file of assets) assert.match(file, /^[A-Za-z0-9_-]+\.(?:js|css)$/);
  const script = assets.find(file => file.endsWith('.js'));
  const bundle = await readFile(`${root}/dist/assets/${script}`, 'utf8');
  assert.match(bundle, /This is not a customer storefront/);
  assert.match(bundle, /No live model is connected/);
  assert.doesNotMatch(bundle, /471\.71|AI_BOOST_ACTIVE|Sovereign Tactical Deployment Kit/);
});

test('built operator index and manifest-listed assets serve with correct types', async t => {
  const base = await serve(t);
  for (const route of ['/', '/operator', '/operator/']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Read-only Operator Status/);
  }
  const manifest = JSON.parse(await readFile(`${root}/dist/.vite/manifest.json`, 'utf8'));
  for (const entry of Object.values(manifest)) for (const file of [entry.file, ...(entry.css || [])]) {
    const response = await fetch(`${base}/${file}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), file.endsWith('.js') ? /javascript/ : /text\/css/);
  }
});

test('unlisted files and symlinks are excluded even inside a selected build tree', async t => {
  const directory = `${root}/.validation/static-fixture`;
  await mkdir(`${directory}/.vite`, { recursive: true });
  await mkdir(`${directory}/assets`, { recursive: true });
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(`${directory}/index.html`, '<h1>Operator fixture</h1>');
  await writeFile(`${directory}/assets/unlisted.js`, 'unlisted');
  await symlink(`${root}/package.json`, `${directory}/assets/linked.js`);
  await writeFile(`${directory}/.vite/manifest.json`, JSON.stringify({ index: { file: 'assets/linked.js' } }));
  const base = await serve(t, { buildDir: directory });
  assert.equal((await fetch(base + '/')).status, 200);
  assert.equal((await fetch(base + '/assets/unlisted.js')).status, 404);
  assert.equal((await fetch(base + '/assets/linked.js')).status, 404);
});
