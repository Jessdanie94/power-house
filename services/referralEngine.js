const User = require('../models/User');
const crypto = require('crypto');
const { sendWaitlistWelcome } = require('./emailService');

const TIERS = {
  0: 'INITIATE',
  5: 'SENTRY',
  15: 'ELITE',
  50: 'ARCHITECT'
};

const getTierByCount = (count) => {
  if (count >= 50) return 'ARCHITECT';
  if (count >= 15) return 'ELITE';
  if (count >= 5) return 'SENTRY';
  return 'INITIATE';
};

const joinWaitlist = async (email, referredByToken = null) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) return existingUser;

  const totalUsers = await User.countDocuments();
  const referralToken = crypto.randomBytes(4).toString('hex');
  
  const newUser = await User.create({
    email: email.toLowerCase(),
    referralToken,
    referredBy: referredByToken,
    waitlistPosition: totalUsers + 1
  });

  if (referredByToken) {
    await handleReferral(referredByToken);
  }

  return newUser;
};

const handleReferral = async (token) => {
  const referrer = await User.findOne({ referralToken: token });
  if (!referrer) return;

  referrer.referralCount += 1;
  
  // 1. Tier Evolution
  const newTier = getTierByCount(referrer.referralCount);
  if (newTier !== referrer.tier) {
    referrer.tier = newTier;
    referrer.milestones.push({ name: `Tier_Upgrade_${newTier}` });
    console.log(`[Growth] User ${referrer.email} promoted to ${newTier}`);
  }

  // 2. Position Boost: For every referral, jump 50 spots (simulated by count logic)
  // Real position will be calculated dynamically in a fetch leaderboard call
  
  await referrer.save();
};

const getDynamicPosition = async (email) => {
    // Logic: Sort by referralCount DESC, then createdAt ASC
    const users = await User.find().sort({ referralCount: -1, createdAt: 1 });
    const index = users.findIndex(u => u.email === email.toLowerCase());
    return index + 1;
};

module.exports = { joinWaitlist, getDynamicPosition, getTierByCount };
