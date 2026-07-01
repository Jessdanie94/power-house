import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import 'dotenv/config';

// 1. Initialize the Shopify API client using your credentials
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,               // Your App API Key
  apiSecretKey: process.env.SHOPIFY_API_SECRET,      // Your App Secret
  scopes: ['read_products', 'write_products', 'read_orders', 'write_orders', 'read_inventory', 'write_inventory'],
  hostName: process.env.SHOPIFY_STORE_URL,           // e.g., "coolcorner.shop"
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false,
});

// Create a session to bypass the login dashboard programmatically
const session = shopify.session.customAppSession(process.env.SHOPIFY_STORE_URL);

/**
 * LOGIC MODULE 1: Fetch and Process New Unfulfilled Orders
 */
export async function processNewOrders() {
  try {
    console.log("🤖 Robot scanning " + process.env.SHOPIFY_STORE_URL + " for unfulfilled orders...");
    
    const client = new shopify.clients.Rest({ session });
    
    // Request only open, unfulfilled orders from the API
    const response = await client.get({
      path: 'orders',
      query: { status: 'open', fulfillment_status: 'unfulfilled' },
    });

    const orders = response.body.orders;
    console.log(`🎯 Found ${orders.length} unfulfilled orders.`);

    for (const order of orders) {
      console.log(`📦 Processing Order #${order.order_number} (Total: $${order.total_price})`);
      
      // Look inside the order for your high-ticket power equipment keywords
      for (const item of order.line_items) {
        if (item.title.toLowerCase().includes('generator') || item.title.toLowerCase().includes('solar-flare')) {
          console.log(`⚡ ALERT: High-ticket equipment detected: "${item.title}" (Qty: ${item.quantity})`);
          
          // NEXT AUTOMATION STEP: Here, your robot will pass this item data 
          // directly to your Sellvia API integration to trigger supplier fulfillment.
        }
      }
    }
  } catch (error) {
    console.error("❌ Shopify Order Sync Error:", error.message);
  }
}

/**
 * LOGIC MODULE 2: Auto-Adjust Store Inventory Levels
 * Used by your robot to prevent overselling high-ticket items.
 */
export async function updateProductInventory(inventoryItemId, newQuantity) {
  try {
    console.log("🤖 Robot updating inventory item ID: ${inventoryItemId} to ${newQuantity} units...");
    
    const client = new shopify.clients.Rest({ session });
    
    const response = await client.post({
      path: 'inventory_levels/set',
      body: {
        location_id: process.env.SHOPIFY_LOCATION_ID, // Your Shopify warehouse/store location ID
        inventory_item_id: inventoryItemId,
        available: newQuantity,
      },
    });

    if (response.status === 200) {
      console.log("✅ Inventory level successfully updated on " + process.env.SHOPIFY_STORE_URL + "!");
    }
  } catch (error) {
    console.error("❌ Shopify Inventory Sync Error:", error.message);
  }
}
