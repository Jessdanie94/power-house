const { logSecurityEventNode } = require('./services/securityLogger');
const { logToIsolatedVault } = require('./693300f4dac1ac6b9babb468/auditLogger');
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
const CheckoutSession = require('./models/CheckoutSession');
const { calculateRegionalTaxNode } = require('./nodes/regionalTaxManager');
const { sendMissionConfirmed } = require('./services/emailService');
const { connectCacheNode, cacheWrapNode } = require('./services/cacheNode');
const { CircuitBreaker } = require('./services/circuitBreaker');
const { checkInternalHealth } = require('./services/healthMonitor');
const { getMissionTelemetry } = require('./nodes/analyticsNode');
const { getMissionPredictions } = require('./nodes/aiOrchestrator');

// 🧬 AUTONOMY WORKERS
const { startSystemSentinel } = require('./workers/systemSentinel');
const { startFulfillmentGuard } = require('./workers/fulfillmentGuard');

// 🛰️ MISSION ROUTES
const growthRoutes = require('./routes/growth');
const socialProofRoutes = require('./routes/socialProof');
const checkoutRoutes = require('./routes/checkout');
const disputeShieldRouter = require('./routes/disputeShield');
const webhookRoutes = require('./routes/webhooks');
const paypalRoutes = require('./routes/paypal');

// Initialize integrated daemons
require('./workers/cartRecoveryWorker');
require('./workers/liquidityWatcher');

const app = express();
const PORT = 8001;

connectDB().then(() => {
    console.log('📦 MongoDB connection stable.');
    startSystemSentinel(30000);
    startFulfillmentGuard(60000);
});
connectCacheNode();

app.use(cors());
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    next();
});

app.use('/api/webhooks', webhookRoutes);
app.use('/api/paypal', paypalRoutes);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/growth', growthRoutes);
app.use('/api/social-proof', socialProofRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/dispute-shield', disputeShieldRouter);

app.get('/api/telemetry', async (req, res) => {
    const [telemetry, predictions] = await Promise.all([
        getMissionTelemetry(),
        getMissionPredictions()
    ]);
    res.json({ ...telemetry, boost: predictions });
});

app.get('/api/products', async (req, res) => {
    const fetchProducts = async () => {
        return [
            { id: 'bundle-001', name: 'Sovereign Tactical Deployment Kit', price: 749.00, category: 'Elite Bundle', emoji: '⚔️' },
            { id: 13, name: 'Bäumr-AG Solar Cement Mixer', price: 549, category: 'Generators', emoji: '🏗️' },
            { id: 1, name: 'Solar-Flare Generator', price: 29.99, category: 'Generators', emoji: '☀️' },
            { id: 14, name: 'Eco-Smart LED Hub', price: 39.95, category: 'Smart Home', emoji: '💡' }
        ];
    };
    const result = await cacheWrapNode('product_catalog', 86400, fetchProducts);
    res.json(result.data);
});

app.get('/api/health', async (req, res) => { res.json(await checkInternalHealth()); });

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
        if (err) res.sendFile(path.join(__dirname, 'public', 'shop.html'));
    });
});

app.listen(PORT, () => {
    console.log(`🚀 JDV Hyper-Scale Core (v5.0) LIVE on ${PORT}`);
    logSecurityEventNode('SYSTEM_ARCHITECT', 'Infrastructure 5.0: AI Orchestrator & Liquidity Watcher Deployed');
});
