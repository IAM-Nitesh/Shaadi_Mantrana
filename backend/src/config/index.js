// Load environment variables based on NODE_ENV
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});

// Fallback to .env if environment-specific file doesn't exist
require('dotenv').config();

// Environment-based MongoDB connection string selection
const getDataSource = () => {
  return process.env.DATA_SOURCE || 'static'; // Default to static for development
};

const getPort = () => {
  const dataSource = getDataSource();
  if (dataSource === 'static') {
    return process.env.PORT_STATIC || process.env.PORT || 4500;
  } else if (dataSource === 'mongodb') {
    return process.env.PORT_MONGODB || process.env.PORT || 5500;
  }
  return process.env.PORT || 4500;
};

const getMongoDBURI = () => {
  const dataSource = getDataSource();
  
  // If data source is static, return null to use mock controllers
  if (dataSource === 'static') {
    return null;
  }
  
  const environment = process.env.NODE_ENV || 'development';
  
  // Development MongoDB URI (provided with updated credentials)
  const DEV_MONGODB_URI = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
  
  switch (environment) {
    case 'development':
    case 'dev':
    case 'local':
      return process.env.MONGODB_URI || DEV_MONGODB_URI;
    
    case 'production':
    case 'prod':
      // Use production MongoDB URI from environment
      return process.env.MONGODB_URI || process.env.MONGODB_PRODUCTION_URI;
    
    case 'test':
      return process.env.MONGODB_TEST_URI || DEV_MONGODB_URI;
    
    default:
      return DEV_MONGODB_URI;
  }
};

module.exports = {
  // Environment configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: getPort(),
  
  // Data source configuration
  DATA_SOURCE: getDataSource(),
  
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
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
  FRONTEND_FALLBACK_URL: process.env.FRONTEND_FALLBACK_URL || 'http://localhost:3000',
  
  // JWT configuration with strong defaults
  JWT: {
    SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-key-2024-shaadi-mantra',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    ALGORITHM: 'HS256',
    ISSUER: 'shaadi-mantra-api',
    AUDIENCE: 'shaadi-mantra-app'
  },
  
  // Legacy JWT config for backward compatibility
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-key-2024-shaadi-mantra',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Email configuration
  EMAIL: {
    SERVICE: process.env.EMAIL_SERVICE || 'gmail',
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SMTP_USER: process.env.SMTP_USER || process.env.EMAIL_FROM,
    SMTP_PASS: process.env.SMTP_PASS,
    FROM_EMAIL: process.env.EMAIL_FROM || 'shaadimantra.help@gmail.com',
    FROM_NAME: process.env.EMAIL_FROM_NAME || 'Shaadi Mantra Support',
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
    BASE_URL: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5001}`,
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
  
  // Feature flags based on environment and data source
  FEATURES: {
    USE_STATIC_DEMO: getDataSource() === 'static',
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
      ? [process.env.FRONTEND_URL]
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']
  },
  
  // Environment info for debugging
  ENVIRONMENT_INFO: {
    environment: process.env.NODE_ENV || 'development',
    dataSource: getDataSource(),
    mongodbUri: getMongoDBURI() ? getMongoDBURI().replace(/:[^:@]*@/, ':***@') : 'Static/Mock Mode',
    port: getPort(),
    debugMode: process.env.DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development'
  }
};
