const mongoose = require('mongoose');

const CheckoutSessionSchema = new mongoose.Schema({
  cartId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  customerName: { type: String },
  shippingAddress: { type: String },
  subtotal: { type: Number, required: true },
  items: Array,
  paymentStatus: { type: String, default: 'PENDING' },
  fulfillmentStatus: { type: String, default: 'PENDING' },
  lastActivityAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CheckoutSession', CheckoutSessionSchema);
