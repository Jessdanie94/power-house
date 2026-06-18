require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const Queue = require('bull');

// Node Imports
const connectDB = require('./config/db');
const { connectCacheNode } = require('./services/cacheNode');
const { logSecurityEventNode } = require('./services/securityLogger');
const { sendMissionConfirmed } = require('./services/emailService');
const { CircuitBreaker } = require('./services/circuitBreaker');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 8001;

// Core Node Initialization
connectDB();
connectCacheNode();

// Order Routing Queue (Redis)
const orderRoutingQueue = new Queue('order-routing', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

// 🦾 Initialize Circuit Breakers
const productBreaker = new CircuitBreaker('JDV_PRODUCT_CATALOG', 5, 60000);
const webhookBreaker = new CircuitBreaker('STRIPE_WEBHOOK_HUB', 5, 60000);

// Middlewares
app.use(cors());
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    next();
});

// Routes requiring raw bodies
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));
app.use('/api/secure-webhooks/stripe-receiver', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// THE SENTRY GATE
const sentryGate = (req, res, next) => {
    if ((req.query.key || req.headers['x-sentry-key']) === 'JDV_SENTRY_966') return next();
    res.status(403).send("ACCESS DENIED");
};

// API Endpoints
app.use('/api/admin', require('./routes/admin'));
app.use('/api/secure-webhooks', require('./routes/stripeReceiver'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', mongo: mongoose.connection.readyState === 1 }));

app.get('/api/products', async (req, res) => {
    const products = [
        { id: 'bundle-001', sku: 'JDV-STK-749', name: 'Sovereign Tactical Deployment Kit', price: 749.00, category: 'Elite Bundle', emoji: '⚔️' },
        { id: 'solar-mixer', sku: 'JDV-SCM-13', name: 'Bäumr-AG Solar Cement Mixer', price: 549, category: 'Generators', emoji: '🏗️' },
        { id: 'solar-flare', sku: 'JDV-SFG-001', name: 'Solar-Flare Generator', price: 29.99, category: 'Generators', emoji: '☀️' },
        { id: 'led-hub', sku: 'JDV-ESL-39', name: 'Eco-Smart LED Hub', price: 44.95, category: 'Smart Home', emoji: '💡' }
    ];
    const result = await productBreaker.execute(async () => products, 'cached_products');
    res.json({ products: result.data, source: result.source });
});

// Front-end Routes
app.get('/dashboard', sentryGate, (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/shop', (req, res) => res.sendFile(path.join(__dirname, 'public', 'shop.html')));

// Webhook Hub
app.post('/api/webhook/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const mission = async () => {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            await Order.create({
                orderId: session.id,
                customer: { name: session.customer_details.name, email: session.customer_details.email },
                totalAmount: session.amount_total / 100,
                financialStatus: 'paid',
                fulfillmentStatus: 'processing'
            });
            await orderRoutingQueue.add({ orderId: session.id, shippingAddress: session.shipping_details });
            try { await sendMissionConfirmed(session.customer_details.email, session.customer_details.name, session.amount_total, 'Smart Tech Gear'); } catch (e) {}
        }
        return { received: true };
    };
    const result = await webhookBreaker.execute(mission, 'last_webhook_event');
    res.status(result.source === 'live_api_pulse' ? 200 : 503).json(result.data);
});

// SPA Fallback
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'shop.html')));

app.listen(PORT, () => {
    console.log(`Operational on port ${PORT}`);
    logSecurityEventNode('SYSTEM_ARCHITECT', 'Server Reboot: Legacy Issue Fixed', { port: PORT });
});
