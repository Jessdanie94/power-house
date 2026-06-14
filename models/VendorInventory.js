const mongoose = require('mongoose');

const VendorInventorySchema = new mongoose.Schema({
  sku: { type: String, required: true, index: true },
  vendors: [{
    vendorName: { type: String, required: true }, // e.g., 'Sellvia', 'Alternative_3PL'
    stockCount: { type: Number, required: true, default: 0 },
    costPrice: { type: Number, required: true },
    priorityScore: { type: Number, default: 1 }, // Higher number = preferred vendor
    apiEndpoint: { type: String, required: true }
  }],
  lastSynced: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VendorInventory', VendorInventorySchema);
