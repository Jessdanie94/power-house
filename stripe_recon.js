// LEGACY: Not imported by the operator runtime; no automatic execution.
import Stripe from 'stripe';
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
async function run() {
    try {
        const balance = await stripe.balance.retrieve();
        console.log('--- BALANCE ---');
        console.log(JSON.stringify(balance, null, 2));
        const charges = await stripe.charges.list({ limit: 5 });
        console.log('--- CHARGES ---');
        console.log(JSON.stringify(charges.data.map(c => ({ amount: c.amount, currency: c.currency, status: c.status, description: c.description })), null, 2));
        const payouts = await stripe.payouts.list({ limit: 5 });
        console.log('--- PAYOUTS ---');
        console.log(JSON.stringify(payouts.data.map(p => ({ amount: p.amount, status: p.status, arrival: new Date(p.arrival_date * 1000) })), null, 2));
    } catch (e) {
        console.error('Provider request failed; details omitted.');
    }
}
// Legacy reconnaissance is intentionally not auto-run.
