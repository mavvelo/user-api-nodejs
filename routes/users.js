const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  deactivateUser
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');
const {
  validateUserCreation,
  validateUserUpdate,
  validateObjectId,
  validatePagination
} = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management operations
 */

// All routes are protected
router.use(protect);

router
  .route('/')
  .get(validatePagination, getAllUsers)
  .post(restrictTo('admin'), validateUserCreation, createUser);

router
  .route('/:id')
  .get(validateObjectId, getUserById)
  .patch(validateObjectId, validateUserUpdate, updateUser)
  .delete(restrictTo('admin'), validateObjectId, deleteUser);

router
  .route('/:id/deactivate')
  .patch(restrictTo('admin'), validateObjectId, deactivateUser);

module.exports = router;