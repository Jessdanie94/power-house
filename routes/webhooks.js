const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { logToIsolatedVault } = require('../693300f4dac1ac6b9babb468/auditLogger');

/**
 * JDV Sentry: High-Integrity Webhook Verification (SHA256)
 */
function verifyShopifyWebhook(req, secret) {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  if (!hmac) return false;
  
  const body = req.body; // Using express.raw means req.body is already the Buffer
  const digest = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64');
    
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac));
}

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
// Path: /api/webhooks/shopify (As configured in Store Admin)
router.post('/shopify', express.raw({ type: 'application/json' }), (req, res) => {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    
    if (!verifyShopifyWebhook(req, secret)) {
        console.error('[Shopify Webhook] UNAUTHORIZED: TimingSafe Signature mismatch.');
        return res.status(401).send('Unauthorized');
    }

    const topic = req.headers['x-shopify-topic'];
    const shop = req.headers['x-shopify-shop-domain'];

    console.log(`[Shopify Webhook] Signal Validated: ${topic} from ${shop}`);
    logToIsolatedVault('SHOPIFY_WEBHOOK', topic, { shop });

    // Respond immediately to prevent timeout
    res.status(200).json({ received: true });

    // Handle automated logic asynchronously
    if (topic === 'orders/paid' || topic === 'checkouts/create') {
        // Trigger Outbox Worker or Inventory Syncer logic here
    }
});

// 🛡️ SHOPIFY WEBHOOK NODE: Direct Order Create Path
router.post('/orders-create', express.raw({ type: 'application/json' }), (req, res) => {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    
    if (!verifyShopifyWebhook(req, secret)) {
        return res.status(401).send('Unauthorized');
    }

    res.sendStatus(200); // respond immediately as ordered
    
    // Asynchronous logic processing
    console.log('[Webhook Success] Orders-Create signal received and acknowledged.');
});

module.exports = router;
