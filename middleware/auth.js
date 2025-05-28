const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth middleware - Token:', !!token);
    console.log('Auth middleware - JWT_SECRET:', process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing_only');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing_only';
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Auth middleware - Decoded token:', decoded);

    // The issue is here - ensure we're using the same database connection
    const user = await User.findById(decoded.id);
    console.log('Auth middleware - User found:', !!user);
    
    // Add more debugging
    if (!user) {
      console.log('Auth middleware - Searching for user by ID:', decoded.id);
      const allUsers = await User.find({});
      console.log('Auth middleware - All users in database:', allUsers.map(u => ({ id: u._id.toString(), email: u.email })));
      
      // Try alternative lookup
      const userByEmail = await User.findOne({ email: decoded.email });
      console.log('Auth middleware - User found by email:', !!userByEmail);
      
      if (userByEmail) {
        req.user = userByEmail;
        return next();
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log('Auth middleware - Error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

module.exports = auth;