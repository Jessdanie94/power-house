const crypto = require('crypto');

const verifyShopifyHmac = (query) => {
  const { hmac, ...params } = query;
  if (!hmac) return false;

  // 1. Sort and concatenate parameters
  const message = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('');

  // 2. Hash with Client Secret (shpss_...)
  const generatedHmac = crypto
    .createHmac('sha256', process.env.SHOPIFY_CLIENT_SECRET)
    .update(message)
    .digest('hex');

  return generatedHmac === hmac;
};

module.exports = { verifyShopifyHmac };
