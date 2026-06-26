require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');
const { logToIsolatedVault } = require('../693300f4dac1ac6b9babb468/auditLogger');

/**
 * JDV Shopify GraphQL Bridge: Fulfillment Mutation Node.
 * Architected for Infrastructure 5.2
 * Maps to: fulfillmentOrderSubmitFulfillmentRequest
 */
const submitFulfillmentRequestNode = async (fulfillmentOrderId, message = "JDV Automated Sellvia Dispatch") => {
    const shop = 'jessesdigitalventures-gmail-com';
    const accessToken = process.env.SHOPIFY_ADMIN_API_TOKEN;

    console.log(`[Fulfillment Node] Initiating GraphQL Fulfillment Request for Order ID: ${fulfillmentOrderId}`);

    if (!accessToken) {
        console.error('[Fulfillment Node] CRITICAL: shpat_ token missing. Cannot execute mutation.');
        return { error: 'Authorization Offline' };
    }

    const query = `
    mutation fulfillmentOrderSubmitFulfillmentRequest($id: ID!, $message: String) {
      fulfillmentOrderSubmitFulfillmentRequest(id: $id, message: $message) {
        originalFulfillmentOrder {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }`;

    const variables = {
        id: `gid://shopify/FulfillmentOrder/${fulfillmentOrderId}`,
        message: message
    };

    try {
        const response = await axios.post(`https://${shop}.myshopify.com/admin/api/2024-04/graphql.json`, 
        { query, variables },
        {
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
            }
        });

        const data = response.data;
        if (data.errors || (data.data && data.data.fulfillmentOrderSubmitFulfillmentRequest.userErrors.length > 0)) {
            const errors = data.errors || data.data.fulfillmentOrderSubmitFulfillmentRequest.userErrors;
            console.error('[GraphQL Mutation Error]', errors);
            logToIsolatedVault('FULFILLMENT_NODE', 'MUTATION_FAILED', { fulfillmentOrderId, errors });
            return { error: 'Mutation Validation Failed', details: errors };
        }

        console.log(`[Fulfillment Success] Fulfillment request submitted via GraphQL.`);
        logToIsolatedVault('FULFILLMENT_NODE', 'MUTATION_SUCCESS', { fulfillmentOrderId });
        
        return data.data.fulfillmentOrderSubmitFulfillmentRequest.originalFulfillmentOrder;
    } catch (e) {
        console.error('[GraphQL Network Error]', e.message);
        return { error: e.message };
    }
};

module.exports = { submitFulfillmentRequestNode };
