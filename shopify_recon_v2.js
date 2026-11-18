// LEGACY: Not imported by the operator runtime; no automatic execution.
import axios from 'axios';

async function attempt(clientId) {
    const shop = process.env.SHOPIFY_SHOP_NAME;
    const secret = process.env.SHOPIFY_CLIENT_SECRET;
    console.log(`--- Attempting with ID: ${clientId} ---`);
    try {
        const response = await axios.post(`https://${shop}.myshopify.com/admin/oauth/access_token`, {
            client_id: clientId,
            client_secret: secret,
            grant_type: 'client_credentials'
        });
        console.log('SUCCESS: Credentials received; token omitted.');
    } catch (e) {
        console.log('FAILED: Authentication request rejected; details omitted.');
    }
}

// Legacy reconnaissance is intentionally not auto-run.
