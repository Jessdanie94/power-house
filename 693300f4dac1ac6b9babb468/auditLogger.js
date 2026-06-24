const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const vaultPath = path.join(__dirname, 'tamper_proof_ledger.log');

const logToIsolatedVault = (origin, event, metadata = {}) => {
    const entry = {
        timestamp: new Date().toISOString(),
        node_id: '693300f4dac1ac6b9babb468',
        origin,
        event,
        metadata,
        signature: crypto.createHash('sha256').update(JSON.stringify(metadata) + Date.now()).digest('hex')
    };

    fs.appendFileSync(vaultPath, JSON.stringify(entry) + '\n');
    console.log(`[Audit Vault] Secure entry recorded: ${event}`);
};

module.exports = { logToIsolatedVault };
