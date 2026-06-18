const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  source: { type: String, default: 'Storefront' },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  items: [{
    productId: String,
    title: String,
    quantity: Number,
    price: Number,
  }],
  totalAmount: { type: Number, required: true },
  financialStatus: { type: String, default: 'pending' },
  fulfillmentStatus: { type: String, default: 'unfulfilled' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
