require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');

/**
 * JDV Shopify GraphQL Bridge: Elite-tier data retrieval.
 * Architected for Infrastructure 5.1
 */
const getShopifyGraphQLClient = () => {
    const shop = 'jessesdigitalventures-gmail-com';
    const accessToken = process.env.SHOPIFY_ADMIN_API_TOKEN;

    if (!accessToken) {
        console.error('[GraphQL Bridge] CRITICAL: shpat_ token missing. Engines Cold.');
        return null;
    }

    return shopifyApi({
        apiKey: process.env.SHOPIFY_API_KEY,
        apiSecretKey: process.env.SHOPIFY_CLIENT_SECRET,
        scopes: ['read_products', 'write_fulfillments'],
        hostName: `${shop}.myshopify.com`,
        apiVersion: LATEST_API_VERSION,
        isEmbeddedApp: false,
    });
};

const fetchProductsGraphQL = async () => {
    const client = getShopifyGraphQLClient();
    if (!client) return { error: 'Authorization Offline' };

    // Implementation of the user's requested query
    const query = `#graphql
    query getProducts {
      products (first: 3) {
        edges {
          node {
            id
            title
          }
        }
      }
    }`;

    try {
        const session = {
            shop: 'jessesdigitalventures-gmail-com.myshopify.com',
            accessToken: process.env.SHOPIFY_ADMIN_API_TOKEN,
        };
        // Simplified raw request for direct shpat_ use in Standalone mode
        const response = await fetch(`https://${session.shop}/admin/api/2024-04/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': session.accessToken,
            },
            body: JSON.stringify({ query }),
        });

        const json = await response.json();
        console.log('[GraphQL Success] Multi-signal product data retrieved.');
        return json.data?.products?.edges;
    } catch (e) {
        console.error('[GraphQL Error]', e.message);
        return { error: e.message };
    }
};

module.exports = { fetchProductsGraphQL };
