// Load environment variables based on NODE_ENV
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});

// Fallback to .env if environment-specific file doesn't exist
require('dotenv').config();

// MongoDB connection string selection
const getPort = () => {
  return process.env.PORT || 5500;
};

const getMongoDBURI = () => {
  const environment = process.env.NODE_ENV || 'development';
  
  // Prefer explicit environment variables for all URIs.
  // Do NOT embed credentials in source. Set any of the following in your
  // environment or in `.env.development` for local development:
  // - MONGODB_URI (primary)
  // - DEV_MONGODB_URI (development fallback)
  // - MONGODB_PRODUCTION_URI (production fallback)
  // - MONGODB_TEST_URI (test fallback)

  const primary = process.env.MONGODB_URI;
  const devFallback = process.env.DEV_MONGODB_URI;
  const prodFallback = process.env.MONGODB_PRODUCTION_URI;
  const testFallback = process.env.MONGODB_TEST_URI;

  switch (environment) {
    case 'development':
    case 'dev':
    case 'local':
      return primary || devFallback || null;

    case 'production':
    case 'prod':
      return primary || prodFallback || null;

    case 'test':
      return testFallback || devFallback || primary || null;

    default:
      return primary || devFallback || null;
  }
};

module.exports = {
  // Environment configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: getPort(),
  
  // Data source configuration (MongoDB only)
  DATA_SOURCE: 'mongodb',
  
  // Database configuration with environment-based selection
  DATABASE: {
    URI: getMongoDBURI(),
    NAME: process.env.DATABASE_NAME || (process.env.NODE_ENV === 'production' ? 'shaadimantra' : 'shaadimantra_dev'),
    OPTIONS: {
      retryWrites: true,
      w: 'majority',
      maxPoolSize: process.env.NODE_ENV === 'production' ? 10 : 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // Legacy database config for backward compatibility
  DATABASE_URL: getMongoDBURI(),
  
  // Frontend URL for CORS (support multiple environments)
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://shaadi-mantrana-app-frontend.vercel.app',
  FRONTEND_FALLBACK_URL: process.env.FRONTEND_FALLBACK_URL || 'https://shaadi-mantrana-app-frontend.vercel.app',
  
  // JWT configuration with strong defaults
  JWT: {
    // Do not ship secrets in code. Provide JWT_SECRET in environment.
    SECRET: process.env.JWT_SECRET || '',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    ALGORITHM: 'HS256',
    ISSUER: 'shaadi-mantra-api',
    AUDIENCE: 'shaadi-mantra-app'
  },

  // Legacy JWT config for backward compatibility (prefer env variable)
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Email configuration
  EMAIL: {
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: process.env.SMTP_PORT || 587,
    // Do not hard-code credentials in source. Set these in your environment.
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    FROM_EMAIL: process.env.EMAIL_FROM || process.env.SMTP_USER || '',
    FROM_NAME: process.env.EMAIL_FROM_NAME || 'Shaadi Mantrana Support',
    ENABLED: process.env.ENABLE_EMAIL === 'true'
  },
  
  // File upload configuration
  UPLOAD: {
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'],
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
    MAX_FILES_PER_USER: 5
  },
  


  
  // API configuration
  API: {
    BASE_URL: process.env.API_BASE_URL || (process.env.NODE_ENV === 'production' 
      ? 'https://shaadi-mantrana.onrender.com'
      : `http://localhost:${process.env.PORT || 5500}`),
    VERSION: 'v1',
    RATE_LIMIT: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: process.env.NODE_ENV === 'production' ? 100 : 1000,
      // OTP-specific rate limits
      OTP_DAILY_LIMIT: parseInt(process.env.OTP_DAILY_LIMIT) || (process.env.NODE_ENV === 'production' ? 20 : 50),
      OTP_SHORT_TERM_LIMIT: parseInt(process.env.OTP_SHORT_TERM_LIMIT) || (process.env.NODE_ENV === 'production' ? 10 : 20),
      OTP_VERIFY_LIMIT: parseInt(process.env.OTP_VERIFY_LIMIT) || (process.env.NODE_ENV === 'production' ? 15 : 30)
    }
  },
  
  // Feature flags based on environment
  FEATURES: {
    ENABLE_EMAIL: process.env.ENABLE_EMAIL === 'true' && process.env.SMTP_HOST,
    ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false',
    DEBUG_MODE: process.env.DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development',
    ENABLE_CORS: true,
    ENABLE_HELMET: process.env.NODE_ENV === 'production'
  },
  
  // Security configuration
  SECURITY: {
    BCRYPT_ROUNDS: process.env.NODE_ENV === 'production' ? 12 : 8,
    SESSION_SECRET: process.env.SESSION_SECRET || 'dev-session-secret',
    CORS_ORIGINS: process.env.NODE_ENV === 'production' 
      ? ['https://shaadi-mantrana-app-frontend.vercel.app']
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']
  },
  
  // Environment info for debugging
  ENVIRONMENT_INFO: {
    environment: process.env.NODE_ENV || 'development',
    dataSource: 'mongodb',
    mongodbUri: getMongoDBURI() ? getMongoDBURI().replace(/:[^:@]*@/, ':***@') : 'MongoDB URI not configured',
    port: getPort(),
    debugMode: process.env.DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development'
  }
};
