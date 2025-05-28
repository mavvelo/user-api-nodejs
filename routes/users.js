const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

router.route('/')
  .get(getAllUsers)
  .post(restrictTo('admin'), createUser);

router.route('/:id')
  .get(getUserById)
  .patch(updateUser)
  .delete(restrictTo('admin'), deleteUser);

module.exports = router;