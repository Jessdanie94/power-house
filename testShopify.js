require("dotenv").config();
const { listProducts } = require("./shopifyRest");
(async () => {
  try {
    const data = await listProducts(5);
    console.log("Products:", data.products ?? data);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();