require("dotenv").config();
const { validateEnv } = require("./validateEnv");
const { listProductsRest, listProductsGraphQL } = require("./shopifySafeClient");
const log = require("./secureLogger");

(async () => {
  try {
    validateEnv();

    const rest = await listProductsRest(5);
    log.info("REST products fetched", { count: rest.products?.length ?? 0 });

    const gql = await listProductsGraphQL(5);
    log.info("GraphQL products fetched", { count: gql.length });
  } catch (err) {
    log.error("Shopify smoke test failed", err);
    process.exit(1);
  }
})();
