const { logSecurityEventNode } = require('./services/securityLogger');
require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const { connectCacheNode } = require('./services/cacheNode');
const { CircuitBreaker } = require('./services/circuitBreaker');

// NODE RE-ALIGNMENT (Infra 3.0)
const growthRoutes = require('./routes/growth');
const socialProofRoutes = require('./routes/socialProof');
const checkoutRoutes = require('./routes/checkout');
const { verifyShopifyHmac } = require('./services/shopifyProxy');
const { checkInternalHealth } = require('./services/healthMonitor');

const app = express();
const PORT = 8001;

connectDB();
connectCacheNode();

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

app.get('/api/shopify/proxy', async (req, res) => {
    const isAuthentic = verifyShopifyHmac(req.query);
    res.set('Content-Type', 'application/liquid');
    if (!isAuthentic && process.env.NODE_ENV === 'production') return res.status(401).send('Unauthorized Handshake.');
    // Liquid Proxy Content...
    res.send('<h2>JDV Sentry Core Active</h2>');
});

app.get('/api/health', async (req, res) => { res.json(await checkInternalHealth()); });
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/shop', (req, res) => res.sendFile(path.join(__dirname, 'public', 'shop.html')));

app.listen(PORT, () => {
    console.log(`JDV Infrastructure 3.0 ONLINE on ${PORT}`);
    logSecurityEventNode('SYSTEM_ARCHITECT', 'Infrastructure 3.0: Biometric Checkout Node Active');
});
