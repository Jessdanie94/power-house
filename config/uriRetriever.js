const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const LOCAL_URI = 'mongodb://localhost:27017/jesses_digital_ventures';
const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;
const MIN_INTERVAL_MS = 10 * 1000;

function readFileSource() {
  const file = process.env.MONGODB_URI_FILE; // e.g. a Render secret file: /etc/secrets/mongodb_uri
  if (!file) return '';
  try {
    return fs.readFileSync(file, 'utf8').trim();
  } catch (err) {
    console.warn(`[URI] Cannot read MONGODB_URI_FILE (${err.code})`);
    return '';
  }
}

// Re-parsed on every call so rotated values in .env are picked up without a restart.
function readDotenvSource() {
  try {
    const parsed = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
    return (parsed.MONGODB_URI || parsed.MONGO_URL || '').trim();
  } catch {
    return '';
  }
}

function readEnvSource() {
  return (process.env.MONGODB_URI || process.env.MONGO_URL || '').trim();
}

// Priority: secret file > .env > process env. Env vars set on a host are fixed for the
// process lifetime, so file sources are the ones that can actually rotate at runtime.
function resolveUri() {
  const uri = readFileSource() || readDotenvSource() || readEnvSource();
  if (uri) return uri;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('No MongoDB URI found (MONGODB_URI_FILE, .env, MONGODB_URI, MONGO_URL); refusing localhost in production');
  }
  return LOCAL_URI;
}

/**
 * Polls the URI sources and calls onChange(newUri, oldUri) when the value changes.
 * Returns a stop() function. The timer is unref'd so it never keeps the process alive.
 */
function startUriRetriever({ onChange, intervalMs, initialUri } = {}) {
  const requested = Number(intervalMs || process.env.MONGODB_URI_REFRESH_MS || DEFAULT_INTERVAL_MS);
  const every = Math.max(MIN_INTERVAL_MS, Number.isFinite(requested) ? requested : DEFAULT_INTERVAL_MS);
  let current = initialUri;

  const tick = async () => {
    let next;
    try {
      next = resolveUri();
    } catch (err) {
      console.warn(`[URI] ${err.message}`);
      return;
    }
    if (next === current) return;
    const previous = current;
    current = next;
    console.log('[URI] Connection string change detected');
    try {
      await onChange(next, previous);
    } catch (err) {
      console.error(`[URI] onChange failed: ${err.message}`);
      current = previous; // retry on the next poll
    }
  };

  const timer = setInterval(tick, every);
  timer.unref();
  console.log(`[URI] Retriever started (every ${Math.round(every / 1000)}s)`);
  return () => clearInterval(timer);
}

module.exports = { resolveUri, startUriRetriever };
