module.exports = {
  // Environment configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5001,
  
  // Frontend URL for CORS (support both ports)
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
  FRONTEND_FALLBACK_URL: 'http://localhost:3000',
  
  // Database configuration (for future use)
  DATABASE: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: process.env.DB_PORT || 27017,
    NAME: process.env.DB_NAME || 'shaadimantra',
    URL: process.env.DATABASE_URL || `mongodb://localhost:27017/shaadimantra`
  },
  
  // Email configuration
  EMAIL: {
    ENABLED: process.env.ENABLE_EMAIL === 'true',
    SERVICE: process.env.EMAIL_SERVICE || 'gmail',
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT || 587,
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM || process.env.SMTP_USER,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'Shaadi Mantra'
  },
  
  // JWT configuration (for future use)
  JWT: {
    SECRET: process.env.JWT_SECRET || 'your-secret-key',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // API configuration
  API: {
    BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000',
    VERSION: 'v1'
  },
  
  // Feature flags
  FEATURES: {
    USE_STATIC_DEMO: process.env.USE_STATIC_DEMO === 'true' || !process.env.DATABASE_URL,
    ENABLE_EMAIL: process.env.ENABLE_EMAIL === 'true',
    ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false'
  }
};
