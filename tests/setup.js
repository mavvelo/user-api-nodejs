require('dotenv').config({ path: '.env.test' });

jest.setTimeout(10000);

// Mock logger to avoid console output during tests
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  },
  accessLogger: (req, res, next) => next(),
  errorLogger: (req, res, next) => next(),
  consoleLogger: (req, res, next) => next()
}));

// Global test helpers
global.testHelper = {
  createUserData: (overrides = {}) => ({
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123',
    age: 25,
    ...overrides
  })
};