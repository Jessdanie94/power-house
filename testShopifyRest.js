/**
 * Shopify REST API Smoke Test (v2 – uses shopifySafeClient.js)
 * Verifies connectivity by listing products via the resilient fetch-with-retry client.
 * Falls back to shop.json if product listing returns empty.
 */

const { listProductsRest, shopifyRest } = require("./shopifySafeClient");

async function main() {
  console.log("Smoke test: listing products via shopifySafeClient (with retry/backoff)...");

  try {
    // Primary check: list up to 3 products
    const productData = await listProductsRest(3);
    const products = productData.products || [];

    if (products.length > 0) {
      console.log(`SUCCESS: Retrieved ${products.length} product(s):`);
      products.forEach((p) => console.log(`  - [${p.id}] ${p.title} (${p.status})`));
    } else {
      // Fallback: verify connectivity via shop info
      console.log("No products found; verifying connectivity via /shop.json...");
      const shopData = await shopifyRest("/shop.json");
      const shop = shopData.shop;
      console.log(`SUCCESS: Connected to shop "${shop.name}" (${shop.myshopify_domain})`);
      console.log("  (No products listed yet – store may be empty.)");
    }

    process.exit(0);
  } catch (err) {
    console.error(`FAILED: ${err.message}`);
    process.exit(1);
  }
}

main();
