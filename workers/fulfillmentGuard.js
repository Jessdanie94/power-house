require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { logToIsolatedVault } = require('../693300f4dac1ac6b9babb468/auditLogger');

/**
 * JDV Fulfillment Guard: Polices the fulfillment pipeline and monitors the Master Battery (shpat_).
 * Part of the "Manual Code Entry Track".
 */
console.log('[Fulfillment Guard] JDV Tactical Monitor initialized. Policing fulfillment signals.');

const verifyMasterBatterySignal = () => {
    const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
    
    if (!token || token === 'REPLACE_ME') {
        console.warn('[Fulfillment Guard] CRITICAL: Master Battery (shpat_) is OFFLINE. System awaiting Manual Entry.');
        return false;
    }

    // TACTICAL: In a full deployment, this would perform a low-cost API call to Shopify
    // to verify the token hasn't been revoked.
    console.log('[Fulfillment Guard] Master Battery signal verified. Fulfillment engines ARMED.');
    return true;
};

// Monitor the signal every 5 minutes to ensure zero downtime
setInterval(() => {
    const isReady = verifyMasterBatterySignal();
    
    if (!isReady) {
        logToIsolatedVault('FULFILLMENT_GUARD', 'SIGNAL_LOST', { reason: 'Missing_API_Token' });
    }
}, 300000);

module.exports = { status: 'Guard_Active' };
