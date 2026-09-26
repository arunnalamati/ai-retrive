const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('⚠️ If using MongoDB Atlas, check your network access (IP whitelist 0.0.0.0/0) and credentials in .env.');
    // Don't crash immediately so API status endpoint can inform client
  }
};

module.exports = connectDB;
