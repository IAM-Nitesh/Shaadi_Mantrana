// Request Logger Middleware with UUID Tracking
// Logs all requests with user UUID for better monitoring

const crypto = require('crypto');
const { logger, loggerForUser } = require('../utils/pino-logger');
let promClient;
try {
  promClient = require('prom-client');
} catch (e) {
  promClient = null;
}

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
  // Reuse inbound IDs if provided (frontend correlation), else generate.
  const inboundRequestId = req.headers['x-request-id'];
  const requestId = (typeof inboundRequestId === 'string' && inboundRequestId.trim()) ? inboundRequestId.trim() : crypto.randomUUID();
  const inboundUserUuid = req.headers['x-user-uuid'];
  const derivedUserUuid = req.user?.userUuid || (typeof inboundUserUuid === 'string' && inboundUserUuid.trim()) || 'anonymous';
  const startTime = Date.now();

  req.requestId = requestId;
  req.userUuid = derivedUserUuid;

  const email = req.user?.email || 'none';
  const sanitizedEmail = sanitizeEmailForLog(email);

  req.log = loggerForUser(derivedUserUuid).child({ request_id: requestId, user_uuid: derivedUserUuid });

  // Always reflect IDs back so callers can confirm correlation
  res.set('X-Request-ID', requestId);
  if (derivedUserUuid !== 'anonymous') {
    res.set('X-User-UUID', derivedUserUuid);
  }
  
  // Get client IP
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req.connection?.remoteAddress ||
                   req.socket?.remoteAddress ||
                   '127.0.0.1';

  // Log request start with structured pino log
  req.log.info({
    event: 'request_start',
    request_id: requestId,
    user_uuid: derivedUserUuid,
    email: sanitizedEmail,
    method: req.method,
    url: req.originalUrl,
    client_ip: clientIP,
    user_agent: req.headers['user-agent'] || 'unknown',
    body: process.env.DEBUG_MODE === 'true' ? sanitizeRequestBody(req.body) : '[hidden]'
  }, 'REQUEST START');
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;

    // Log request completion with structured pino log
    req.log.info({
      event: 'request_end',
      request_id: requestId,
      user_uuid: derivedUserUuid,
      method: req.method,
      url: req.originalUrl,
      status_code: res.statusCode,
      duration_ms: duration,
      client_ip: clientIP
    }, 'REQUEST END');

    // Expose basic metrics if prom-client is available
    try {
      if (promClient && promClient.register) {
        const histogram = promClient.register.getSingleMetric('http_request_duration_seconds') || null;
        if (histogram && typeof histogram.observe === 'function') {
          // convert ms to seconds
          histogram.observe({ method: req.method, route: req.originalUrl || req.path, status: res.statusCode }, duration / 1000);
        }
      }
    } catch (e) {
      // ignore metrics errors
    }

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  const userUuid = req.user?.userUuid || req.userUuid || 'anonymous';
  const requestId = req.requestId || 'unknown';

  const { logger } = require('../utils/pino-logger');
  logger.error({
    event: 'uncaught_error',
    request_id: requestId,
    user_uuid: userUuid,
    email: req.user?.email || 'none',
    method: req.method,
    url: req.originalUrl,
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code
    }
  }, 'Unhandled error');

  next(err);
};

// Success operation logger
const logSuccess = (operation, details = {}) => {
  return (req, res, next) => {
    const userUuid = req.user?.userUuid || 'anonymous';
    const requestId = req.requestId || 'unknown';
    
    const { logger } = require('../utils/pino-logger');
  logger.info({ request_id: requestId, user_uuid: userUuid, email: req.user?.email || 'none', operation, ...details }, `SUCCESS: ${operation}`);
    
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
    
    const { logger } = require('../utils/pino-logger');
  logger.warn({ request_id: requestId, user_uuid: userUuid, email: req.user?.email || 'none', operation, clientIP, userAgent: req.headers['user-agent'] || 'unknown', timestamp: new Date().toISOString(), ...details }, `CRITICAL: ${operation}`);
    
    next();
  };
};

module.exports = {
  requestLogger,
  errorLogger,
  logSuccess,
  logCritical
};
