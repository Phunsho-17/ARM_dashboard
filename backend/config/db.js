// backend/config/db.js
const mongoose = require('mongoose');

module.exports = async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // ← tell Mongoose to use census_db
      dbName: process.env.DB_NAME,
    });
    console.log('✅ MongoDB connected to', process.env.DB_NAME);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};
