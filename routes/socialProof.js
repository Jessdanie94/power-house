const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');

router.get('/live-signals', async (req, res) => {
  try {
    // 1. Fetch latest Orders
    const orders = await Order.find().sort({ createdAt: -1 }).limit(10);
    
    // 2. Fetch latest Waitlist Joins
    const signups = await User.find().sort({ createdAt: -1 }).limit(10);
    
    // 3. Map signals into a unified 'Social Proof' format
    const orderSignals = orders.map(s => ({
      identity: (s.customer?.name || 'A')[0].toUpperCase() + '.',
      event: 'secured',
      target: s.items[0]?.title || 'Power Unit',
      timestamp: s.createdAt,
      tier: 'PURCHASE'
    }));

    const signupSignals = signups.map(u => ({
      identity: u.email.split('@')[0][0].toUpperCase() + '.',
      event: 'joined',
      target: 'the Inner Circle',
      timestamp: u.createdAt,
      tier: u.tier
    }));

    // 4. Aggregate, Sort by recency, and slice top 5
    const liveSignals = [...orderSignals, ...signupSignals]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);

    res.json(liveSignals);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
