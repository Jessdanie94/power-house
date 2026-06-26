require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

/**
 * JDV Shopify GraphQL Bridge: Refined Product Recon Node.
 * Architected for Infrastructure 5.1.1
 */
const fetchProductsGraphQL = async () => {
    const shop = 'jessesdigitalventures-gmail-com';
    const accessToken = process.env.SHOPIFY_ADMIN_API_TOKEN;

    if (!accessToken) {
        console.error('[GraphQL Bridge] CRITICAL: shpat_ token missing.');
        return { error: 'Authorization Offline' };
    }

    // JDV Tactical Query: Fetching ID, Handle, and Pagination Info
    const query = `
    {
      products(first: 5) {
        edges {
          node {
            id
            handle
          }
        }
        pageInfo {
          hasNextPage
        }
      }
    }`;

    try {
        const response = await axios.post(`https://${shop}.myshopify.com/admin/api/2024-04/graphql.json`, 
        { query },
        {
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
            }
        });

        if (response.data.errors) {
            console.error('[GraphQL Logic Error]', response.data.errors);
            return { error: 'Query Validation Failed' };
        }

        console.log('[GraphQL Success] Product handles and IDs retrieved.');
        return response.data.data.products.edges;
    } catch (e) {
        console.error('[GraphQL Network Error]', e.message);
        return { error: e.message };
    }
};

module.exports = { fetchProductsGraphQL };
