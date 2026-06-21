const User = require('../models/User');
const crypto = require('crypto');

const joinWaitlist = async (email, referredByToken = null) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) return existingUser;

  const totalUsers = await User.countDocuments();
  const referralToken = crypto.randomBytes(4).toString('hex');
  
  const newUser = await User.create({
    email,
    referralToken,
    referredBy: referredByToken,
    waitlistPosition: totalUsers + 1
  });

  if (referredByToken) {
    await User.updateOne(
      { referralToken: referredByToken },
      { $inc: { referralCount: 1 } }
    );
  }

  return newUser;
};

module.exports = { joinWaitlist };
