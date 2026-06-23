require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Queue = require('bull');
const connectDB = require('../config/db');
const Cart = require('../models/Cart');
const { sendAbandonedCartHook } = require('../services/emailService');

const recoveryQueue = new Queue('abandoned-cart-recovery', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

console.log('[Recovery Service] Cart tracking daemon initialized and active.');

recoveryQueue.process(async (job, done) => {
  const { cartId, email } = job.data;
  
  try {
    await connectDB();
    const cart = await Cart.findById(cartId);
    
    // LOG SIGNAL AS ORDERED
    console.log('[Recovery Worker] Execution sweep running: Checking for checkouts idle > 20 mins.');

    if (cart && cart.status === 'IN_FLIGHT') {
      const windowMs = parseInt(process.env.CART_RECOVERY_WINDOW_MS) || 1200000;
      const now = Date.now();
      const lastUpdated = new Date(cart.lastUpdated).getTime();

      if (now - lastUpdated >= windowMs) {
        console.log(`[Sentry] Cooldown Expired. Marking Cart #${cartId} as ABANDONED.`);
        cart.status = 'ABANDONED';
        await cart.save();
        
        // Fire the Automated Email Hook
        await sendAbandonedCartHook(email);
      }
    }
    
    done();
  } catch (error) {
    console.error('[Recovery Error]:', error.message);
    done(error);
  }
});

module.exports = recoveryQueue;
