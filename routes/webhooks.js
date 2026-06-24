const express = require('express');
const router = express.Router();
const stripeLive = require('stripe')(process.env.STRIPE_SECRET_KEY);
const stripeTest = require('stripe')(process.env.STRIPE_TEST_SECRET_KEY || 'sk_test_placeholder');
const { logToIsolatedVault } = require('../693300f4dac1ac6b9babb468/auditLogger');

// 🛰️ UNIFIED WEBHOOK NODE: Handles both Live and Test signals
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Dual-Validation logic: Try Live first, fallback to Test
        try {
            event = stripeLive.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            console.log('[Webhook] Live verification failed, attempting test signal...');
            // Fallback for sk_test_ signals
            event = stripeTest.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        }

        console.log(`[Webhook] Validated event: ${event.type}`);
        
        // Log sensitive financial events to the vault
        logToIsolatedVault('STRIPE_WEBHOOK', event.type, { id: event.id });

        res.json({ received: true });
    } catch (e) {
        console.error(`[Webhook Error] Auth failed: ${e.message}`);
        res.status(400).send(`Webhook Error: ${e.message}`);
    }
});

module.exports = router;
