const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' });
client.on('error', (err) => console.error('[Redis Error]', err));
const connectCacheNode = async () => {
  if (!client.isOpen) await client.connect();
  console.log('[Cache Node] Redis Memory Acceleration Tunnel Active.');
};
const cacheWrapNode = async (cacheKey, ttlSeconds, executionFallback) => {
  await connectCacheNode();
  const cachedData = await client.get(cacheKey);
  if (cachedData) return { data: JSON.parse(cachedData), source: 'cache_hit_accelerated' };
  const freshData = await executionFallback();
  await client.setEx(cacheKey, ttlSeconds, JSON.stringify(freshData));
  return { data: freshData, source: 'cache_miss_db_write' };
};
module.exports = { cacheWrapNode, connectCacheNode };
