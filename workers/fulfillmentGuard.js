const CheckoutSession = require('../models/CheckoutSession');

/**
 * Scans newly paid orders for address anomalies or structural formatting flags
 */
function validateOrderPayload(order) {
  const address = order.shippingAddress || '';
  const email = order.email || '';

  // 1. Structural Check: Look for missing critical parameters
  if (!address.trim() || !email.includes('@')) {
    return { valid: false, reason: 'CRITICAL_DATA_MISSING' };
  }

  // 2. Anomaly Check: Look for common typos or keyboard smashes
  const keyboardSmashRegex = /[bcdfghjklmnpqrstvwxyz]{6,}/i; // 6+ consonants in a row
  if (keyboardSmashRegex.test(order.customerName)) {
    return { valid: false, reason: 'SUSPECTED_BOT_NAME' };
  }

  return { valid: true };
}

/**
 * Sweeps your database for unfulfilled paid orders and verifies safety
 */
async function processFulfillmentQueue() {
  console.log('[Fulfillment Guard] Running data integrity scan on pending shipments...');
  
  try {
    // Fetch orders that are paid but haven't been pushed to the supplier yet
    const pendingOrders = await CheckoutSession.find({ paymentStatus: 'PAID', fulfillmentStatus: 'PENDING' });

    for (const order of pendingOrders) {
      const evaluation = validateOrderPayload(order);

      if (evaluation.valid) {
        console.log(`[Fulfillment Pass] Order ${order._id} verified clear. Releasing payload to Sellvia API...`);
        // The code to trigger the actual wholesale purchase from your supplier goes here:
        // await sellviaAPI.placeOrder(order);
        order.fulfillmentStatus = 'QUEUED_WITH_SUPPLIER';
        await order.save();
      } else {
        console.warn(`[Fulfillment BLOCKED] Order ${order._id} flagged for review. Reason: ${evaluation.reason}`);
        order.fulfillmentStatus = 'HELD_FOR_REVIEW';
        await order.save();
      }
    }
  } catch (error) {
    console.error('[Fulfillment Guard Error] Queue scan interrupted:', error.message);
  }
}

function startFulfillmentGuard(intervalMs = 60000) {
  console.log('[Fulfillment Service] Autonomous Fulfillment Guard active.');
  setInterval(async () => {
    await processFulfillmentQueue();
  }, intervalMs);
}

module.exports = { startFulfillmentGuard };
