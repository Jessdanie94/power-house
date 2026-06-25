const express = require('express');
const router = express.Router();

/**
 * JDV Payment Router: Dynamic gateway selection based on ticket size and liquidity status.
 */
router.post('/initialize-checkout', async (req, res) => {
  const { orderId, amount, currency, items, billingAddress } = req.body;

  try {
    // 1. Logic Check: If high-ticket generator or specific high-intent item
    const isHighTicketPowerEquipment = items.some(item => 
      item.price >= 1500 || item.category?.toLowerCase().includes('generator')
    );

    // 2. Routing Decision Tree
    if (isHighTicketPowerEquipment) {
      console.log(`[Routing Log] High-ticket order ${orderId} detected. Routing to Authorize.Net for underwriting safety.`);
      return res.status(200).json({ 
        gateway: 'authorizenet', 
        endpoint: '/api/payments/authorizenet/charge' 
      });
    }

    // 3. Standard Routing with active payout verification check
    if (process.env.STRIPE_PAYOUTS_PAUSED === 'true') {
      console.warn(`[Routing Warning] Stripe payouts currently flagged as paused. Routing order ${orderId} to PayPal.`);
      return res.status(200).json({ 
        gateway: 'paypal', 
        endpoint: '/api/payments/paypal/create-order' 
      });
    }

    // Default processing pipeline
    return res.status(200).json({ 
      gateway: 'stripe', 
      endpoint: '/api/payments/stripe/create-intent' 
    });

  } catch (error) {
    console.error(`[Routing Error] Checkout breakdown on order ${orderId}:`, error);
    res.status(500).json({ success: false, message: "Internal payment routing failure" });
  }
});

module.exports = router;
