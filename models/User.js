const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  referralToken: {
    type: String,
    required: true,
    unique: true
  },
  referredBy: {
    type: String,
    default: null
  },
  referralCount: {
    type: Number,
    default: 0
  },
  waitlistPosition: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
