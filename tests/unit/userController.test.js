const userController = require('../../controllers/userController');
const User = require('../../models/User');

jest.mock('../../models/User');

describe('User Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
      user: { _id: 'adminId123', role: 'admin' }
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

  describe('getAllUsers', () => {
    it('should get all users with pagination', async () => {
      // Arrange
      const mockUsers = [
        { _id: '1', name: 'User 1', email: 'user1@example.com' },
        { _id: '2', name: 'User 2', email: 'user2@example.com' }
      ];

      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockUsers),
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        find: jest.fn().mockReturnThis()
      };

      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(2);

      // Act
      await userController.getAllUsers(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        results: 2,
        pagination: expect.objectContaining({
          page: 1,
          limit: 10,
          total: 2,
          pages: 1
        }),
        data: {
          users: mockUsers
        }
      });
    });
  });

  describe('getUserById', () => {
    it('should get user by ID successfully', async () => {
      // Arrange
      req.params.id = 'userId123';
      const mockUser = {
        _id: 'userId123',
        name: 'John Doe',
        email: 'john@example.com'
      };

      User.findById.mockResolvedValue(mockUser);

      // Act
      await userController.getUserById(req, res, next);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('userId123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockUser
        }
      });
    });
  });
});