/**
 * secureLogger.js – Jesse's standard safe logger
 * Masks sensitive env vars, provides structured info/warn/error logging.
 */

function mask(value) {
  if (!value) return "(not set)";
  if (value.length <= 8) return "****";
  return value.slice(0, 4) + "****" + value.slice(-4);
}

function printSafeConfig(keys) {
  console.log("\n── Shopify Config ──");
  keys.forEach((key) => {
    console.log(`  ${key}: ${mask(process.env[key])}`);
  });
  console.log("");
}

function info(message, meta = {}) {
  console.log(
    JSON.stringify({ level: "info", ts: new Date().toISOString(), message, ...meta })
  );
}

function warn(message, meta = {}) {
  console.warn(
    JSON.stringify({ level: "warn", ts: new Date().toISOString(), message, ...meta })
  );
}

function error(message, err) {
  console.error(
    JSON.stringify({
      level: "error",
      ts: new Date().toISOString(),
      message,
      error: err?.message || String(err),
      stack: err?.stack || null,
    })
  );
}

module.exports = { printSafeConfig, info, warn, error };
