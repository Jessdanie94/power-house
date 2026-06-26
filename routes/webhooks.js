const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { logToIsolatedVault } = require('../693300f4dac1ac6b9babb468/auditLogger');

// 🛰️ STRIPE WEBHOOK NODE
router.post('/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  logToIsolatedVault('STRIPE_WEBHOOK', event.type, { id: event.id });
  res.json({ received: true });
});

// 🛡️ SHOPIFY WEBHOOK NODE: Optimized for Fulfillment Sync
router.post('/shopify', express.raw({ type: 'application/json' }), (req, res) => {
    const hmac = req.headers['x-shopify-hmac-sha256'];
    const topic = req.headers['x-shopify-topic'];
    const shop = req.headers['x-shopify-shop-domain'];

    // Verify Shopify Signature
    const generatedHash = crypto
        .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
        .update(req.body)
        .digest('base64');

    if (generatedHash !== hmac) {
        console.error('[Shopify Webhook] UNAUTHORIZED: Invalid signature detected.');
        return res.status(401).send('Unauthorized');
    }

    console.log(`[Shopify Webhook] Signal Validated: ${topic} from ${shop}`);
    logToIsolatedVault('SHOPIFY_WEBHOOK', topic, { shop });

    // Handle automated logic for specific topics
    if (topic === 'orders/paid') {
        // Trigger Outbox Worker or Inventory Syncer
    }

    res.status(200).json({ received: true });
});

module.exports = router;
