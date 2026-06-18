const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { logSecurityEventNode } = require('../services/securityLogger');
router.post('/stripe-receiver', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    if (event.type === 'charge.succeeded') {
      logSecurityEventNode('Stripe_Receiver', 'SECURE_PAYMENT_VERIFIED', { id: event.data.object.id });
    }
    res.json({ received: true });
  } catch (e) { res.status(400).send(`Error: ${e.message}`); }
});
module.exports = router;
