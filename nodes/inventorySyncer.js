const axios = require('axios');
const { logToIsolatedVault } = require('../693300f4dac1ac6b9babb468/auditLogger');

/**
 * JDV Inventory Syncer: Real-time bridge between Shopify and Sellvia clusters.
 * Architected for Infrastructure 4.2.
 */
const syncInventoryNode = async (sku, newQuantity) => {
    const shop = 'jessesdigitalventures-gmail-com';
    const accessToken = process.env.SHOPIFY_ADMIN_API_TOKEN; // shpat_ battery

    console.log(`[Inventory Syncer] Initiating sync for SKU: ${sku} -> ${newQuantity}`);

    if (!accessToken) {
        console.error('[Inventory Syncer] Handshake FAILED: Missing shpat_ token.');
        return { success: false, error: 'Authorization Offline' };
    }

    try {
        // 1. Log mission start to isolated vault
        logToIsolatedVault('INVENTORY_SYNCER', 'SYNC_INITIATED', { sku, quantity: newQuantity });

        // 2. Fetch Variant ID from Shopify by SKU
        // Note: Shopify requires the inventory_item_id to update levels
        const productResponse = await axios.get(`https://${shop}.myshopify.com/admin/api/2024-01/products.json?fields=id,variants`, {
            headers: { 'X-Shopify-Access-Token': accessToken }
        });

        let targetVariant = null;
        productResponse.data.products.forEach(p => {
            const variant = p.variants.find(v => v.sku === sku);
            if (variant) targetVariant = variant;
        });

        if (!targetVariant) {
            throw new Error(`SKU ${sku} not found in Shopify catalog.`);
        }

        // 3. Force Inventory Adjustment
        // We use the location_id (fetched dynamically in a full implementation)
        // For JDV 4.2, we assume a primary fulfillment location is set.
        const locationResponse = await axios.get(`https://${shop}.myshopify.com/admin/api/2024-01/locations.json`, {
            headers: { 'X-Shopify-Access-Token': accessToken }
        });
        const locationId = locationResponse.data.locations[0].id;

        await axios.post(`https://${shop}.myshopify.com/admin/api/2024-01/inventory_levels/set.json`, {
            location_id: locationId,
            inventory_item_id: targetVariant.inventory_item_id,
            available: newQuantity
        }, {
            headers: { 'X-Shopify-Access-Token': accessToken }
        });

        console.log(`[Inventory Syncer] SUCCESS: SKU ${sku} aligned to ${newQuantity} units.`);
        
        // 4. Log completion
        logToIsolatedVault('INVENTORY_SYNCER', 'SYNC_SUCCESS', { sku, locationId });

        return { success: true, timestamp: new Date() };

    } catch (e) {
        const errorMsg = e.response?.data?.errors || e.message;
        console.error(`[Inventory Error] Sync failed for ${sku}:`, errorMsg);
        logToIsolatedVault('INVENTORY_SYNCER', 'SYNC_FAILURE', { sku, error: errorMsg });
        return { success: false, error: errorMsg };
    }
};

module.exports = { syncInventoryNode };
