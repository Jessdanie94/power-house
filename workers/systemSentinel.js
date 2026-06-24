require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

/**
 * Checks system memory usage and database socket pools
 */
async function inspectSystemHealth() {
  const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // Convert bytes to MB
  console.log(`[Sentinel Watchman] Memory Footprint: ${memoryUsage.toFixed(2)} MB`);

  // 1. If memory spikes drastically, force a safe garbage collection cycle if available
  if (memoryUsage > 400 && global.gc) {
    console.warn('[Sentinel Alert] High memory threshold crossed. Running garbage collection...');
    global.gc();
  }

  // 2. Inspect the MongoDB connection health state
  const dbState = mongoose.connection.readyState;
  if (dbState !== 1) {
    console.error(`[Sentinel Danger] Critical Database State Anomaly detected: State Code ${dbState}`);
    console.log('[Sentinel Action] Attempting to force-heal connection strings...');
    
    try {
      await mongoose.disconnect();
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jesses_digital_ventures');
      console.log('[Sentinel Success] Database pool successfully re-established and healthy.');
    } catch (error) {
      console.error('[Sentinel Critical Failure] Self-healing connection failed:', error.message);
    }
  }
}

/**
 * Boots the Watchman Sentinel Loop
 */
function startSystemSentinel(intervalMs = 30000) {
  console.log('[Sentinel Service] Watchman Sentinel daemon activated. Policing server infrastructure.');
  setInterval(async () => {
    try {
      await inspectSystemHealth();
    } catch (err) {
      console.error('[Sentinel Error Alert]:', err.message);
    }
  }, intervalMs);
}

module.exports = { startSystemSentinel };
