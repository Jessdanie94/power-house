const mongoose = require('mongoose');

const { resolveUri, startUriRetriever } = require('./uriRetriever');
const MAX_BACKOFF_MS = 30000;

// Masks credentials so URIs and driver messages are safe to log.
function redact(text) {
  return String(text).replace(/(mongodb(?:\+srv)?:\/\/)([^/\s]*)@/gi, '$1***:***@');
}

function describeUri(uri) {
  const m = uri.match(/^(mongodb(?:\+srv)?):\/\/(?:([^/]*)@)?([^/?]+)(?:\/([^?]*))?/i);
  if (!m) return 'unparseable URI';
  const [, scheme, auth, hosts, db] = m;
  return `${scheme}://${auth ? '***@' : ''}${hosts}/${db || ''}`;
}

// Raw "@", ":" or "/" in the password breaks parsing or auth; they must be %40, %3A, %2F.
function checkEncoding(uri) {
  const m = uri.match(/^mongodb(?:\+srv)?:\/\/(.*)$/is);
  if (!m) return;
  const rest = m[1];
  const hostStart = rest.lastIndexOf('@');
  if (hostStart === -1) return;
  const creds = rest.slice(0, hostStart);
  const parts = creds.split(':');
  const password = parts.slice(1).join(':');
  if (parts.length > 2 || /[@/?#\[\]]/.test(password)) {
    console.warn('[DB] Password appears to contain unencoded special characters. ' +
      'URL-encode them (@ -> %40, : -> %3A, / -> %2F, # -> %23, ? -> %3F, % -> %25). ' +
      'Tip: encodeURIComponent(password).');
  }
}

function logError(context, err) {
  const name = err && err.name;
  const code = err && (err.code !== undefined ? err.code : err.codeName);
  let hint = '';
  if (code === 18 || /auth/i.test(err.codeName || '') || /Authentication failed|bad auth/i.test(err.message)) {
    hint = ' | Hint: credentials rejected (expired/rotated password, wrong user, or wrong authSource).';
  } else if (/NetworkError|ServerSelectionError|NetworkTimeoutError/.test(name)) {
    hint = ' | Hint: network/DNS/IP allowlist problem (check Atlas Network Access).';
  } else if (/Unable to parse|MongoParseError|must be escaped/.test(`${name} ${err.message}`)) {
    hint = ' | Hint: malformed URI; check password URL-encoding.';
  }
  console.error(`[DB] ${context}: name=${name} code=${code} message=${redact(err.message)}${hint}`);
}

function isAuthError(err) {
  return err && (err.code === 18 || err.code === 13 || /AuthenticationFailed/i.test(err.codeName || '') ||
    /Authentication failed|bad auth/i.test(err.message || ''));
}

let listenersAttached = false;
function attachListeners() {
  if (listenersAttached) return;
  listenersAttached = true;
  const c = mongoose.connection;
  c.on('connected', () => console.log('[DB] connected'));
  c.on('reconnected', () => console.log('[DB] reconnected'));
  c.on('disconnected', () => console.warn('[DB] disconnected; driver will attempt to reconnect'));
  c.on('error', (err) => logError('connection error', err));
}

// Poll slowly while credentials are bad: hammering a rejected login can lock the Atlas user.
async function waitForNewUri(badUri) {
  const every = Math.max(10000, Number(process.env.MONGODB_URI_REFRESH_MS) || 300000);
  for (;;) {
    await new Promise((r) => setTimeout(r, every));
    let next;
    try { next = resolveUri(); } catch { continue; }
    if (next !== badUri) {
      console.log('[DB] New connection string found; retrying');
      checkEncoding(next);
      return next;
    }
  }
}

let connecting = null;
let stopRetriever = null;
let activeUri = null;

const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  maxPoolSize: 10,
  retryWrites: true,
};

// Proves a rotated URI works on a throwaway connection before touching the live one.
async function swapUri(newUri) {
  checkEncoding(newUri);
  console.log(`[DB] Validating new URI ${describeUri(newUri)}`);
  const probe = mongoose.createConnection();
  try {
    await probe.openUri(newUri, { ...CONNECT_OPTIONS, serverSelectionTimeoutMS: 8000 });
  } catch (err) {
    logError('new URI rejected; keeping current connection', err);
    throw err;
  } finally {
    await probe.close().catch(() => {});
  }
  await mongoose.disconnect();
  await mongoose.connect(newUri, CONNECT_OPTIONS);
  activeUri = newUri;
  console.log('[DB] Switched to rotated connection string');
}

function startRetriever() {
  if (stopRetriever || process.env.MONGODB_URI_REFRESH === 'off') return;
  stopRetriever = startUriRetriever({ initialUri: activeUri, onChange: swapUri });
}

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (connecting) return connecting;

  let uri;
  try {
    uri = resolveUri();
  } catch (err) {
    console.error(`[DB] ${err.message}`);
    process.exit(1);
  }
  checkEncoding(uri);
  attachListeners();
  console.log(`[DB] Connecting to ${describeUri(uri)}`);

  connecting = (async () => {
    let attempt = 0;
    for (;;) {
      attempt += 1;
      try {
        await mongoose.connect(uri, CONNECT_OPTIONS);
        activeUri = uri;
        startRetriever();
        console.log('[Sentry] Database Vault Connected');
        return;
      } catch (err) {
        logError(`connect attempt ${attempt} failed`, err);
        // Retrying bad credentials or a malformed URI never helps and can lock the account.
        if (isAuthError(err) || /Unable to parse|MongoParseError|must be escaped/.test(`${err.name} ${err.message}`)) {
          console.error('[DB] Non-retryable error; waiting for a new connection string (polling sources).');
          uri = await waitForNewUri(uri);
          attempt = 0;
          continue;
        }
        const delay = Math.min(1000 * 2 ** Math.min(attempt, 5), MAX_BACKOFF_MS);
        console.warn(`[DB] Retrying in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  })().finally(() => { connecting = null; });

  return connecting;
};

module.exports = connectDB;
module.exports.redact = redact;
