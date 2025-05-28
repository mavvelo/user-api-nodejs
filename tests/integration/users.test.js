const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');

describe('Users Integration Tests', () => {
  let userToken, adminToken, userId, adminId, testUser, testAdmin;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/userapi_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});

    // Create and store the actual user objects
    testUser = await User.create({
      name: 'Test User',
      email: 'user@example.com',
      password: 'Password123',
      role: 'user'
    });
    userId = testUser._id.toString();
    userToken = testUser.generateAuthToken();

    testAdmin = await User.create({
      name: 'Test Admin',
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin'
    });
    adminId = testAdmin._id.toString();
    adminToken = testAdmin.generateAuthToken();

    console.log('User token generated:', !!userToken);
    console.log('Admin token generated:', !!adminToken);
    console.log('User ID:', userId);
    console.log('Admin ID:', adminId);
  });

  afterAll(async () => {
    await User.deleteMany({});
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  describe('GET /api/users', () => {
    it('should get all users for authenticated user', async () => {
      // Use the created user object instead of looking it up
      expect(testUser).toBeTruthy();
      expect(testUser._id.toString()).toBe(userId);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results).toBeGreaterThan(0);
      expect(response.body.data.users).toBeInstanceOf(Array);
    });

    // ... rest of the tests remain the same
    it('should not get users without authentication', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.results).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by ID', async () => {
      // Use the created user object instead of looking it up
      expect(testUser).toBeTruthy();
      expect(testUser._id.toString()).toBe(userId);

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user._id).toBe(userId);
    });

    // ... rest of tests remain the same
  });

  // ... rest of the describe blocks remain the same
});