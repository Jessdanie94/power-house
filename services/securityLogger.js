const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logSecurityEventNode = (actor, action, metadata = {}) => {
  const logDirectory = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDirectory)) fs.mkdirSync(logDirectory);
  const logPayload = { timestamp: new Date().toISOString(), actor, action, metadata, systemHash: '' };
  const rawDataString = `${logPayload.timestamp}-${actor}-${action}-${JSON.stringify(metadata)}`;
  logPayload.systemHash = crypto.createHmac('sha256', process.env.LOG_SIGNING_SECRET || 'JDV_SECRET').update(rawDataString).digest('hex');
  fs.appendFileSync(path.join(logDirectory, 'security_audit.log'), JSON.stringify(logPayload) + '\n', 'utf8');
  console.log(`[Audit Log] Cryptographic security token generated for event: ${action}`);
};
module.exports = { logSecurityEventNode };
