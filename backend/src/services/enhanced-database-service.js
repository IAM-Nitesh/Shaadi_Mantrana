// Enhanced Database Service with Network Resilience
// Handles MongoDB Atlas connectivity issues with comprehensive error recovery

const mongoose = require('mongoose');
const dns = require('dns').promises;
const net = require('net');
const config = require('../config');

class EnhancedDatabaseService {
  constructor() {
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxAttempts = 5;
    this.circuitBreakerOpen = false;
    this.lastConnectionAttempt = null;
    this.connectionTimer = null;
    this.healthCheckTimer = null;
    
    // Network resilience settings
    this.dnsCache = new Map();
    this.dnsCacheTimeout = 300000; // 5 minutes
    this.fallbackIPs = [];
    
    // Event handlers are now managed centrally by DatabaseService to prevent loops
    // this.setupEventHandlers();
  }

  async connect() {
    if (this.circuitBreakerOpen) {
      console.log('🚫 Circuit breaker is open - skipping connection attempt');
      return false;
    }

    try {
      console.log('🔌 Starting enhanced database connection...');
      
      // Pre-connection checks
      await this.performPreConnectionChecks();
      
      // Attempt connection with enhanced options
      const connectionOptions = this.getEnhancedConnectionOptions();
      
      console.log('📍 Connecting with enhanced options...');
      await mongoose.connect(config.DATABASE.URI, connectionOptions);
      
      this.isConnected = true;
      this.connectionAttempts = 0;
      this.circuitBreakerOpen = false;
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      console.log('✅ Enhanced database connection established');
      return true;
      
    } catch (error) {
      console.error('❌ Enhanced connection failed:', error.message);
      this.handleConnectionFailure(error);
      return false;
    }
  }

  async performPreConnectionChecks() {
    try {
      console.log('🔍 Performing pre-connection checks...');
      
      // Extract hostname from MongoDB URI
      const hostname = this.extractHostname(config.DATABASE.URI);
      if (!hostname) {
        throw new Error('Cannot extract hostname from MongoDB URI');
      }
      
      console.log(`🌐 Checking DNS resolution for ${hostname}...`);
      
      // Check DNS resolution with caching
      const resolved = await this.resolveDNSWithCache(hostname);
      if (resolved && resolved.length > 0) {
        console.log(`✅ DNS resolved: ${resolved.length} addresses found`);
        this.fallbackIPs = resolved;
      }
      
      // Test network connectivity to first resolved IP
      if (this.fallbackIPs.length > 0) {
        await this.testNetworkConnectivity(this.fallbackIPs[0]);
      }
      
    } catch (error) {
      console.warn('⚠️ Pre-connection checks failed:', error.message);
      // Continue with connection attempt even if pre-checks fail
    }
  }

  extractHostname(mongoUri) {
    try {
      const match = mongoUri.match(/mongodb\+srv:\/\/[^@]+@([^\/]+)/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  async resolveDNSWithCache(hostname) {
    const cacheKey = hostname;
    const cached = this.dnsCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.dnsCacheTimeout) {
      console.log('📋 Using cached DNS resolution');
      return cached.addresses;
    }
    
    try {
      const addresses = await dns.resolve4(hostname);
      this.dnsCache.set(cacheKey, {
        addresses,
        timestamp: Date.now()
      });
      return addresses;
    } catch (error) {
      console.warn('❌ DNS resolution failed:', error.message);
      return cached ? cached.addresses : [];
    }
  }

  async testNetworkConnectivity(ip) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      }, 5000);
      
      socket.connect(27017, ip, () => {
        clearTimeout(timeout);
        socket.destroy();
        console.log(`✅ Network connectivity test passed for ${ip}`);
        resolve(true);
      });
      
      socket.on('error', (error) => {
        clearTimeout(timeout);
        socket.destroy();
        console.warn(`❌ Network connectivity test failed for ${ip}:`, error.message);
        reject(error);
      });
    });
  }

  getEnhancedConnectionOptions() {
    return {
      ...config.DATABASE.OPTIONS,
      // Enhanced timeout settings for problematic networks
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 25000,
      connectTimeoutMS: 8000,
      heartbeatFrequencyMS: 5000,
      
      // Aggressive retry settings
      retryWrites: true,
      retryReads: true,
      
      // Force IPv4 and disable buffering
      family: 4,
      bufferCommands: false,
      
      // Additional resilience options
      ssl: config.isProduction, // Only use SSL in production
      authSource: 'admin',
      compressors: 'snappy',
      maxConnecting: 1, // Limit concurrent connections
      
      // Connection pool settings optimized for Atlas
      maxPoolSize: 5,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 5000,
      
      // Application identification
      appName: 'Shaadi-Mantrana-Enhanced'
    };
  }

  setupEventHandlers() {
    mongoose.connection.on('connected', () => {
      console.log('🟢 Enhanced MongoDB connection established');
      this.isConnected = true;
      this.connectionAttempts = 0;
      this.circuitBreakerOpen = false;
    });

    mongoose.connection.on('error', (error) => {
      console.error('🔴 Enhanced MongoDB error:', error.message);
      this.isConnected = false;
      this.handleConnectionError(error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🟡 Enhanced MongoDB disconnected');
      this.isConnected = false;
      // Reconnection handled by primary DatabaseService
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Enhanced MongoDB reconnected');
      this.isConnected = true;
      this.connectionAttempts = 0;
    });
  }

  handleConnectionFailure(error) {
    this.connectionAttempts++;
    this.lastConnectionAttempt = Date.now();
    
    if (this.connectionAttempts >= this.maxAttempts) {
      console.log('🚫 Max connection attempts reached - opening circuit breaker');
      this.circuitBreakerOpen = true;
      // Reset circuit breaker after 2 minutes
      setTimeout(() => {
        console.log('🔄 Resetting circuit breaker');
        this.circuitBreakerOpen = false;
        this.connectionAttempts = 0;
      }, 120000);
      return;
    }
    
    // Schedule retry with exponential backoff
    this.scheduleReconnection();
  }

  handleConnectionError(error) {
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('🌐 DNS/Network error detected - clearing DNS cache');
      this.dnsCache.clear();
    }
  }

  scheduleReconnection() {
    if (this.connectionTimer || this.circuitBreakerOpen) return;
    
    const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 30000);
    console.log(`🔄 Scheduling reconnection in ${delay/1000}s (attempt ${this.connectionAttempts + 1}/${this.maxAttempts})`);
    
    this.connectionTimer = setTimeout(async () => {
      this.connectionTimer = null;
      if (!this.isConnected && !this.circuitBreakerOpen) {
        await this.connect();
      }
    }, delay);
  }

  startHealthMonitoring() {
    if (this.healthCheckTimer) return;
    
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Every 30 seconds
    
    console.log('❤️ Enhanced health monitoring started');
  }

  async performHealthCheck() {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.admin().ping();
        if (!this.isConnected) {
          console.log('✅ Health check: Connection restored');
          this.isConnected = true;
        }
      } else {
        if (this.isConnected) {
          console.log('❌ Health check: Connection lost');
          this.isConnected = false;
          this.scheduleReconnection();
        }
      }
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      if (this.isConnected) {
        this.isConnected = false;
        this.scheduleReconnection();
      }
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      connectionState: mongoose.connection.readyState,
      connectionAttempts: this.connectionAttempts,
      circuitBreakerOpen: this.circuitBreakerOpen,
      lastConnectionAttempt: this.lastConnectionAttempt,
      dnsCacheSize: this.dnsCache.size,
      fallbackIPs: this.fallbackIPs.length
    };
  }

  async disconnect() {
    console.log('🔌 Disconnecting enhanced database service...');
    
    // Clear timers
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    // Close connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    this.isConnected = false;
    console.log('✅ Enhanced database service disconnected');
  }
}

module.exports = new EnhancedDatabaseService();