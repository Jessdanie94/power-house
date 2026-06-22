const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/live-signals', async (req, res) => {
  try {
    const signals = await Order.find().sort({ createdAt: -1 }).limit(5);
    const anonymized = signals.map(s => ({
      initial: (s.customer?.name || 'A')[0].toUpperCase() + '.',
      product: s.items[0]?.title || 'Power Unit',
      time: s.createdAt
    }));
    res.json(anonymized);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
