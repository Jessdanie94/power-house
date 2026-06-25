require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { logToIsolatedVault } = require('../693300f4dac1ac6b9babb468/auditLogger');

console.log('[Liquidity Watcher] Monitoring Stripe-to-Neo transit lines...');

setInterval(async () => {
    try {
        const payouts = await stripe.payouts.list({ limit: 1 });
        const latest = payouts.data[0];
        
        if (latest && latest.status === 'in_transit') {
            console.log(`[Liquidity Signal] CA$${latest.amount/100} detected in-transit to Neo.`);
            logToIsolatedVault('LIQUIDITY_WATCHER', 'PAYOUT_DETECTED', { amount: latest.amount, status: latest.status });
        }
    } catch (e) {
        console.error('[Liquidity Error]', e.message);
    }
}, 300000); // Check every 5 minutes
