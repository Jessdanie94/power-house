const axios = require('axios');

async function listProducts(limit = 50) {
  const { SHOPIFY_ADMIN_ACCESS_TOKEN, SHOPIFY_STORE_DOMAIN, SHOPIFY_API_VERSION } = process.env;

  if (!SHOPIFY_ADMIN_ACCESS_TOKEN || !SHOPIFY_STORE_DOMAIN) {
    throw new Error('Missing required Shopify env vars: SHOPIFY_ADMIN_ACCESS_TOKEN, SHOPIFY_STORE_DOMAIN');
  }

  const version = SHOPIFY_API_VERSION || '2024-01';
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${version}/products.json`;

  const response = await axios.get(url, {
    params: { limit },
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  });

  return response.data.products;
}

module.exports = { listProducts };
