require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Queue = require('bull');
const connectDB = require('../config/db');
const Cart = require('../models/Cart');
const { sendAbandonedCartHook } = require('../services/emailService');

const recoveryQueue = new Queue('abandoned-cart-recovery', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

console.log('[Cron Worker] Abandoned Cart Sentry Online. Cooldown: 45-Min.');

recoveryQueue.process(async (job, done) => {
  const { cartId, email } = job.data;
  
  try {
    await connectDB();
    const cart = await Cart.findById(cartId);
    
    if (cart && cart.status === 'IN_FLIGHT') {
      console.log(`[Sentry] 45-Min Cooldown Expired. Marking Cart #${cartId} as ABANDONED.`);
      cart.status = 'ABANDONED';
      await cart.save();
      
      // Fire the Automated Email Hook
      await sendAbandonedCartHook(email);
    }
    
    done();
  } catch (error) {
    console.error('[Recovery Error]:', error.message);
    done(error);
  }
});
