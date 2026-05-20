const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGO_LOCAL_URI;

    if (!mongoURI) {
      throw new Error('MongoDB URI is missing in .env file');
    }

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT) || 10000,
      socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT) || 30000,
      maxPoolSize: Number(process.env.MONGO_POOL_SIZE) || 10,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;