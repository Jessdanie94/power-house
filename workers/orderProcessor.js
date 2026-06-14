require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Queue = require('bull');
const axios = require('axios');
const connectDB = require('../config/db');
const VendorInventory = require('../models/VendorInventory');

const orderRoutingQueue = new Queue('order-routing', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

console.log('[Sentry Worker] Order Routing Queue Initiated...');

orderRoutingQueue.process(async (job, done) => {
  const { orderId, lineItems, shippingAddress } = job.data;

  try {
    await connectDB();
    console.log(`[Worker] Optimizing fulfillment path for Order #${orderId}`);

    for (const item of lineItems) {
      const productInventory = await VendorInventory.findOne({ sku: item.sku });

      if (!productInventory || productInventory.vendors.length === 0) {
        throw new Error(`No vendors found mapped to SKU: ${item.sku}`);
      }

      const eligibleVendors = productInventory.vendors
        .filter(v => v.stockCount >= item.quantity)
        .sort((a, b) => b.priorityScore - a.priorityScore);

      if (eligibleVendors.length === 0) {
        console.error(`CRITICAL: SKU ${item.sku} is entirely out of stock across all vendors.`);
        return done(new Error(`SKU ${item.sku} out of stock globally.`));
      }

      const optimalVendor = eligibleVendors[0];
      console.log(`Routing SKU ${item.sku} to ${optimalVendor.vendorName}`);

      // Vendor API Call
      await axios.post(optimalVendor.apiEndpoint, {
        apiKey: process.env[`${optimalVendor.vendorName.toUpperCase()}_API_KEY`],
        orderId,
        sku: item.sku,
        quantity: item.quantity,
        shipping: shippingAddress
      });

      await VendorInventory.updateOne(
        { sku: item.sku, 'vendors.vendorName': optimalVendor.vendorName },
        { $inc: { 'vendors.$.stockCount': -item.quantity } }
      );
    }

    done();
  } catch (error) {
    console.error(`[Routing Error] Order #${orderId} processing failed:`, error.message);
    done(error);
  }
});
