const express = require('express');
const { Resend } = require('resend');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to generate an elegant 8-character unique referral token
const generateToken = () => crypto.randomBytes(4).toString('hex');

router.post('/join', async (req, res) => {
  const { email, ref } = req.body;

  // 1. Basic validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  try {
    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ 
        message: 'You are already on the waitlist!', 
        referralToken: existingUser.referralToken,
        position: existingUser.waitlistPosition
      });
    }

    // 3. Get the total current count to assign the baseline waitlist position
    const totalUsers = await User.countDocuments();
    const currentPosition = totalUsers + 1;
    const userToken = generateToken();

    // 4. Handle Referral Attribution atomically if a referral code is passed
    let validatedReferrer = null;
    if (ref && ref !== userToken) {
      const referrer = await User.findOneAndUpdate(
        { referralToken: ref },
        { $inc: { referralCount: 1 } },
        { new: true }
      );
      if (referrer) {
        validatedReferrer = ref;
        
        // Trigger a "Someone used your link!" email asynchronously to the referrer
        resend.emails.send({
          from: 'JDV Mission Control <onboarding@resend.dev>',
          to: referrer.email,
          subject: '🔥 Someone just joined using your link!',
          html: `<p>Awesome news! You just skipped ahead 50 spots on our waitlist. Keep sharing your link!</p>`
        }).catch(err => console.error('Failed to send referrer notification:', err));
      }
    }

    // 5. Persist the new user
    const newUser = await User.create({
      email: email.toLowerCase(),
      referralToken: userToken,
      referredBy: validatedReferrer,
      waitlistPosition: currentPosition
    });

    // 6. Dispatch Welcome Email asynchronously
    const shareLink = `https://payment-event-hub.preview.emergentagent.com/shop?ref=${userToken}`;
    resend.emails.send({
      from: 'JDV Mission Control <onboarding@resend.dev>',
      to: email,
      subject: 'You are in! Your waitlist position inside.',
      html: `
        <div style="background: #09090b; color: white; padding: 2rem; font-family: sans-serif; border: 1px solid #38bdf8;">
          <h1 style="color: #38bdf8;">Welcome to the Inner Circle</h1>
          <p>Your current waitlist position is: <strong>#${currentPosition}</strong></p>
          <p>Want to skip the line? Share your unique referral link with your peers. For every person who signs up, you move up in the queue!</p>
          <p><a href="${shareLink}" style="color: #38bdf8;">${shareLink}</a></p>
          <p style="margin-top: 2rem; font-size: 0.8rem; color: #71717a;">Jesse's Digital Ventures — Architecting Tomorrow</p>
        </div>
      `
    }).catch(err => console.error('Failed to send welcome email:', err));

    // 7. Return success response immediately to UI
    return res.status(201).json({
      success: true,
      referralToken: userToken,
      position: currentPosition,
      shareLink
    });

  } catch (error) {
    console.error('Waitlist Ingestion Error:', error);
    return res.status(500).json({ error: 'Internal system error. Please try again.' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const topReferrers = await User.find()
      .sort({ referralCount: -1 })
      .limit(10)
      .select('email referralCount referralToken');
      
    const leaderData = topReferrers.map(u => ({
      identity: u.email.split('@')[0].substring(0, 3) + '***',
      count: u.referralCount,
      token: u.referralToken
    }));
    
    res.json(leaderData);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
