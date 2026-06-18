const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' });

client.on('error', (err) => console.error('[Velocity Error]', err));

/**
 * Initiates the high-speed data acceleration tunnel
 */
const initiateVelocityNode = async () => {
  if (!client.isOpen) await client.connect();
  console.log('[Cache Velocity] Data Acceleration Tunnel 100% Active.');
};

/**
 * Provides a low-latency fallback mechanism for Billion-Dollar missions
 */
const getAcceleratedAsset = async (key) => {
  return await client.get(key);
};

module.exports = { initiateVelocityNode, getAcceleratedAsset };
