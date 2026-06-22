const express = require('express');
const router = express.Router();
const { joinWaitlist, getDynamicPosition } = require('../services/referralEngine');
const User = require('../models/User');
const { sendWaitlistWelcome } = require('../services/emailService');

router.post('/join', async (req, res) => {
  const { email, ref } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid signal (email) required.' });
  }

  try {
    const user = await joinWaitlist(email, ref);
    const position = await getDynamicPosition(email);
    
    // Asynchronous notification hook
    sendWaitlistWelcome(user.email, user.referralToken, position).catch(e => console.error(e));
    
    res.status(201).json({ 
      success: true, 
      user: {
          email: user.email,
          token: user.referralToken,
          tier: user.tier,
          referralCount: user.referralCount,
          position
      },
      shareLink: `https://payment-event-hub.preview.emergentagent.com/shop?ref=${user.referralToken}`
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const topReferrers = await User.find()
      .sort({ referralCount: -1, createdAt: 1 })
      .limit(10);
      
    const leaderData = topReferrers.map((u, index) => ({
      rank: index + 1,
      identity: u.email.split('@')[0].substring(0, 3) + '***',
      count: u.referralCount,
      tier: u.tier,
      token: u.referralToken
    }));
    
    res.json(leaderData);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/status/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.toLowerCase() });
        if (!user) return res.status(404).json({ error: 'Signal not found in vault.' });
        
        const position = await getDynamicPosition(user.email);
        res.json({ 
            email: user.email,
            tier: user.tier,
            referrals: user.referralCount,
            position,
            milestones: user.milestones
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
