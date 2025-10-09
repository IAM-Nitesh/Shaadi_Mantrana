// MongoDB Connection Pool Manager
// Handles connection pooling, health monitoring, and automatic recovery

const mongoose = require('mongoose');
const config = require('../config');

class ConnectionPoolManager {
  constructor() {
    this.isHealthy = false;
    this.lastHealthCheck = null;
    this.connectionErrors = 0;
    this.maxConnectionErrors = 5;
    this.healthCheckInterval = null;
    this.reconnectInterval = null;
    this.circuitBreakerOpen = false;
    this.isReconnecting = false;
  }

  // Initialize connection pool with health monitoring
  async initialize() {
    try {
      console.log('🔧 Initializing MongoDB connection pool...');
      
      // Set up connection event handlers
      this.setupMongooseEvents();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      console.log('✅ Connection pool manager initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize connection pool:', error.message);
      return false;
    }
  }

  // Set up comprehensive Mongoose event handlers
  setupMongooseEvents() {
    const connection = mongoose.connection;

    connection.on('connecting', () => {
      console.log('🔄 MongoDB: Connecting...');
    });

    connection.on('connected', () => {
      console.log('✅ MongoDB: Connected');
      this.isHealthy = true;
      this.connectionErrors = 0;
      this.circuitBreakerOpen = false;
      this.lastHealthCheck = Date.now();
    });

    connection.on('open', () => {
      console.log('📂 MongoDB: Connection opened');
    });

    connection.on('disconnecting', () => {
      console.log('🔄 MongoDB: Disconnecting...');
      this.isHealthy = false;
    });

    connection.on('disconnected', () => {
      console.log('❌ MongoDB: Disconnected');
      this.isHealthy = false;
      this.connectionErrors++;
      this.handleDisconnection();
    });

    connection.on('close', () => {
      console.log('🔒 MongoDB: Connection closed');
      this.isHealthy = false;
    });

    connection.on('error', (error) => {
      console.error('❌ MongoDB Error:', error.message);
      this.isHealthy = false;
      this.connectionErrors++;
      
      // Handle specific error types
      if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        console.log('🌐 DNS/Network error detected - implementing backoff strategy');
        this.handleNetworkError();
      } else if (error.message.includes('authentication')) {
        console.log('🔐 Authentication error detected');
        this.circuitBreakerOpen = true;
      }
    });

    connection.on('reconnected', () => {
      console.log('🔄 MongoDB: Reconnected');
      this.isHealthy = true;
      this.connectionErrors = 0;
      this.circuitBreakerOpen = false;
    });

    connection.on('timeout', () => {
      console.log('⏰ MongoDB: Connection timeout');
      this.isHealthy = false;
    });
  }

  // Handle disconnection with intelligent retry
  handleDisconnection() {
    if (this.circuitBreakerOpen) {
      console.log('🚫 Circuit breaker open - not attempting reconnection');
      return;
    }

    if (this.connectionErrors >= this.maxConnectionErrors) {
      console.log('🚫 Max connection errors reached - opening circuit breaker');
      this.circuitBreakerOpen = true;
      return;
    }

    // Prevent race conditions by checking if already reconnecting
    if (this.isReconnecting) {
      console.log('🔄 Reconnection already in progress, skipping');
      return;
    }

    // Clear any existing reconnection timer
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    // Exponential backoff for reconnection
    const backoffDelay = Math.min(5000 * Math.pow(2, this.connectionErrors - 1), 60000);
    console.log(`🔄 Scheduling reconnection attempt in ${backoffDelay/1000}s...`);
    
    this.reconnectInterval = setTimeout(() => {
      this.attemptReconnection();
    }, backoffDelay);
  }

  // Handle network-specific errors
  handleNetworkError() {
    if (this.circuitBreakerOpen) {
      console.log('🚫 Circuit breaker open - not attempting reconnection');
      return;
    }

    // Prevent race conditions by checking if already reconnecting
    if (this.isReconnecting) {
      console.log('🔄 Reconnection already in progress, skipping');
      return;
    }

    // Clear any existing reconnection timer
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    // For network errors, use longer backoff
    const networkBackoff = Math.min(10000 * Math.pow(2, this.connectionErrors - 1), 120000);
    console.log(`🌐 Network error backoff: ${networkBackoff/1000}s`);
    
    this.reconnectInterval = setTimeout(() => {
      this.attemptReconnection();
    }, networkBackoff);
  }

  // Attempt reconnection
  async attemptReconnection() {
    this.isReconnecting = true;
    
    try {
      if (mongoose.connection.readyState === 1) {
        console.log('✅ Already connected - skipping reconnection');
        return;
      }

      console.log('🔄 Attempting to reconnect to MongoDB...');
      
      // Force close existing connection
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }

      // Reconnect with fresh connection
      await mongoose.connect(config.DATABASE.URI, config.DATABASE.OPTIONS);
      
      console.log('✅ Reconnection successful');
      this.connectionErrors = 0; // Reset error count on success
    } catch (error) {
      console.error('❌ Reconnection failed:', error.message);
      this.connectionErrors++;
    } finally {
      this.isReconnecting = false;
      this.reconnectInterval = null; // Clear the interval reference
    }
  }

  // Start health monitoring
  startHealthMonitoring() {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Check every 30 seconds

    console.log('❤️ Health monitoring started');
  }

  // Perform health check
  async performHealthCheck() {
    try {
      if (mongoose.connection.readyState !== 1) {
        this.isHealthy = false;
        return;
      }

      // Ping the database
      await mongoose.connection.db.admin().ping();
      
      if (!this.isHealthy) {
        console.log('✅ Health check: Database connection restored');
      }
      
      this.isHealthy = true;
      this.lastHealthCheck = Date.now();
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      this.isHealthy = false;
      
      // If health check fails, attempt to reconnect
      if (!this.reconnectInterval && !this.circuitBreakerOpen) {
        this.handleDisconnection();
      }
    }
  }

  // Stop all monitoring
  cleanup() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('❤️ Health monitoring stopped');
    }

    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  // Get connection status
  getStatus() {
    return {
      isHealthy: this.isHealthy,
      connectionErrors: this.connectionErrors,
      circuitBreakerOpen: this.circuitBreakerOpen,
      lastHealthCheck: this.lastHealthCheck,
      mongooseState: mongoose.connection.readyState,
      mongooseStateName: this.getReadyStateName(mongoose.connection.readyState)
    };
  }

  // Get readable state name
  getReadyStateName(state) {
    switch (state) {
      case 0: return 'disconnected';
      case 1: return 'connected';
      case 2: return 'connecting';
      case 3: return 'disconnecting';
      default: return 'unknown';
    }
  }

  // Reset circuit breaker manually
  resetCircuitBreaker() {
    console.log('🔄 Resetting circuit breaker');
    this.circuitBreakerOpen = false;
    this.connectionErrors = 0;
  }
}

// Create singleton instance
const connectionPoolManager = new ConnectionPoolManager();

module.exports = connectionPoolManager;