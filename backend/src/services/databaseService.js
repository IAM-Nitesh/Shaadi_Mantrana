// MongoDB Database Service with Atlas Integration
// Handles connection to MongoDB Atlas and local MongoDB for dev and production environments

const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');
const config = require('../config');
const DatabaseConnectivityChecker = require('../utils/database-connectivity-checker');
const connectionPoolManager = require('./connection-pool-manager');
const enhancedDatabaseService = require('./enhanced-database-service');

class DatabaseService {
  constructor() {
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
    this.mongoClient = null; // Native MongoDB client
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.healthCheckInterval = null;
  }

  // Get MongoDB connection string based on environment (using new config)
  getConnectionString() {
    // Use the environment-based URI from config
    return config.DATABASE.URI;
  }

  // Get connection options based on environment
  getConnectionOptions() {
    const connectionString = this.getConnectionString();
    
    // Return empty options if no connection string (MongoDB not configured)
    if (!connectionString) {
      return {};
    }
    
    const isAtlas = connectionString.includes('mongodb+srv://');
    
    // Use options from config with Atlas detection
    const baseOptions = {
      ...config.DATABASE.OPTIONS,
      bufferCommands: false, // Disable mongoose buffering
    };

    // MongoDB Atlas specific options with enhanced resilience
    if (isAtlas) {
      return {
        ...baseOptions,
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        retryWrites: true,
        w: 'majority',
        // Enhanced Atlas connection options for better resilience
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 30000, // Increased timeout
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        heartbeatFrequencyMS: 10000,
        maxIdleTimeMS: 30000,
        waitQueueTimeoutMS: 10000,
        // Network resilience options
        family: 4, // Force IPv4 to avoid dual-stack issues
        directConnection: false,
        maxConnecting: 2,
      };
    }

    // Production-specific options (non-Atlas)
    if (config.NODE_ENV === 'production') {
      return {
        ...baseOptions,
        maxPoolSize: 50, // Higher pool size for production
        retryWrites: true,
        w: 'majority',
        readPreference: 'primaryPreferred',
        connectTimeoutMS: 30000,
        heartbeatFrequencyMS: 30000,
      };
    }

    // Development-specific options
    return {
      ...baseOptions,
      maxPoolSize: 5,
      connectTimeoutMS: 10000,
    };
  }

  // Connect to MongoDB with Atlas integration
  async connect() {
    try {
      if (this.isConnected) {
        console.log('📊 Already connected to MongoDB');
        return;
      }

      const connectionString = this.getConnectionString();
      
          // Skip connection if no connection string (MongoDB not configured)
    if (!connectionString) {
      console.log('📊 No database connection string configured');
      this.isConnected = false; // Mark as not connected
        return;
      }
      
      const options = this.getConnectionOptions();
      const isAtlas = connectionString.includes('mongodb+srv://');

      console.log(`🔌 Connecting to MongoDB ${isAtlas ? 'Atlas' : 'Local'} (${config.NODE_ENV})...`);
      
      // Hide sensitive parts of connection string in logs
      const safeConnectionString = connectionString.replace(
        /:\/\/([^:]+):([^@]+)@/,
        '://***:***@'
      );
      console.log(`📍 Connection: ${safeConnectionString}`);

      // Connect with Mongoose
      await mongoose.connect(connectionString, options);
      console.log('Mongoose connected to DB:', mongoose.connection.name);
      
      // Initialize connection pool manager
      try {
        await connectionPoolManager.initialize();
        console.log('✅ Connection pool manager started');
      } catch (initError) {
        console.error('❌ Connection pool manager initialization failed:', {
          error: initError.message,
          details: initError
        });
        // Clean up any allocated resources before rethrowing
        try {
          await mongoose.disconnect();
        } catch (disconnectError) {
          console.error('❌ Failed to disconnect during cleanup:', disconnectError.message);
        }
        throw initError;
      }

      // For MongoDB Atlas, also test with native client and ping
      if (isAtlas) {
        try {
          console.log('🧪 Testing Atlas connection with native client...');
          
          // Create native MongoDB client for Atlas
          this.mongoClient = new MongoClient(connectionString, {
            serverApi: {
              version: ServerApiVersion.v1,
              strict: true,
              deprecationErrors: true,
            }
          });

          // Connect and ping to confirm connection
          await this.mongoClient.connect();
          await this.mongoClient.db("admin").command({ ping: 1 });
          console.log("✅ Atlas ping successful - deployment connected!");
          
          // Keep the client connected for future use
        } catch (atlasError) {
          console.log('⚠️ Atlas native client test failed, but Mongoose connected successfully');
          console.log('Atlas error:', atlasError.message);
        }
      }

      this.isConnected = true;
      this.connectionRetries = 0;
      
      console.log('✅ Connected to MongoDB successfully');
      console.log(`📦 Database: ${mongoose.connection.name}`);
      console.log(`🏷️  Environment: ${config.NODE_ENV}`);

      // Set up connection event handlers
      this.setupEventHandlers();

    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      
      // Run connectivity diagnostic if connection fails
      const connectionString = this.getConnectionString();
      if (connectionString && error.message.includes('ENOTFOUND')) {
        console.log('\n🔍 Running connectivity diagnostic...');
        try {
          const checker = new DatabaseConnectivityChecker(connectionString);
          await checker.runFullCheck();
        } catch (diagError) {
          console.error('❌ Diagnostic failed:', diagError.message);
        }
      }
      
      // Retry logic for production
      if (config.NODE_ENV === 'production' && this.connectionRetries < this.maxRetries) {
        this.connectionRetries++;
        console.log(`🔄 Retrying connection (${this.connectionRetries}/${this.maxRetries}) in ${this.retryDelay/1000}s...`);
        
        setTimeout(() => {
          this.connect();
        }, this.retryDelay);
        
        return;
      }

      // If not in production or max retries reached, throw error
      throw new Error(`Failed to connect to MongoDB: ${error.message}`);
    }
  }

  // Set up connection event handlers with improved reconnection logic
  setupEventHandlers() {
    const connection = mongoose.connection;

    connection.on('connected', () => {
      console.log('📊 Mongoose connected to MongoDB');
      this.isConnected = true;
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      this.startHealthCheck();
    });

    connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err.message);
      this.isConnected = false;
      
      // Handle specific error types
      if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
        console.log('🌐 DNS resolution error - will attempt reconnection');
      }
    });

    connection.on('disconnected', () => {
      console.log('📊 Mongoose disconnected from MongoDB');
      this.isConnected = false;
      this.stopHealthCheck();
      
      // Enhanced auto-reconnect logic
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const backoffDelay = Math.min(this.retryDelay * Math.pow(2, this.reconnectAttempts - 1), 60000);
        console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${backoffDelay/1000}s...`);
        
        setTimeout(() => {
          this.connect().catch(err => {
            console.error('❌ Reconnection failed:', err.message);
          });
        }, backoffDelay);
      } else {
        console.error('❌ Max reconnection attempts reached');
      }
    });

    connection.on('reconnected', () => {
      console.log('✅ Mongoose reconnected to MongoDB');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });
  }

  // Start periodic health checks
  startHealthCheck() {
    if (this.healthCheckInterval) return;
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        if (this.isConnected) {
          // Verify connection objects exist before calling ping
          if (!mongoose.connection || !mongoose.connection.db || typeof mongoose.connection.db.admin !== 'function') {
            console.error('❌ Database health check failed: connection objects missing');
            this.isConnected = false;
            return;
          }
          
          await mongoose.connection.db.admin().ping();
          // console.log('💓 Database health check passed');
        }
      } catch (error) {
        console.error('❌ Database health check failed:', error.message);
        this.isConnected = false;
      }
    }, 30000); // Check every 30 seconds
  }

  // Stop health checks
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Disconnect from MongoDB (both Mongoose and native client)
  async disconnect() {
    try {
      this.stopHealthCheck();
      
      // Cleanup connection pool manager
      connectionPoolManager.cleanup();
      
      if (!this.isConnected) {
        console.log('📊 Already disconnected from MongoDB');
        return;
      }

      // Close native MongoDB client if it exists
      if (this.mongoClient) {
        await this.mongoClient.close();
        console.log('✅ Native MongoDB client disconnected');
        this.mongoClient = null;
      }

      // Close Mongoose connection
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('✅ Mongoose disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error.message);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      environment: config.NODE_ENV
    };
  }

  // Get native MongoDB client for direct operations
  getNativeClient() {
    return this.mongoClient;
  }

  // Get database instance from native client
  getDatabase(dbName = null) {
    if (!this.mongoClient) {
      throw new Error('Native MongoDB client not available');
    }
  // Prefer explicit dbName, otherwise use configured database name or mongoose connection name
  const name = dbName || (config && config.DATABASE && config.DATABASE.NAME) || mongoose.connection.name || 'test';
  return this.mongoClient.db(name);
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', error: 'Not connected to database' };
      }

      // Try a simple ping operation
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'healthy',
        database: mongoose.connection.name,
        environment: config.NODE_ENV,
        uptime: process.uptime()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        database: mongoose.connection.name
      };
    }
  }

  // Get database statistics
  async getStats() {
    try {
      if (!this.isConnected) {
        return { error: 'Not connected to database' };
      }

      const stats = await mongoose.connection.db.stats();
      
      return {
        database: mongoose.connection.name,
        collections: stats.collections,
        dataSize: this.formatBytes(stats.dataSize),
        storageSize: this.formatBytes(stats.storageSize),
        indexSize: this.formatBytes(stats.indexSize),
        objects: stats.objects,
        environment: config.NODE_ENV
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Helper function to format bytes
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

module.exports = databaseService;
