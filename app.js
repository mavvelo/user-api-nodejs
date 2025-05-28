const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { specs, swaggerUi, swaggerOptions } = require('./config/swagger');
const { accessLogger, errorLogger, consoleLogger } = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { globalErrorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://www.yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Rate limiting
app.use('/api/', apiLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(consoleLogger);
} else {
  app.use(accessLogger);
  app.use(errorLogger);
}

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User API v1.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users'
    }
  });
});

// Handle undefined routes
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: {
      api: '/api',
      auth: '/api/auth',
      users: '/api/users',
      docs: '/api-docs',
      health: '/health'
    }
  });
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;