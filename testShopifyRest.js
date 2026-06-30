/**
 * Shopify REST API Smoke Test
 * Verifies connectivity to the Shopify Admin REST API by fetching shop info.
 */

const https = require("https");

const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const domain = process.env.SHOPIFY_STORE_DOMAIN;
const apiVersion = process.env.SHOPIFY_API_VERSION || "2024-01";

if (!token || !domain) {
  console.error("ERROR: Missing required env vars SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_STORE_DOMAIN");
  process.exit(1);
}

const path = `/admin/api/${apiVersion}/shop.json`;

const options = {
  hostname: domain,
  port: 443,
  path: path,
  method: "GET",
  headers: {
    "X-Shopify-Access-Token": token,
    "Content-Type": "application/json",
  },
};

console.log(`Smoke test: GET https://${domain}${path}`);

const req = https.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const shop = JSON.parse(data).shop;
      console.log(`SUCCESS: Connected to shop "${shop.name}" (${shop.myshopify_domain})`);
      process.exit(0);
    } else {
      console.error(`FAILED: HTTP ${res.statusCode}`);
      console.error(data);
      process.exit(1);
    }
  });
});

req.on("error", (err) => {
  console.error(`FAILED: ${err.message}`);
  process.exit(1);
});

req.end();
