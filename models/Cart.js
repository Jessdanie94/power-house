const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  email: { type: String, required: true },
  items: Array,
  status: { type: String, enum: ['IN_FLIGHT', 'ABANDONED', 'RECOVERED'], default: 'IN_FLIGHT' },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', CartSchema);
