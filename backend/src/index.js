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

// Import database service
const databaseService = require('./services/databaseService');

// Import chat service
const chatService = require('./services/chatService');

// Import request logging middleware
const { requestLogger, errorLogger } = require('./middleware/requestLogger');

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
      'https://shaadi-mantrana.vercel.app', // Explicit new frontend URL
    ].filter(Boolean); // Remove empty strings
    
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
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
    'X-File-Name'
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
        "https://shaadi-mantrana.vercel.app"
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
// Debug routes - JWT debugging enabled in production for auth troubleshooting
let debugRoutes = null;
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_JWT_DEBUG === 'true') {
  debugRoutes = require('./routes/debugRoutes');
}

// API Routes with rate limiting
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
        console.warn('Could not get session stats:', error.message);
      }
    }
    
    res.status(200).json({ 
      status: 'OK', 
      message: 'Shaadi Mantrana Backend API is running',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      sessions: sessionStats,
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
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
  console.error(err.stack);
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
    // Connect to database first
    console.log('🔌 Initializing database connection...');
    await databaseService.connect();
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Database status: http://localhost:${PORT}/api/database/status`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database: ${databaseService.getConnectionStatus().name || 'Not connected'}`);
      console.log('✅ Server startup complete!');
    });

    // Initialize Socket.IO chat service
    chatService.initialize(server);
    console.log('💬 Socket.IO chat service initialized');

    // Setup periodic cleanup for chat data
    setInterval(() => {
      chatService.cleanup();
    }, 60 * 60 * 1000); // Run cleanup every hour
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('💥 Production startup failed - exiting');
      process.exit(1);
    } else {
      console.log('🔄 Starting server without database connection (development mode)');
      app.listen(PORT, () => {
        console.log(`🚀 Backend server running on port ${PORT} (DB disconnected)`);
        console.log(`📍 Health check: http://localhost:${PORT}/health`);
        console.log(`⚠️  Warning: Database not connected`);
      });
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  await databaseService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  await databaseService.disconnect();
  process.exit(0);
});

module.exports = app;
