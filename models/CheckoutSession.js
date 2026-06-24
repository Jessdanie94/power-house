const mongoose = require('mongoose');

const CheckoutSessionSchema = new mongoose.Schema({
  cartId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  subtotal: { type: Number, required: true },
  items: Array,
  lastActivityAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CheckoutSession', CheckoutSessionSchema);
