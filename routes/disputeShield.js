const express = require('express');
const router = express.Router();
const { logSecurityEventNode } = require('../services/securityLogger');

// 🛡️ DISPUTE SHIELD: Intercepts chargeback and dispute signals
router.post('/intercept', async (req, res) => {
    const event = req.body;
    
    if (event.type === 'charge.dispute.created' || event.type === 'chargeback.created') {
        console.error(`[ALARM] Chargeback detected for Order: ${event.data.object.payment_intent}`);
        
        // Log to the high-integrity audit vault
        logSecurityEventNode('DISPUTE_SHIELD', 'CHARGEBACK_SIGNAL_INTERCEPTED', {
            id: event.data.object.id,
            amount: event.data.object.amount,
            reason: event.data.object.reason
        });

        // TACTICAL: In a real scenario, this would trigger an automatic evidence submission 
        // or a blacklisting of the customer identity in the JDV vault.
    }
    
    res.json({ shielded: true });
});

module.exports = router;
