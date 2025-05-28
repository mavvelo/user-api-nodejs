// tests/setup.js - Global test setup
const mongoose = require('mongoose');

let mongoConnection;

// Global setup - runs once before all tests
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
  
  // Connect to test database
  const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/userapi_test';
  
  // Close any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  // Connect to test database
  mongoConnection = await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  console.log('✅ Connected to test database');
});

// Global cleanup - runs once after all tests
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('✅ Disconnected from test database');
  }
});

// Clean database between tests
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

module.exports = {
  mongoConnection
};