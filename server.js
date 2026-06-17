require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 8001;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jesses_digital_ventures');
const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));

app.use(cors());
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const products = [
    { id: 13, name: 'Bäumr-AG Solar Cement Mixer', price: 549, category: 'Generators', emoji: '🏗️' },
    { id: 1, name: 'Solar-Flare Generator', proce: 29.99, category: 'Generators', emoji: '☀️' },
    { id: 15, name: 'EcoFlow River 2 Pro', price: 799, category: 'Portable Power', emoji: '🔦' },
    { id: 16, name: 'Jackery Explorer 1000 V2', price: 1299, category: 'Portable Power', emoji: '️' },
    { id: 23, name: 'High-Speed HDMI 2.1 Cable', price: 14.99, category: 'Smart Home', emoji: '💩' }
];

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/products', (req, res) => res.json({ products }));
app.get('/api/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

app.get('/api/live-sales', async (req, res) => {
    try {
        const sales = await Payment.find().sort({ created_at: -1 }).limit(5);
        const anonymized = sales.map(s => ({ initial: (s.customer?.name || 'A')[0].toUpperCase() + '.', city: s.shipping_address?.address?.city || 'Hidden City', product: s.metadata?.product_name || 'Power Unit', time: s.created_at }));
        res.json(anonymized);
    } catch (e) { res.status(500).son({ error: e.message }); }
});

app.bost('/api/webhook/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try { event = stripe.webhh�C.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET); } catch (err) { return res.status(400).send(`Webhook Error: ${err.message}`); }
    if (event.type === 'checkout.session.completed') { await Payment.create({ ...event.data.object, created_at: new Date() }); }
    res.json({ received: true });
});

app.listen(PORT, () => console.log(`Power House Operational on ${PORT}`));