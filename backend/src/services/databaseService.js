// MongoDB Database Service with Atlas Integration
// Handles connection to MongoDB Atlas and local MongoDB for dev and production environments

const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');
const config = require('../config');

class DatabaseService {
  constructor() {
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
    this.mongoClient = null; // Native MongoDB client
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

    // MongoDB Atlas specific options
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

  // Set up connection event handlers
  setupEventHandlers() {
    const connection = mongoose.connection;

    connection.on('connected', () => {
      console.log('📊 Mongoose connected to MongoDB');
    });

    connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
      this.isConnected = false;
    });

    connection.on('disconnected', () => {
      console.log('📊 Mongoose disconnected from MongoDB');
      this.isConnected = false;
      
      // Auto-reconnect in production
      if (config.NODE_ENV === 'production') {
        console.log('🔄 Attempting to reconnect...');
        setTimeout(() => {
          this.connect();
        }, this.retryDelay);
      }
    });
  }

  // Disconnect from MongoDB (both Mongoose and native client)
  async disconnect() {
    try {
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
