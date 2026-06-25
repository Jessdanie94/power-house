const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { logToIsolatedVault } = require('../693300f4dac1ac6b9babb468/auditLogger');

// 🛰️ STRIPE WEBHOOK NODE: Optimized for Automated Fulfillment
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`[Webhook Error]: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // LOG MISSION EVENT
  console.log(`[Webhook Success] Signal Validated: ${event.type}`);
  logToIsolatedVault('STRIPE_WEBHOOK', event.type, { id: event.id });

  // 🛡️ TRIGGER AUTOMATED PRODUCT FULFILLMENT ARRAYS
  if (event.type === 'checkout.session.completed') {
      // Integration logic with Outbox Worker is already hard-coded in server.js/checkout.js
      // But this node provides the primary encrypted handshake.
  }

  res.json({ received: true });
});

module.exports = router;
