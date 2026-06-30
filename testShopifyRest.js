require('dotenv').config();
const axios = require('axios');

async function smokeTest() {
  const { SHOPIFY_ADMIN_ACCESS_TOKEN, SHOPIFY_STORE_DOMAIN, SHOPIFY_API_VERSION } = process.env;

  if (!SHOPIFY_ADMIN_ACCESS_TOKEN || !SHOPIFY_STORE_DOMAIN || !SHOPIFY_API_VERSION) {
    console.error('‚ö4 Missing Shopify environment variables.');
    process.exit(1);
  }

  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=1`;

  try {
    console.log(`üîê Pinging Shopify: ${SHOPIFY_STORE_DOMAIN}...`);
    const res = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 200) {
      console.log('‚ú® Shopify REST API connection successful!');
      console.log(`üì¶ Found ${res.data.products.length} product(s) in smoke test.`);
      process.exit(0);
    }
  } catch (err) {
    console.error('‚ö4 Shopify API Smoke Test Failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

smokeTest();