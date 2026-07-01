import { processNewOrders } from './shopifySync.js';

// Run the order verification check automatically every 60 minutes
setInterval(() => {
  processNewOrders();
}, 1000 * 60 * 60);

console.log("⏰ Shopify Order Sync Scheduler started (Interval: 60 min)");
processNewOrders(); // Run immediately on start
