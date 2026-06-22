const axios = require('axios');

async function attemptAuth(shop, clientId, clientSecret) {
    console.log(`[Auth Attempt] Target: ${shop}, ID: ${clientId}`);
    try {
        const response = await axios.post(`https://${shop}.myshopify.com/admin/oauth/access_token`, {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials'
        });
        console.log(`[SUCCESS] Token secured: `, response.data.access_token);
        return response.data.access_token;
    } catch (error) {
        console.error(`[FAILED] Status: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
        return null;
    }
}

async function run() {
    const shop = 'jessesdigitalventures';
    const secret = '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';
    
    // Attempt with the two client IDs provided
    await attemptAuth(shop, '110f35c49b71c14c08ba82aa1cd6cd38', secret);
    await attemptAuth(shop, 'db1a5c93312c20c3a69976a0c7a062db', secret);
}

run();
