require("dotenv").config();
const { listProductsRest, listProductsGraphQL } = require("./shopifySafeClient");
const logger = require("./safeLogger");

(async () => {
  try {
    logger.info("Running Shopify safe-client smoke test...");

    const rest = await listProductsRest(5);
    logger.info("REST products:", rest.products ?? rest);

    const gql = await listProductsGraphQL(5);
    logger.info("GraphQL products:", gql);

    logger.info("Smoke test PASSED.");
  } catch (err) {
    logger.error("Smoke test FAILED:", err);
    process.exit(1);
  }
})();
