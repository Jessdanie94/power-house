const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Queue = require('bull');
const Order = require('../models/Order');
const { calculateRegionalTaxNode } = require('../nodes/regionalTaxManager');
const { sanitizeFulfillmentPayload } = require('../middlewares/payloadSanitizer');

const outboxQueue = new Queue('mission-outbox', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

router.post('/buy-now', sanitizeFulfillmentPayload, async (req, res) => {
    const { paymentMethodId, email, name, items, province } = req.body;

    try {
        // 1. Calculate Regional Tax
        const baseAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const taxAudit = calculateRegionalTaxNode(province || 'SK', baseAmount);

        // 2. Direct Stripe API Charge (Triggered post-Biometric Auth on Frontend)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(taxAudit.finalGrossTotal * 100),
            currency: 'cad',
            payment_method: paymentMethodId,
            confirm: true,
            receipt_email: email,
            automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
            metadata: { source: 'Biometric_Direct_Checkout' }
        });

        if (paymentIntent.status === 'succeeded') {
            // 3. PERSIST ORDER
            const order = await Order.create({
                orderId: paymentIntent.id,
                customer: { name, email },
                items: items,
                totalAmount: taxAudit.finalGrossTotal,
                financialStatus: 'paid'
            });

            // 4. IGNITE OUTBOX WORKER
            await outboxQueue.add({
                orderId: order.orderId,
                payoutStatus: 'posted' // Direct charge ignores the test 'clearing' delay
            });

            return res.json({ success: true, orderId: order.orderId });
        }

        res.status(400).json({ error: 'Payment status: ' + paymentIntent.status });

    } catch (e) {
        console.error('[Checkout Error]', e.message);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
