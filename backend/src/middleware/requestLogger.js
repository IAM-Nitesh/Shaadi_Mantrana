// Request Logger Middleware with UUID Tracking
// Logs all requests with user UUID for better monitoring

const crypto = require('crypto');

// Utility to sanitize email for logging
const sanitizeEmailForLog = (email) => {
  if (!email || email === 'none') return 'none';
  const parts = email.split('@');
  if (parts.length !== 2) return 'invalid';
  const username = parts[0];
  const domain = parts[1];
  return `${username.slice(0, 3)}***@${domain}`;
};

// Utility to sanitize request body for logging
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  
  // Sanitize sensitive fields
  if (sanitized.email) {
    sanitized.email = sanitizeEmailForLog(sanitized.email);
  }
  if (sanitized.password) {
    sanitized.password = '***';
  }
  if (sanitized.otp) {
    sanitized.otp = '***';
  }
  if (sanitized.token) {
    sanitized.token = '***';
  }
  
  return sanitized;
};

// Request tracking middleware
const requestLogger = (req, res, next) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  // Add request ID to request object
  req.requestId = requestId;
  
  // Extract user UUID if available
  const userUuid = req.user?.userUuid || 'anonymous';
  const email = req.user?.email || 'none';
  const sanitizedEmail = sanitizeEmailForLog(email);
  
  // Set response headers for tracking
  res.set('X-Request-ID', requestId);
  if (userUuid !== 'anonymous') {
    res.set('X-User-UUID', userUuid);
  }
  
  // Get client IP
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req.connection?.remoteAddress ||
                   req.socket?.remoteAddress ||
                   '127.0.0.1';
  
  // Log request start with sanitized data
  console.log(`🔄 [${new Date().toISOString()}] REQUEST START`, {
    requestId,
    userUuid,
    email: sanitizedEmail,
    method: req.method,
    url: req.originalUrl,
    clientIP,
    userAgent: req.headers['user-agent'] || 'unknown',
    body: process.env.DEBUG_MODE === 'true' ? sanitizeRequestBody(req.body) : '[hidden]'
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    // Log request completion with sanitized data
    console.log(`✅ [${new Date().toISOString()}] REQUEST END`, {
      requestId,
      userUuid,
      email: sanitizedEmail,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      clientIP
    });
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  const userUuid = req.user?.userUuid || 'anonymous';
  const requestId = req.requestId || 'unknown';
  
  console.error(`❌ [${new Date().toISOString()}] ERROR`, {
    requestId,
    userUuid,
    email: req.user?.email || 'none',
    method: req.method,
    url: req.originalUrl,
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code
    }
  });
  
  next(err);
};

// Success operation logger
const logSuccess = (operation, details = {}) => {
  return (req, res, next) => {
    const userUuid = req.user?.userUuid || 'anonymous';
    const requestId = req.requestId || 'unknown';
    
    console.log(`🎉 [${new Date().toISOString()}] SUCCESS: ${operation}`, {
      requestId,
      userUuid,
      email: req.user?.email || 'none',
      operation,
      ...details
    });
    
    next();
  };
};

// Critical operation logger (for security-sensitive operations)
const logCritical = (operation, details = {}) => {
  return (req, res, next) => {
    const userUuid = req.user?.userUuid || 'anonymous';
    const requestId = req.requestId || 'unknown';
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.connection?.remoteAddress ||
                     req.socket?.remoteAddress ||
                     '127.0.0.1';
    
    console.warn(`🚨 [${new Date().toISOString()}] CRITICAL: ${operation}`, {
      requestId,
      userUuid,
      email: req.user?.email || 'none',
      operation,
      clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date().toISOString(),
      ...details
    });
    
    next();
  };
};

module.exports = {
  requestLogger,
  errorLogger,
  logSuccess,
  logCritical
};
