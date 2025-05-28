const User = require('../models/User');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (with pagination, filtering, and sorting)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of users per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field (name, email, age, createdAt)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and email
 */
const getAllUsers = catchAsync(async (req, res, next) => {
  // Build query
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
  excludedFields.forEach(el => delete queryObj[el]);

  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `${match}`);
  let query = User.find(JSON.parse(queryStr));

  // Search functionality
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query = query.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    });
  }

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  }

  // Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  // Execute query
  const users = await query.skip(skip).limit(limit);
  const total = await User.countDocuments(JSON.parse(queryStr));

  res.status(200).json({
    success: true,
    results: users.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      users
    }
  });
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 */
const getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 */
const createUser = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);

  logger.info('User created by admin', { 
    createdUserId: user._id, 
    adminId: req.user._id 
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      user
    }
  });
});

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
const updateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Users can only update their own profile unless they're admin
  if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
    return next(new AppError('You can only update your own profile', 403));
  }

  // Remove password from update data if present
  delete req.body.password;
  delete req.body.role; // Prevent role escalation

  const user = await User.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  logger.info('User updated', { userId: user._id, updatedBy: req.user._id });

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: {
      user
    }
  });
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  logger.info('User deleted', { deletedUserId: user._id, deletedBy: req.user._id });

  res.status(204).json({
    success: true,
    message: 'User deleted successfully'
  });
});

// Deactivate user instead of deleting
const deactivateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  logger.info('User deactivated', { userId: user._id, deactivatedBy: req.user._id });

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully',
    data: {
      user
    }
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  deactivateUser
};