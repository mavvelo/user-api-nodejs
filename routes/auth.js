const express = require('express');
const {
  register,
  login,
  getMe,
  updatePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateUserCreation, validateLogin } = require('../middleware/validation');
const { authLimiter, createAccountLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

// Public routes
router.post('/register', createAccountLimiter, validateUserCreation, register);
router.post('/login', authLimiter, validateLogin, login);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get('/me', getMe);
router.patch('/update-password', updatePassword);

module.exports = router;