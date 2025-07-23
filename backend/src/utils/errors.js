// Custom Error Classes for Production-Ready Error Handling
// Implements proper error hierarchy and structured error responses

class BaseError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends BaseError {
  constructor(message = 'Validation failed', field = null, value = null) {
    super(message, 400, true);
    this.field = field;
    this.value = value;
    this.type = 'VALIDATION_ERROR';
  }
}

class AuthenticationError extends BaseError {
  constructor(message = 'Authentication failed') {
    super(message, 401, true);
    this.type = 'AUTHENTICATION_ERROR';
  }
}

class AuthorizationError extends BaseError {
  constructor(message = 'Access denied') {
    super(message, 403, true);
    this.type = 'AUTHORIZATION_ERROR';
  }
}

class NotFoundError extends BaseError {
  constructor(message = 'Resource not found', resource = null) {
    super(message, 404, true);
    this.resource = resource;
    this.type = 'NOT_FOUND_ERROR';
  }
}

class ConflictError extends BaseError {
  constructor(message = 'Resource conflict', field = null) {
    super(message, 409, true);
    this.field = field;
    this.type = 'CONFLICT_ERROR';
  }
}

class RateLimitError extends BaseError {
  constructor(message = 'Too many requests', retryAfter = null) {
    super(message, 429, true);
    this.retryAfter = retryAfter;
    this.type = 'RATE_LIMIT_ERROR';
  }
}

class InternalServerError extends BaseError {
  constructor(message = 'Internal server error') {
    super(message, 500, false);
    this.type = 'INTERNAL_SERVER_ERROR';
  }
}

class DatabaseError extends BaseError {
  constructor(message = 'Database operation failed', operation = null) {
    super(message, 500, false);
    this.operation = operation;
    this.type = 'DATABASE_ERROR';
  }
}

class ExternalServiceError extends BaseError {
  constructor(message = 'External service error', service = null) {
    super(message, 502, true);
    this.service = service;
    this.type = 'EXTERNAL_SERVICE_ERROR';
  }
}

// Error response formatter
const formatErrorResponse = (error, req) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const userUuid = req.user?.userUuid || 'anonymous';
  const requestId = req.requestId || 'unknown';
  
  const baseResponse = {
    success: false,
    error: {
      type: error.type || 'UNKNOWN_ERROR',
      message: error.message,
      statusCode: error.statusCode || 500,
      timestamp: error.timestamp || new Date().toISOString(),
      requestId,
      userUuid
    }
  };
  
  // Add specific error fields
  if (error.field) baseResponse.error.field = error.field;
  if (error.resource) baseResponse.error.resource = error.resource;
  if (error.retryAfter) baseResponse.error.retryAfter = error.retryAfter;
  if (error.service) baseResponse.error.service = error.service;
  
  // Add stack trace in development
  if (!isProduction && error.stack) {
    baseResponse.error.stack = error.stack;
  }
  
  return baseResponse;
};

// Error logger
const logError = (error, req = {}) => {
  const userUuid = req.user?.userUuid || 'anonymous';
  const requestId = req.requestId || 'unknown';
  
  const logData = {
    error: {
      name: error.name,
      message: error.message,
      type: error.type,
      statusCode: error.statusCode,
      stack: error.stack
    },
    request: {
      id: requestId,
      method: req.method,
      url: req.originalUrl,
      userUuid,
      userAgent: req.headers?.['user-agent'],
      ip: req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress
    },
    timestamp: new Date().toISOString()
  };
  
  if (error.isOperational) {
    console.warn('⚠️ Operational Error:', JSON.stringify(logData, null, 2));
  } else {
    console.error('🚨 System Error:', JSON.stringify(logData, null, 2));
  }
};

module.exports = {
  BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  DatabaseError,
  ExternalServiceError,
  formatErrorResponse,
  logError
};
