const authController = require('../../controllers/authController');
const User = require('../../models/User');
const { AppError } = require('../../middleware/errorHandler');

// Mock User model
jest.mock('../../models/User');

describe('Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        age: 30
      };

      const mockUser = {
        _id: 'userId123',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        role: 'user',
        createdAt: new Date(),
        generateAuthToken: jest.fn().mockReturnValue('mockToken123')
      };

      User.findOne.mockResolvedValue(null); // No existing user
      User.create.mockResolvedValue(mockUser);

      // Act
      await authController.register(req, res, next);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(User.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        age: 30
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: expect.objectContaining({
          user: expect.objectContaining({
            id: 'userId123',
            name: 'John Doe',
            email: 'john@example.com'
          }),
          token: 'mockToken123'
        })
      });
    });

    it('should return error if user already exists', async () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123'
      };

      User.findOne.mockResolvedValue({ email: 'john@example.com' }); // Existing user

      // Act
      await authController.register(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.any(AppError)
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      // Arrange
      req.body = {
        email: 'john@example.com',
        password: 'Password123'
      };

      const mockUser = {
        _id: 'userId123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true),
        generateAuthToken: jest.fn().mockReturnValue('mockToken123'),
        save: jest.fn()
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      await authController.login(req, res, next);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('Password123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: expect.objectContaining({
          user: expect.objectContaining({
            id: 'userId123',
            name: 'John Doe',
            email: 'john@example.com'
          }),
          token: 'mockToken123'
        })
      });
    });
  });
});