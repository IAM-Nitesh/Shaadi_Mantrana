// Database Connectivity Checker
// Comprehensive MongoDB Atlas connectivity testing and troubleshooting

const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const dns = require('dns').promises;
const net = require('net');

class DatabaseConnectivityChecker {
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.parsedUri = null;
    this.parseConnectionString();
  }

  parseConnectionString() {
    try {
      // Extract hostname from MongoDB connection string
      const match = this.connectionString.match(/mongodb\+srv:\/\/[^@]*@([^/]+)/);
      if (match) {
        this.hostname = match[1];
        this.isAtlas = true;
      } else {
        const match2 = this.connectionString.match(/mongodb:\/\/[^@]*@([^:/]+)/);
        if (match2) {
          this.hostname = match2[1];
          this.isAtlas = false;
        }
      }
    } catch (error) {
      console.error('❌ Failed to parse connection string:', error.message);
    }
  }

  // Check DNS resolution
  async checkDNS() {
    if (!this.hostname) return { success: false, error: 'No hostname found' };

    try {
      console.log(`🔍 Checking DNS resolution for ${this.hostname}...`);
      
      if (this.isAtlas) {
        // For Atlas, check SRV record first
        try {
          const srvRecords = await dns.resolveSrv(`_mongodb._tcp.${this.hostname}`);
          console.log(`✅ SRV records found: ${srvRecords.length} servers`);
          
          // Check A records for each server
          for (const srv of srvRecords.slice(0, 3)) { // Check first 3
            try {
              const addresses = await dns.resolve4(srv.name);
              console.log(`✅ ${srv.name} → ${addresses.join(', ')}`);
            } catch (err) {
              console.log(`❌ ${srv.name} → DNS resolution failed`);
            }
          }
          
          return { success: true, records: srvRecords };
        } catch (error) {
          console.error(`❌ SRV record lookup failed: ${error.message}`);
          return { success: false, error: error.message };
        }
      } else {
        // For regular MongoDB, check A record
        const addresses = await dns.resolve4(this.hostname);
        console.log(`✅ DNS resolution successful: ${addresses.join(', ')}`);
        return { success: true, addresses };
      }
    } catch (error) {
      console.error(`❌ DNS resolution failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Check network connectivity
  async checkNetworkConnectivity() {
    if (!this.hostname) return { success: false, error: 'No hostname found' };

    try {
      console.log(`🔗 Checking network connectivity to ${this.hostname}:27017...`);
      
      return new Promise((resolve) => {
        const socket = new net.Socket();
        
        socket.setTimeout(10000); // 10 second timeout
        
        socket.on('connect', () => {
          console.log(`✅ Network connectivity successful`);
          socket.destroy();
          resolve({ success: true });
        });
        
        socket.on('timeout', () => {
          console.log(`❌ Connection timeout`);
          socket.destroy();
          resolve({ success: false, error: 'Connection timeout' });
        });
        
        socket.on('error', (error) => {
          console.log(`❌ Network error: ${error.message}`);
          resolve({ success: false, error: error.message });
        });
        
        socket.connect(27017, this.hostname);
      });
    } catch (error) {
      console.error(`❌ Network check failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Test MongoDB connection with native client
  async testNativeConnection() {
    try {
      console.log(`🧪 Testing native MongoDB connection...`);
      
      const client = new MongoClient(this.connectionString, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 15000,
        maxPoolSize: 1,
        family: 4 // Force IPv4
      });

      await client.connect();
      await client.db("admin").command({ ping: 1 });
      console.log(`✅ Native MongoDB connection successful`);
      
      await client.close();
      return { success: true };
    } catch (error) {
      console.error(`❌ Native MongoDB connection failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Test Mongoose connection
  async testMongooseConnection() {
    try {
      console.log(`🧪 Testing Mongoose connection...`);
      
      // Create a separate mongoose connection for testing
      const testConnection = mongoose.createConnection(this.connectionString, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 15000,
        maxPoolSize: 1,
        family: 4,
        bufferCommands: false
      });

      // Wait for connection
      await new Promise((resolve, reject) => {
        testConnection.on('connected', resolve);
        testConnection.on('error', reject);
        
        // Timeout after 20 seconds
        setTimeout(() => reject(new Error('Connection timeout')), 20000);
      });

      console.log(`✅ Mongoose connection successful`);
      await testConnection.close();
      return { success: true };
    } catch (error) {
      console.error(`❌ Mongoose connection failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Run comprehensive connectivity check
  async runFullCheck() {
    console.log(`\n🔍 Starting comprehensive database connectivity check...`);
    console.log(`📍 Target: ${this.hostname} (${this.isAtlas ? 'Atlas' : 'Local'})`);
    console.log(`─────────────────────────────────────────────────────`);

    const results = {
      dns: await this.checkDNS(),
      network: await this.checkNetworkConnectivity(),
      nativeConnection: await this.testNativeConnection(),
      mongooseConnection: await this.testMongooseConnection()
    };

    console.log(`\n📊 Connectivity Check Results:`);
    console.log(`─────────────────────────────────────────────────────`);
    console.log(`DNS Resolution:       ${results.dns.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Network Connectivity: ${results.network.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Native Connection:    ${results.nativeConnection.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Mongoose Connection:  ${results.mongooseConnection.success ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(results).every(result => result.success);
    
    if (allPassed) {
      console.log(`\n🎉 All connectivity checks passed! Database should be accessible.`);
    } else {
      console.log(`\n⚠️  Some connectivity checks failed. Troubleshooting needed.`);
      
      // Provide specific troubleshooting advice
      if (!results.dns.success) {
        console.log(`\n💡 DNS Resolution Issues:`);
        console.log(`   - Check internet connectivity`);
        console.log(`   - Try different DNS servers (8.8.8.8, 1.1.1.1)`);
        console.log(`   - Verify MongoDB Atlas cluster is running`);
      }
      
      if (!results.network.success) {
        console.log(`\n💡 Network Connectivity Issues:`);
        console.log(`   - Check firewall settings`);
        console.log(`   - Verify MongoDB Atlas IP whitelist`);
        console.log(`   - Check corporate network restrictions`);
      }
      
      if (!results.nativeConnection.success || !results.mongooseConnection.success) {
        console.log(`\n💡 MongoDB Connection Issues:`);
        console.log(`   - Check connection string format`);
        console.log(`   - Verify database credentials`);
        console.log(`   - Check MongoDB Atlas cluster status`);
        console.log(`   - Try connecting from MongoDB Compass`);
      }
    }

    return results;
  }
}

module.exports = DatabaseConnectivityChecker;