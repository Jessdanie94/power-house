const mongoose = require('mongoose');
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jesses_digital_ventures');
    console.log('[Sentry] Database Vault Connected');
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
};
module.exports = connectDB;
