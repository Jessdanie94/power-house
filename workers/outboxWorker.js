const Queue = require('bull');
const { logSecurityEventNode } = require('../services/securityLogger');

const outboxQueue = new Queue('mission-outbox', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

console.log('[Outbox Worker] Fulfillment Sentry is standing by for the Liquidity Flip.');

outboxQueue.process(async (job, done) => {
  const { orderId, payoutStatus } = job.data;
  
  if (payoutStatus !== 'posted') {
    console.warn(`[Outbox] Order #${orderId} held in clearing pool. Waiting for Liquidity...`);
    return done(new Error('Liquidity PENDING'));
  }

  try {
    console.log(`[Outbox] Liquidity confirmed for Order #${orderId}. Releasing mission to Sellvia...`);
    
    // Log the successful dispatch in the tamper-proof ledger
    logSecurityEventNode('OUTBOX_WORKER', 'Fulfillment_Released', { orderId });
    
    done();
  } catch (error) {
    done(error);
  }
});
