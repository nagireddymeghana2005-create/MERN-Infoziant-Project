const mongoose = require('mongoose');

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error('MONGODB_URI is required. Configure the MongoDB Atlas connection in backend/.env.');
  }

  let parsedUri;
  try {
    parsedUri = new URL(uri);
  } catch {
    throw new Error('MONGODB_URI must be a valid MongoDB Atlas connection string.');
  }

  if (
    !['mongodb:', 'mongodb+srv:'].includes(parsedUri.protocol) ||
    !parsedUri.hostname.toLowerCase().endsWith('.mongodb.net')
  ) {
    throw new Error('MONGODB_URI must point to a MongoDB Atlas cluster (*.mongodb.net).');
  }

  return uri;
};

const connectDB = async () => {
  const uri = getMongoUri();
  try {
    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB?.trim() || 'docconnect'
    });
    console.log(`MongoDB Atlas connected successfully (${mongoose.connection.host})`);
  } catch (error) {
    console.error('MongoDB Atlas connection error:', error.message.replace(uri, '[redacted MongoDB URI]'));
    throw error;
  }
};

module.exports = connectDB;
module.exports.getMongoUri = getMongoUri;
