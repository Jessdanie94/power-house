const required = [
  "SHOPIFY_ADMIN_ACCESS_TOKEN",
  "SHOPIFY_STORE_DOMAIN",
  "SHOPIFY_API_VERSION",
];

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}

const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const API_VERSION = process.env.SHOPIFY_API_VERSION;
const BASE_URL = `https://${STORE_DOMAIN}/admin/api/${API_VERSION}`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function jitter(base) {
  // adds 0-20% jitter
  return Math.floor(base + Math.random() * base * 0.2);
}

function getRetryAfterMs(headers) {
  const retryAfter = headers.get("retry-after");
  if (!retryAfter) return null;

  const secs = Number(retryAfter);
  if (!Number.isNaN(secs)) return secs * 1000;

  // fallback for HTTP-date format
  const ts = Date.parse(retryAfter);
  if (!Number.isNaN(ts)) return Math.max(0, ts - Date.now());

  return null;
}

function isRetryableStatus(status) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function fetchWithRetry(url, options = {}, cfg = {}) {
  const {
    maxRetries = 5,
    initialDelayMs = 500,
    maxDelayMs = 8000,
    timeoutMs = 15000,
  } = cfg;

  let attempt = 0;
  let delay = initialDelayMs;
  let lastErr;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);

      if (!isRetryableStatus(res.status)) return res;

      // retryable HTTP status
      const retryAfterMs = getRetryAfterMs(res.headers);
      const waitMs = retryAfterMs ?? jitter(Math.min(delay, maxDelayMs));

      // consume body for better diagnostics if this is final attempt
      if (attempt === maxRetries) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} after ${attempt + 1} attempts: ${text}`);
      }

      await sleep(waitMs);
      delay = Math.min(delay * 2, maxDelayMs);
      attempt++;
      continue;
    } catch (err) {
      clearTimeout(timeout);
      lastErr = err;

      // AbortError / network errors can be transient
      if (attempt === maxRetries) break;

      await sleep(jitter(Math.min(delay, maxDelayMs)));
      delay = Math.min(delay * 2, maxDelayMs);
      attempt++;
    }
  }

  throw new Error(`Request failed after retries: ${lastErr?.message || "unknown error"}`);
}

async function shopifyRest(path, { method = "GET", body } = {}, retryCfg = {}) {
  const res = await fetchWithRetry(
    `${BASE_URL}${path}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ACCESS_TOKEN,
      },
      body: body ? JSON.stringify(body) : undefined,
    },
    retryCfg
  );

  const text = await res.text();
  if (!res.ok) throw new Error(`Shopify REST error ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function shopifyGraphQL(query, variables = {}, retryCfg = {}) {
  const res = await fetchWithRetry(
    `${BASE_URL}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    },
    retryCfg
  );

  const text = await res.text();
  if (!res.ok) throw new Error(`Shopify GraphQL error ${res.status}: ${text}`);

  const json = text ? JSON.parse(text) : {};
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  return json.data;
}

async function listProductsRest(limit = 5) {
  return shopifyRest(`/products.json?limit=${limit}&fields=id,title,handle,status`);
}

async function listProductsGraphQL(first = 5) {
  const query = `
    query ListProducts($first: Int!) {
      products(first: $first) {
        edges {
          node { id title handle status }
        }
      }
    }
  `;
  const data = await shopifyGraphQL(query, { first });
  return data.products.edges.map((e) => e.node);
}

module.exports = {
  shopifyRest,
  shopifyGraphQL,
  listProductsRest,
  listProductsGraphQL,
};
