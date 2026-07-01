const SENSITIVE_ENV_KEYS = [
  "SHOPIFY_ADMIN_ACCESS_TOKEN",
  "SHOPIFY_API_KEY",
  "SHOPIFY_API_SECRET",
  "ACCESS_TOKEN",
  "API_TOKEN",
  "SECRET",
  "PASSWORD",
];

function maskValue(value) {
  if (typeof value !== "string" || value.length === 0) return "[REDACTED]";
  if (value.length <= 8) return "[REDACTED]";
  return `${value.slice(0, 4)}...${value.slice(-2)}`;
}

function redactString(input) {
  let out = String(input ?? "");
  for (const key of SENSITIVE_ENV_KEYS) {
    const val = process.env[key];
    if (val && typeof val === "string") {
      out = out.split(val).join("[REDACTED]");
    }
  }
  out = out.replace(/shpat_[a-zA-Z0-9_-]+/g, "[REDACTED_SHOPIFY_TOKEN]");
  out = out.replace(/(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, "[REDACTED]");
  out = out.replace(/(\"X-Shopify-Access-Token\"\s*:\s*\")[^\"]+(\")/gi, '[REDACTED]');
  return out;
}

function safeSerialize(obj) {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return "[Circular]";
        seen.add(value);
      }
      const lowerKey = String(key || "").toLowerCase();
      if (
        lowerKey.includes("token") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("password") ||
        lowerKey.includes("authorization")
      ) {
        return "[REDACTED]";
      }
      if (typeof value === "string") return redactString(value);
      return value;
    },
    2
  );
}

export function info(message, meta) {
  if (meta === undefined) console.log(redactString(message));
  else console.log(redactString(message), safeSerialize(meta));
}

export function warn(message, meta) {
  if (meta === undefined) console.warn(redactString(message));
  else console.warn(redactString(message), safeSerialize(meta));
}

export function error(message, errOrMeta) {
  if (errOrMeta instanceof Error) {
    console.error(redactString(message), redactString(errOrMeta.message));
    if (errOrMeta.stack) console.error(redactString(errOrMeta.stack));
    return;
  }
  if (errOrMeta === undefined) console.error(redactString(message));
  else console.error(redactString(message), safeSerialize(errOrMeta));
}

export function printSafeConfig(keys = []) {
  const output = {};
  for (const k of keys) {
    output[k] = process.env[k] ? maskValue(process.env[k]) : "[NOT_SET]";
  }
  info("Runtime config:", output);
}

export default { info, warn, error, redactString, safeSerialize, printSafeConfig };
