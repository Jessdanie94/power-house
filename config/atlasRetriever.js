const crypto = require('crypto');

const BASE = process.env.ATLAS_API_BASE || 'https://cloud.mongodb.com';
const ACCEPT = 'application/vnd.atlas.2023-02-01+json';
const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');

// Atlas Admin API uses HTTP Digest auth (public key = username, private key = password).
function digestHeader(challenge, method, uri, user, pass) {
  const p = {};
  for (const m of challenge.matchAll(/(\w+)="?([^",]+)"?/g)) p[m[1]] = m[2];
  const cnonce = crypto.randomBytes(8).toString('hex');
  const nc = '00000001';
  const ha1 = md5(`${user}:${p.realm}:${pass}`);
  const ha2 = md5(`${method}:${uri}`);
  const response = p.qop
    ? md5(`${ha1}:${p.nonce}:${nc}:${cnonce}:auth:${ha2}`)
    : md5(`${ha1}:${p.nonce}:${ha2}`);
  let h = `Digest username="${user}", realm="${p.realm}", nonce="${p.nonce}", uri="${uri}", response="${response}"`;
  if (p.qop) h += `, qop=auth, nc=${nc}, cnonce="${cnonce}"`;
  if (p.opaque) h += `, opaque="${p.opaque}"`;
  return h;
}

function credentials() {
  const publicKey = process.env.ATLAS_PUBLIC_KEY;
  const privateKey = process.env.ATLAS_PRIVATE_KEY;
  const projectId = process.env.ATLAS_PROJECT_ID;
  const missing = [['ATLAS_PUBLIC_KEY', publicKey], ['ATLAS_PRIVATE_KEY', privateKey], ['ATLAS_PROJECT_ID', projectId]]
    .filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(', ')}`);
  return { publicKey, privateKey, projectId };
}

async function atlasGet(pathname) {
  const { publicKey, privateKey } = credentials();
  const headers = { Accept: ACCEPT };
  let res = await fetch(BASE + pathname, { headers });
  if (res.status === 401 && res.headers.get('www-authenticate')) {
    headers.Authorization = digestHeader(res.headers.get('www-authenticate'), 'GET', pathname, publicKey, privateKey);
    res = await fetch(BASE + pathname, { headers });
  }
  if (!res.ok) {
    // Atlas error bodies carry no secrets; the keys are never echoed.
    const body = await res.text().catch(() => '');
    throw new Error(`Atlas API ${res.status} on ${pathname}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

const group = () => `/api/atlas/v2/groups/${credentials().projectId}`;

async function getClusters() {
  const { results = [] } = await atlasGet(`${group()}/clusters`);
  return results.map((c) => ({
    name: c.name,
    state: c.stateName,
    paused: !!c.paused,
    srv: c.connectionStrings && c.connectionStrings.standardSrv,
  }));
}

async function getDatabaseUsers() {
  const { results = [] } = await atlasGet(`${group()}/databaseUsers`);
  return results.map((u) => ({ username: u.username, authDb: u.databaseName, expires: u.deleteAfterDate || null }));
}

async function getAccessList() {
  const { results = [] } = await atlasGet(`${group()}/accessList`);
  return results.map((e) => ({ entry: e.ipAddress || e.cidrBlock || e.awsSecurityGroup, expires: e.deleteAfterDate || null }));
}

// The Atlas API never returns passwords, so the password comes from a secret and is encoded here.
function buildUri({ srv, username, password, database, options = 'retryWrites=true&w=majority' }) {
  const host = String(srv).replace(/^mongodb\+srv:\/\//, '');
  return `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}/${database || ''}?${options}`;
}

// Flags the failure causes behind expired credentials / dropped connections.
async function diagnose() {
  const [clusters, users, access] = await Promise.all([getClusters(), getDatabaseUsers(), getAccessList()]);
  const now = Date.now();
  const issues = [];
  for (const c of clusters) {
    if (c.paused) issues.push(`Cluster ${c.name} is PAUSED (resume it in Atlas).`);
    else if (c.state && c.state !== 'IDLE') issues.push(`Cluster ${c.name} state is ${c.state}.`);
  }
  if (!users.length) issues.push('No database users exist; create one.');
  for (const u of users) {
    if (u.expires && new Date(u.expires).getTime() < now) issues.push(`Database user "${u.username}" EXPIRED ${u.expires}.`);
    else if (u.expires) issues.push(`Database user "${u.username}" expires ${u.expires}.`);
  }
  const live = access.filter((e) => !e.expires || new Date(e.expires).getTime() >= now);
  if (!live.length) issues.push('IP access list has no active entries; connections will time out.');
  return { clusters, users, access, issues };
}

module.exports = { getClusters, getDatabaseUsers, getAccessList, buildUri, diagnose, digestHeader };

if (require.main === module) {
  diagnose()
    .then((r) => {
      console.log(JSON.stringify({ clusters: r.clusters, users: r.users, accessList: r.access }, null, 2));
      console.log(r.issues.length ? `\nIssues:\n- ${r.issues.join('\n- ')}` : '\nNo issues found.');
    })
    .catch((e) => { console.error(e.message); process.exit(1); });
}
