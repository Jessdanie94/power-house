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
const { calculateRegionalTaxNode } = require('./services/taxCalculator');
const { sendMissionConfirmed } = require('./services/emailService');
const { connectCacheNode } = require('./services/cacheNode');
const { CircuitBreaker } = require('./services/circuitBreaker');

const app = express();
const PORT = 8001;

connectDB();
connectCacheNode();

const orderRoutingQueue = new Queue('order-routing', process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const webhookBreaker = new CircuitBreaker('STRIPE_WEBHOOK_GUARD', 5, 60000);

app.use(cors());
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    next();
});

app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const sentryGate = (req, res, next) => {
    if ((req.query.key || req.headers['x-sentry-key']) === 'JDV_SENTRY_966') return next();
    res.status(403).send("ACCESS DENIED");
};

// 🛰️ MISSION FLOW: Stripe Webhook -> Guard -> Atomic Transaction -> Outbox
app.post('/api/webhook/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    const missionExecution = async () => {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const province = session.shipping_details?.address?.state || 'SK';
            
            // 1. Tax Node Validation
            const taxAudit = calculateRegionalTaxNode(province, session.amount_total / 100);
            
            // 2. ATOMIC DB TRANSACTION
            const dbSession = await mongoose.startSession();
            dbSession.startTransaction();
            try {
                // Write local order
                await Order.create([{
                    orderId: session.id,
                    customer: { name: session.customer_details.name, email: session.customer_details.email },
                    totalAmount: taxAudit.finalGrossTotal,
                    financialStatus: 'paid',
                    fulfillmentStatus: 'pending' 
                }], { session: dbSession });

                await dbSession.commitTransaction();
                console.log(`[Atomic Transaction] Order ${session.id} secured in vault.`);
                
                // 3. Dispatch to Background Daemon (Outbox Worker)
                await orderRoutingQueue.add({
                    orderId: session.id,
                    lineItems: [{ sku: 'JDV-SFG-001', quantity: 1 }],
                    shippingAddress: session.shipping_details
                }, { attempts: 5, backoff: 5000 });

            } catch (error) {
                await dbSession.abortTransaction();
                throw error;
            } finally {
                dbSession.endSession();
            }

            try { await sendMissionConfirmed(session.customer_details.email, session.customer_details.name, session.amount_total, 'Solar-Flare Generator'); } catch (e) {}
        }
        return { received: true };
    };

    const result = await webhookBreaker.execute(missionExecution, 'last_webhook_mission');
    res.status(result.source === 'live_api_pulse' ? 200 : 503).json(result.data);
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', mongo: mongoose.connection.readyState === 1 }));
app.get('/dashboard', sentryGate, (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/shop', (req, res) => res.sendFile(path.join(__dirname, 'public', 'shop.html')));

app.listen(PORT, () => {
    console.log(`JDV Mission Control active on ${PORT}`);
    logSecurityEventNode('SYSTEM_ARCHITECT', 'Infrastructure 2.1: Atomic Flow Active');
});
