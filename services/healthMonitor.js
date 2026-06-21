const mongoose = require('mongoose');
const Redis = require('ioredis');

const checkInternalHealth = async () => {
  const status = {
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'OFFLINE',
      redis: 'OFFLINE',
      powerhouse_core: 'ONLINE'
    }
  };

  // 1. Check MongoDB
  if (mongoose.connection.readyState === 1) {
    status.services.mongodb = 'ONLINE';
  }

  // 2. Check Redis
  try {
    const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
    const ping = await redis.ping();
    if (ping === 'PONG') status.services.redis = 'ONLINE';
    redis.disconnect();
  } catch (e) {
    status.services.redis = 'ERROR';
  }

  return status;
};

module.exports = { checkInternalHealth };
