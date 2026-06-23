const { logSecurityEventNode } = require('./services/securityLogger');
require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const Queue = require('bull');
const connectDB = require('./config/db');
const Order = require('./models/Order');
const Cart = require('./models/Cart');
const User = require('./models/User');
const { calculateRegionalTaxNode } = require('./nodes/regionalTaxManager');
const { sendMissionConfirmed } = require('./services/emailService');
const { connectCacheNode, cacheWrapNode } = require('./services/cacheNode');
const { CircuitBreaker } = require('./services/circuitBreaker');
const { checkInternalHealth } = require('./services/healthMonitor');
const growthRoutes = require('./routes/growth');
const socialProofRoutes = require('./routes/socialProof');
const checkoutRoutes = require('./routes/checkout');
const { verifyShopifyHmac } = require('./services/shopifyProxy');

const app = express();
const PORT = 8001;

connectDB();
connectCacheNode();

const orderRoutingQueue = new Queue('order-routing', process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const recoveryQueue = new Queue('abandoned-cart-recovery', process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const webhookBreaker = new CircuitBreaker('STRIPE_WEBHOOK_GUARD', 5, 60000);

app.use(cors());
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    next();
});

app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🛰️ MISSION ROUTES
app.use('/api/growth', growthRoutes);
app.use('/api/social-proof', socialProofRoutes);
app.use('/api/checkout', checkoutRoutes);

// ACCELERATED PRODUCT CATALOG (24H CACHE IN GROWTH MODE)
app.get('/api/products', async (req, res) => {
    const fetchProducts = async () => {
        return [
            { id: 'bundle-001', name: 'Sovereign Tactical Deployment Kit', price: 749.00, category: 'Elite Bundle', emoji: '⚔️' },
            { id: 13, name: 'Bäumr-AG Solar Cement Mixer', price: 549, category: 'Generators', emoji: '🏗️' },
            { id: 1, name: 'Solar-Flare Generator', price: 29.99, category: 'Generators', emoji: '☀️' },
            { id: 14, name: 'Eco-Smart LED Hub', price: 39.95, category: 'Smart Home', emoji: '💡' }
        ];
    };
    const ttl = parseInt(process.env.CACHE_EXPIRY_SECONDS) || 3600;
    const result = await cacheWrapNode('product_catalog', ttl, fetchProducts);
    res.json(result.data);
});

app.post('/api/cart/update', async (req, res) => {
    const { email, items } = req.body;
    try {
        let cart = await Cart.findOne({ email, status: 'IN_FLIGHT' });
        if (!cart) {
            cart = await Cart.create({ email, items });
        } else {
            cart.items = items;
            cart.lastUpdated = Date.now();
            await cart.save();
        }
        
        // GROWTH VELOCITY: Trigger recovery after 20 minutes (1200000 ms)
        const delay = parseInt(process.env.CART_RECOVERY_WINDOW_MS) || 2700000;
        await recoveryQueue.add({ cartId: cart._id, email }, { delay, removeOnComplete: true });
        
        res.json({ status: 'tracked', cartId: cart._id });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/shopify/proxy', async (req, res) => {
    const isAuthentic = verifyShopifyHmac(req.query);
    res.set('Content-Type', 'application/liquid');
    if (!isAuthentic && process.env.NODE_ENV === 'production') return res.status(401).send('Unauthorized Handshake.');
    res.send('<h2>JDV Sentry Core Active</h2>');
});

app.get('/api/health', async (req, res) => { res.json(await checkInternalHealth()); });
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/shop', (req, res) => res.sendFile(path.join(__dirname, 'public', 'shop.html')));

app.listen(PORT, () => {
    console.log(`JDV Infrastructure 3.1 [GROWTH_VELOCITY] ONLINE on ${PORT}`);
    logSecurityEventNode('SYSTEM_ARCHITECT', 'Infrastructure 3.1: Growth Velocity Parameters Engaged');
});
