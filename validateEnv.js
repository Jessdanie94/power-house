import log from "./secureLogger.js";

const REQUIRED_VARS = [
  "SHOPIFY_ADMIN_ACCESS_TOKEN",
  "SHOPIFY_STORE_DOMAIN",
  "SHOPIFY_API_VERSION",
];

function isValidStoreDomain(v) {
  return typeof v === "string" && /^[a-zA-Z0-9-]+\.myshopify\.com$/.test(v);
}

function isValidApiVersion(v) {
  return typeof v === "string" && /^\d{4}-\d{2}$/.test(v);
}

export function validateEnv() {
  const missing = REQUIRED_VARS.filter((k) => !process.env[k] || !process.env[k].trim());

  if (missing.length) {
    log.error("Missing required environment variables", { missing });
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const version = process.env.SHOPIFY_API_VERSION;

  if (!token.startsWith("shpat_")) {
    log.warn("SHOPIFY_ADMIN_ACCESS_TOKEN format looks unusual (expected shpat_ prefix)");
  }

  if (!isValidStoreDomain(domain)) {
    throw new Error("SHOPIFY_STORE_DOMAIN must look like 'your-store.myshopify.com'");
  }

  if (!isValidApiVersion(version)) {
    throw new Error("SHOPIFY_API_VERSION must look like 'YYYY-MM' (example: 2024-04)");
  }

  log.info("Environment validation passed");
  return true;
}

export default { validateEnv };
