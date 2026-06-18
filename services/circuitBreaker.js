const { cacheWrapNode } = require('./cacheNode');
class CircuitBreaker {
  constructor(serviceName, threshold = 5, lockTimeMs = 60000) {
    this.serviceName = serviceName;
    this.threshold = threshold;
    this.lockTimeMs = lockTimeMs;
    this.failureCount = 0;
    this.status = 'CLOSED';
    this.lastFailureTime = null;
  }
  async execute(apiCall, cacheKey) {
    if (this.status === 'OPEN' && Date.now() - this.lastFailureTime > this.lockTimeMs) {
        this.status = 'HALF-OPEN';
    }
    if (this.status === 'OPEN') {
      return await cacheWrapNode(cacheKey, 3600, () => ({ error: 'Service Unavailable' }));
    }
    try {
      const result = await apiCall();
      this.failureCount = 0;
      this.status = 'CLOSED';
      return { data: result, source: 'live_api_pulse' };
    } catch (error) {
      this.failureCount++;
      if (this.failureCount >= this.threshold) {
        this.status = 'OPEN';
        this.lastFailureTime = Date.now();
      }
      return await cacheWrapNode(cacheKey, 3600, () => ({ error: 'Fallback triggered' }));
    }
  }
}
module.exports = { CircuitBreaker };
