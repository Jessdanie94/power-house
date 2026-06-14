require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 8001; // Forcing proxy-friendly port

// MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jesses_digital_ventures');
const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));

// Middlewares
app.use(cors());
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Products Catalog (Including new High-Value Bundle)
const products = [
    { 
        id: 'bundle-001', 
        name: 'Sovereign Tactical Deployment Kit', 
        price: 749.00, 
        category: 'Elite Bundle', 
        emoji: '⚔️',
        description: 'MISSION BRIEFING: For high-stakes operations in volatile environments. This kit bundles the Solar-Flare Generator for off-grid energy independence, the Bäumr-AG Mixer for rapid structural synthesis, and the Quantum Core Smart Ring for secure biometric data encryption. Deploy immediately to secure your digital sovereignty.'
    },
    { id: 13, name: 'Bäumr-AG Solar Cement Mixer', price: 549, category: 'Generators', emoji: '🏗️' },
    { id: 1, name: 'Solar-Flare Generator', price: 29.99, category: 'Generators', emoji: '☀️' },
    { id: 14, name: 'Eco-Smart LED Hub', price: 39.95, category: 'Smart Home', emoji: '💡' }
];

// Endpoints
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/products', (req, res) => res.json({ products }));
app.get('/api/dashboard', (req, res) => { console.log('API Dashboard requested'); res.sendFile(path.join(__dirname, 'public', 'dashboard.html'), err => { if (err) console.error('sendFile error:', err); else console.log('sendFile success'); }); });
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/shop', (req, res) => res.sendFile(path.join(__dirname, 'public', 'shop.html')));

// Subscription Route: JDV Sentry Monthly Membership
app.post('/api/subscription/create', async (req, res) => {
    const { email, paymentMethodId, priceId } = req.body;
    try {
        const customer = await stripe.customers.create({
            email: email,
            payment_method: paymentMethodId,
            invoice_settings: { default_payment_method: paymentMethodId },
        });

        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId || 'price_jdv_sentry_monthly' }],
            expand: ['latest_invoice.payment_intent'],
        });

        res.status(200).json(subscription);
    } catch (error) {
        console.error('Subscription Error:', error);
        res.status(400).json({ error: { message: error.message } });
    }
});

app.get('/api/live-sales', async (req, res) => {
    try {
        const sales = await Payment.find().sort({ created_at: -1 }).limit(5);
        const anonymized = sales.map(s => ({
            initial: (s.customer?.name || 'A')[0].toUpperCase() + '.',
            city: s.shipping_address?.address?.city || 'Hidden City',
            product: s.metadata?.product_name || 'Power Unit',
            time: s.created_at
        }));
        res.json(anonymized);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/webhook/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event.type === 'checkout.session.completed') {
        await Payment.create({ ...event.data.object, created_at: new Date() });
    }
    res.json({ received: true });
});

app.listen(PORT, () => console.log(`Power House Operational on ${PORT}`));