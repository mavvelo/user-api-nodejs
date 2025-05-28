const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create write streams for different log files
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

// Custom Morgan format
const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

// Morgan middleware for access logs
const accessLogger = morgan(morganFormat, {
  stream: accessLogStream,
  skip: (req, res) => res.statusCode >= 400 // Only log successful requests to access.log
});

// Morgan middleware for error logs
const errorLogger = morgan(morganFormat, {
  stream: errorLogStream,
  skip: (req, res) => res.statusCode < 400 // Only log errors to error.log
});

// Console logger for development
const consoleLogger = morgan('combined');

// Simple logger utility
const logger = {
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] INFO: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    console.log(logMessage);
    
    if (process.env.NODE_ENV === 'production') {
      fs.appendFile(
        path.join(logsDir, 'app.log'),
        logMessage + '\n',
        (err) => { if (err) console.error('Logging error:', err); }
      );
    }
  },
  
  error: (message, error = {}) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message} ${error.stack || JSON.stringify(error)}`;
    console.error(logMessage);
    
    if (process.env.NODE_ENV === 'production') {
      fs.appendFile(
        path.join(logsDir, 'error.log'),
        logMessage + '\n',
        (err) => { if (err) console.error('Logging error:', err); }
      );
    }
  },
  
  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] WARN: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    console.warn(logMessage);
  }
};

module.exports = {
  accessLogger,
  errorLogger,
  consoleLogger,
  logger
};