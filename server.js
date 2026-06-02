const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const emailService = require('./app/email_service');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for Stripe Webhook (needs raw body)
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));

// Regular middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection (Optional for demo, but requested)
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('MongoDB connected'))
        .catch(err => console.log('MongoDB connection error:', err));
}

// Products Catalog (12 high-tech items)
const products = [
    { id: 1, name: 'Neural Link VR Headset', price: 1299, category: 'Hardware' },
    { id: 2, name: 'Quantum Core Laptop', price: 3499, category: 'Computing' },
    { id: 3, name: 'Bio-Metric Smart Ring', price: 299, category: 'Wearables' },
    { id: 4, name: 'Holographic Projector', price: 899, category: 'Display' },
    { id: 5, name: 'Nano-Battery Pack', price: 149, category: 'Power' },
    { id: 6, name: 'Satellite Mesh Node', price: 599, category: 'Networking' },
    { id: 7, name: 'AI Edge Processor', price: 450, category: 'Hardware' },
    { id: 8, name: 'Cryo-Cooling Desktop', price: 4200, category: 'Computing' },
    { id: 9, name: 'Fusion Power Bank', price: 199, category: 'Power' },
    { id: 10, name: 'Graphene Touch Tablet', price: 1100, category: 'Display' },
    { id: 11, name: 'Sonic Levitation Speaker', price: 350, category: 'Audio' },
    { id: 12, name: 'Neuro-Haptic Suit', price: 2500, category: 'Wearables' }
];

// Mock Sales Data for Saskatchewan
const mockSales = [
    { id: 's1', customer: 'Regina Tech Corp', amount: 5000, province: 'Saskatchewan', date: '2026-05-28' },
    { id: 's2', customer: 'Saskatoon Devs', amount: 1200, province: 'Saskatchewan', date: '2026-05-29' },
    { id: 's3', customer: 'Moose Jaw Innovations', amount: 800, province: 'Saskatchewan', date: '2026-05-27' },
    { id: 's4', customer: 'Ontario Systems', amount: 3000, province: 'Ontario', date: '2026-05-29' }
];

// Routes
app.get('/api/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/api/products', (req, res) => {
    res.json(products);
});

app.get('/api/recent-sales', (req, res) => {
    const saskSales = mockSales.filter(sale => sale.province === 'Saskatchewan');
    res.json(saskSales);
});

// Stripe Webhook
app.post('/api/webhook/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('PaymentIntent was successful!');
            
            // Afternoon Optimization: Call branded email service
            const customerEmail = paymentIntent.receipt_email || 'client@jessesdigitalventures.com';
            const customerName = paymentIntent.shipping?.name || 'Valued Client';
            const missionName = 'Powerhouse High-Tech Requisition';
            
            await emailService.sendMissionConfirmedEmail(customerEmail, customerName, missionName);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

app.listen(PORT, () => {
    console.log(`Power House Server running on port ${PORT}`);
});