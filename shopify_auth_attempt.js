// LEGACY: Not imported by the operator runtime; no automatic execution.
import axios from 'axios';

async function attemptAuth(shop, clientId, clientSecret) {
    console.log(`[Auth Attempt] Target: ${shop}, ID: ${clientId}`);
    try {
        const response = await axios.post(`https://${shop}.myshopify.com/admin/oauth/access_token`, {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials'
        });
        console.log('[SUCCESS] Credentials received; token omitted.');
        return response.data.access_token;
    } catch (error) {
        console.error('[FAILED] Authentication request rejected; details omitted.');
        return null;
    }
}

async function run() {
    const shop = process.env.SHOPIFY_SHOP_NAME;
    const secret = process.env.SHOPIFY_CLIENT_SECRET;
    
    // Attempt with the two client IDs provided
    await attemptAuth(shop, process.env.SHOPIFY_CLIENT_ID, secret);
    await attemptAuth(shop, process.env.SHOPIFY_CLIENT_ID, secret);
}

// Legacy reconnaissance is intentionally not auto-run.
