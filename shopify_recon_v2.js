const axios = require('axios');

async function attempt(clientId) {
    const shop = 'jessesdigitalventures-gmail-com';
    const secret = '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';
    console.log(`--- Attempting with ID: ${clientId} ---`);
    try {
        const response = await axios.post(`https://${shop}.myshopify.com/admin/oauth/access_token`, {
            client_id: clientId,
            client_secret: secret,
            grant_type: 'client_credentials'
        });
        console.log('SUCCESS:', response.data.access_token);
    } catch (e) {
        console.log('FAILED:', e.response?.status, e.response?.data?.error || e.message);
    }
}

attempt('9b5fcda32c68c5e2c63eb631711ca7ec');
