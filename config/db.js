const mongoose = require('mongoose');

async function connectDatabase(uri) {
  if (!uri) throw new Error('MONGODB_URI is not configured');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  return mongoose.connection;
}

module.exports = connectDatabase;
