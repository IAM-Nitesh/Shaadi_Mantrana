const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import configuration (centralized env handling)
const config = require('./config');

// Import database service and enhanced connection
const databaseService = require('./services/databaseService');
const enhancedDatabaseService = require('./services/enhanced-database-service');

// Import chat service
const chatService = require('./services/chatService');

// Import request logging middleware
const { requestLogger, errorLogger } = require('./middleware/requestLogger');

// Central logger instance (single import to avoid redeclaration)
const { logger } = require('./utils/pino-logger');

const app = express();
// Use centralized config for PORT to keep defaults consistent
const PORT = config.PORT || process.env.PORT || 5001;

// Trust proxy for rate limiting behind reverse proxies (like Render)
app.set('trust proxy', 1);

// IMPROVED CORS configuration for specific domain
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      config.FRONTEND_URL, // Production frontend from config
      config.FRONTEND_FALLBACK_URL, // Fallback frontend URL
      'http://localhost:3000', // Local development
      'http://localhost:3001', // Alternative local port
      'http://127.0.0.1:3000', // IPv4 localhost
      'http://127.0.0.1:3001', // IPv4 localhost alt port
      'http://[::1]:3000', // IPv6 localhost
      'http://[::1]:3001', // IPv6 localhost alt port
      'https://shaadi-mantrana.vercel.app', // Vercel deployment
      'https://www.shaadimantrana.app', // Production domain
      'https://shaadimantrana.app', // Production domain without www
      'https://www.shaadimantrana.live', // Live domain
      'https://shaadimantrana.live', // Live domain without www
    ].filter(Boolean); // Remove empty strings
    
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn({ origin, allowedOrigins }, 'CORS blocked origin');
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name',
    'x-request-id',
    'x-admin-request',
    'Expires',
    'Pragma',
    'X-User-UUID'
  ],
  exposedHeaders: [
    'Content-Length',
    'X-Requested-With',
    'X-Total-Count'
  ]
};

// Apply CORS middleware BEFORE helmet
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests explicitly
app.options('*', cors(corsOptions));

// Enhanced Security middleware - Helmet with comprehensive security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'", 
        config.FRONTEND_URL,
        config.FRONTEND_FALLBACK_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://shaadi-mantrana.vercel.app",
        "https://www.shaadimantrana.app",
        "https://shaadimantrana.app",
        "https://www.shaadimantrana.live",
        "https://shaadimantrana.live"
      ].filter(Boolean), // Remove empty strings
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    },
  },
  // Enhanced security policies
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  // Additional security headers
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  permissionsPolicy: {
    features: {
      geolocation: [],
      microphone: [],
      camera: [],
      payment: [],
      usb: [],
      magnetometer: [],
      gyroscope: [],
      accelerometer: []
    }
  }
}));

// Additional security headers
app.use((req, res, next) => {
  res.set('X-Permitted-Cross-Domain-Policies', 'none');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  next();
});

// Add environment info to response headers for debugging
app.use((req, res, next) => {
  res.set('X-Environment', config.NODE_ENV);
  res.set('X-Is-Production', config.isProduction.toString());
  next();
});

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More lenient in development
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  }
});
app.use('/api/', limiter);

// Auth-specific rate limiting (moderate)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 30 : 100, // More lenient in development
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again in 15 minutes'
  }
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging middleware (before routes)
app.use(requestLogger);

// Metrics - expose Prometheus metrics if prom-client is installed
  try {
    const { promClient } = require('./utils/metrics');
    if (promClient) {
    app.get('/metrics', async (req, res) => {
      try {
        res.set('Content-Type', promClient.register.contentType);
        res.end(await promClient.register.metrics());
      } catch (err) {
        res.status(500).send('Error collecting metrics');
      }
    });
  }
  } catch (e) {
  // ignore if prom-client not installed
}

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Import routes
const authRoutes = require('./routes/authRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const profileRoutes = require('./routes/profileRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const matchRoutes = require('./routes/matchRoutes');
const matchingRoutes = require('./routes/matchingRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const chatRoutes = require('./routes/chatRoutes');
const healthRoutes = require('./routes/health'); // Enhanced health monitoring
// Debug routes - JWT debugging enabled in production for auth troubleshooting
let debugRoutes = null;
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_JWT_DEBUG === 'true') {
  debugRoutes = require('./routes/debugRoutes');
}

// API Routes with rate limiting
app.use('/health', healthRoutes); // Enhanced health monitoring endpoints
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/chat', chatRoutes);
if (debugRoutes) {
  app.use('/api/debug', debugRoutes);
}

// Internal logging ping route (non-production exposure is allowed by default; in prod require token)
app.get('/internal/log-ping', (req, res) => {
  const token = req.headers['x-internal-token'];
  const required = process.env.INTERNAL_LOG_PING_TOKEN;
  if (required) {
    if (!token || token !== required) {
      logger.warn({ event: 'log_ping_unauthorized', ip: req.ip }, 'Unauthorized log ping attempt');
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
  }
  const pingId = require('crypto').randomUUID();
  logger.info({ event: 'log_ping', ping_id: pingId, ts: new Date().toISOString() }, 'LOG PING');
  res.json({ ok: true, ping_id: pingId });
});

// Client log forwarding endpoint - forwards browser/app logs to server logger (rate-limited)
const expressRateLimit = require('express-rate-limit');

const clientLogLimiter = expressRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 60 : 600,
  message: { error: 'Too many log requests' }
});

app.post('/api/logs', clientLogLimiter, (req, res) => {
  try {
    const apiKey = req.headers['x-client-log-key'] || req.query.key;
    const expectedKey = process.env.LOKI_CLIENT_API_KEY;
    if (!expectedKey || apiKey !== expectedKey) {
      logger.warn({ event: 'client_log_unauthorized', ip: req.ip, headers: req.headers }, 'Unauthorized client log attempt');
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Handle both single log and batch logs (array)
    let logs = Array.isArray(req.body) ? req.body : [req.body || {}];
    
    // Process each log entry
    for (const payload of logs) {
      // Extract user UUID when provided by client (prefer header, fallback to payload)
      const clientUserUuid = req.headers['x-user-uuid'] || payload.user_uuid || payload.userUuid || 'anonymous';
      const clientType = payload.client_type || 'web';
      const platform = payload.platform || 'unknown';
      
      // Sanitize sensitive fields
      const sanitizeField = (obj, field, mask = '***') => {
        if (obj && obj[field]) {
          if (field === 'email' && typeof obj[field] === 'string') {
            obj[field] = obj[field].replace(/(.{3})(.*)(@.*)/, '$1***$3');
          } else if (field === 'phone' && typeof obj[field] === 'string') {
            obj[field] = obj[field].replace(/(\d{3})(\d+)(\d{2})/, '$1***$3');
          } else {
            obj[field] = mask;
          }
        }
      };

      // Sanitize top-level sensitive fields
      const sensitiveFields = ['email', 'otp', 'phone', 'password', 'token', 'auth', 'authorization', 
                              'api_key', 'apiKey', 'access_token', 'refresh_token', 'secret', 'ssn', 
                              'card_number', 'cvv', 'credit_card', 'cardNumber', 'birthdate'];
      
      sensitiveFields.forEach(field => sanitizeField(payload, field));
      
      // Sanitize sensitive fields in payload.data if present
      if (payload.data && typeof payload.data === 'object') {
        sensitiveFields.forEach(field => sanitizeField(payload.data, field));
      }
      
      // Sanitize sensitive headers
      if (req.headers.authorization) {
        req.headers.authorization = '***';
      }
      if (req.headers['x-api-key']) {
        req.headers['x-api-key'] = '***';
      }
      
      // Create logger specific to this user
      const userLogger = logger.child({ 
        user_uuid: clientUserUuid, 
        client_type: clientType, 
        platform: platform 
      });
      
      // Get log level from payload or default to info
      const level = (payload.level || 'info').toLowerCase();
      
      // Generate log message
      const logMessage = payload.message || 'Client log';
      
      // Log with appropriate level
      if (level === 'error') {
        userLogger.error(
          { event: 'client_log', ...payload, ip: req.ip, ua: req.headers['user-agent'] }, 
          `CLIENT ERROR: ${logMessage}`
        );
      } else if (level === 'warn') {
        userLogger.warn(
          { event: 'client_log', ...payload, ip: req.ip, ua: req.headers['user-agent'] }, 
          `CLIENT WARN: ${logMessage}`
        );
      } else if (level === 'debug') {
        userLogger.debug(
          { event: 'client_log', ...payload, ip: req.ip, ua: req.headers['user-agent'] }, 
          `CLIENT DEBUG: ${logMessage}`
        );
      } else {
        userLogger.info(
          { event: 'client_log', ...payload, ip: req.ip, ua: req.headers['user-agent'] }, 
          `CLIENT INFO: ${logMessage}`
        );
      }
    }
    
    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error({ event: 'client_log_error', error: err && err.message }, 'Client log forwarding failed');
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await databaseService.healthCheck();
    const dbStats = await databaseService.getStats();
    
    // Get session statistics if available
    let sessionStats = null;
    if (config.DATA_SOURCE === 'mongodb' && config.DATABASE.URI) {
      try {
        const sessionCleanupService = require('./services/sessionCleanupService');
          sessionStats = await sessionCleanupService.getSessionStats();
        } catch (error) {
        logger.warn({ err: error && error.message }, 'Could not get session stats');
        }
    }
    
    // Get email service health with a short timeout so /health stays responsive
    let emailHealth = { status: 'unknown' };
    try {
      const emailService = require('./services/emailService');
      const emailHealthTimeout = (config && config.EMAIL && config.EMAIL.MASTER_TIMEOUT_MS) || 2000;
      emailHealth = await Promise.race([
        emailService.testService(),
        new Promise((resolve) => setTimeout(() => resolve({ success: false, message: 'email health check timeout' }), emailHealthTimeout))
      ]);
    } catch (error) {
    logger.warn({ err: error && error.message }, 'Could not get email service health');
      emailHealth = { status: 'unknown', error: error.message };
    }
    
    const responsePayload = {
      status: 'OK',
      message: 'Shaadi Mantrana Backend API is running',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      sessions: sessionStats,
      email: emailHealth,
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    };

    try {
      logger.info({
        event: 'health_check',
        source: req.get('X-Ping-Token') ? 'keepalive' : 'user',
        database_status: dbHealth && dbHealth.status,
        email_status: (emailHealth && (emailHealth.status || (emailHealth.success === false ? 'fail' : 'unknown'))) || 'unknown',
        sessions_present: !!sessionStats
      }, 'Health check');
    } catch (logErr) {}

    res.status(200).json(responsePayload);
  } catch (error) {
    res.status(503).json({
      status: 'Service Unavailable',
      message: 'Database connection issue',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Database status endpoint
app.get('/api/database/status', async (req, res) => {
  try {
    const status = databaseService.getConnectionStatus();
    const health = await databaseService.healthCheck();
    const stats = await databaseService.getStats();
    
    res.status(200).json({
      success: true,
      connection: status,
      health: health,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use(errorLogger); // Log errors with UUID tracking
app.use((err, req, res, next) => {
  logger.error({ stack: err && err.stack }, 'Unhandled exception in request');
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.originalUrl 
  });
});

// Start server with database connection
async function startServer() {
  try {
    // Connect to database first with enhanced Atlas support
    logger.info('Initializing enhanced database connection');
    
    // Try enhanced connection first for Atlas
    let dbConnected = false;
    try {
      const enhancedSuccess = await enhancedDatabaseService.connect();
      if (enhancedSuccess) {
        logger.info('Enhanced Atlas connection established');
        dbConnected = true;
      }
    } catch (enhancedError) {
      logger.warn({ err: enhancedError.message }, 'Enhanced connection failed, trying standard connection');
    }
    
    // Fallback to standard connection if enhanced failed
    if (!dbConnected) {
      try {
        await databaseService.connect();
        logger.info('Standard database connection established');
        dbConnected = true;
      } catch (standardError) {
        logger.error({ 
          err: standardError.message, 
          error: standardError 
        }, 'Standard database connection failed');
        throw standardError;
      }
    }
    
    // Start the server
    const server = app.listen(PORT, () => {
  logger.info({ port: PORT, health: `/health` }, 'Backend server running');
    });

    // Initialize Socket.IO chat service
    chatService.initialize(server);
  logger.info('Socket.IO chat service initialized');

    // Setup periodic cleanup for chat data
    setInterval(() => {
      chatService.cleanup();
    }, 60 * 60 * 1000); // Run cleanup every hour
    
    // Start session management services
    try {
      // Import session services
      const sessionCleanupService = require('./services/sessionCleanupService');
      const sessionCacheWarmer = require('./services/sessionCacheWarmerService');
      
      // Start session cleanup service
      sessionCleanupService.start();
      logger.info('Session cleanup service started');
      
      // Start session cache warmer service
      sessionCacheWarmer.start();
      logger.info('Session cache warmer service started');
    } catch (serviceError) {
      logger.error({ err: serviceError }, 'Failed to start session management services');
    }
    
  } catch (error) {
  logger.error({ err: error && error.message }, 'Failed to start server');
    
    if (process.env.NODE_ENV === 'production') {
  logger.error('Production startup failed - exiting');
      process.exit(1);
    } else {
  logger.warn('Starting server without database connection (development mode)');
      app.listen(PORT, () => {
  logger.info({ port: PORT, db_connected: false }, 'Backend server running (DB disconnected)');
      });
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.warn('SIGTERM received, shutting down gracefully');
  await databaseService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.warn('SIGINT received, shutting down gracefully');
  await databaseService.disconnect();
  process.exit(0);
});

module.exports = app;
