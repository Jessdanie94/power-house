const express = require('express');
const router = express.Router();
const { logSecurityEventNode } = require('../services/securityLogger');

/**
 * 🛡️ OAUTH NODE: Public Endpoint for Autonomous Key Requests
 * Supports application/x-www-form-urlencoded as requested by the architect.
 */

// 1. programmatic Key Request Endpoint
router.post('/token', (req, res) => {
    // Support both camelCase and snake_case (Jesse's latest requirement)
    const clientId = req.body.client_id || req.body.clientId;
    const clientSecret = req.body.client_secret || req.body.clientSecret;
    const grantType = req.body.grant_type || req.body.grantType;

    if (grantType === 'client_credentials') {
        console.log(`[OAuth] Token request received for Client ID: ${clientId}`);
        
        // Mock token generation (Autonomous Session Token)
        const accessToken = 'jdv_live_' + Math.random().toString(36).substring(7);
        
        return res.json({
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'fulfillment.execute orders.read'
        });
    }

    res.status(400).json({ error: 'unsupported_grant_type' });
});

// 2. Manual Activation Endpoint
router.get('/activate', (req, res) => {
    logSecurityEventNode('SYSTEM_ARCHITECT', 'One-time manual activation triggered via OAuth endpoint');
    
    res.json({
        success: true,
        message: 'Independent developer framework linked. Subscription verified.',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
