const stripe = require('stripe')('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');
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
        console.error(e.message);
    }
}
run();
