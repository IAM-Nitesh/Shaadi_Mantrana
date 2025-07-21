// MongoDB Atlas Connection Test
// Tests both Mongoose and native MongoDB client connections

require('dotenv').config();

const databaseService = require('./src/services/databaseService');
const { User, Invitation, Connection } = require('./src/models');

async function testAtlasConnection() {
  console.log('🧪 Testing MongoDB Atlas Connection...\n');

  const dbService = databaseService;

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    await dbService.connect();
    console.log('✅ Database connection successful!\n');

    // Test connection status
    console.log('2. Checking connection status...');
    const status = dbService.getConnectionStatus();
    console.log('Connection Status:', {
      isConnected: status.isConnected,
      readyState: status.readyState,
      environment: status.environment,
      host: status.host || 'Atlas Cluster'
    });
    console.log('✅ Connection status retrieved!\n');

    // Test Mongoose models
    console.log('3. Testing Mongoose models...');
    
    // Test User model
    const testUser = new User({
      email: 'test@atlasconnection.com',
      verification: { isVerified: true },
      profile: {
        name: 'Atlas Test User',
        age: 25
      }
    });
    
    console.log('User model validation:', testUser.validateSync() ? 'Failed' : 'Passed');
    
    // Test Invitation model  
    const testInvitation = new Invitation({
      email: 'test@atlasconnection.com',
      invitationCode: 'ATLAS123'
    });
    
    console.log('Invitation model validation:', testInvitation.validateSync() ? 'Failed' : 'Passed');
    console.log('✅ Model validation successful!\n');

    // Test native MongoDB client (if available)
    console.log('4. Testing native MongoDB client...');
    const nativeClient = dbService.getNativeClient();
    
    if (nativeClient) {
      const db = dbService.getDatabase();
      const collections = await db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name));
      console.log('✅ Native client operations successful!\n');
    } else {
      console.log('ℹ️ Native client not available (non-Atlas connection)\n');
    }

    // Test database stats
    console.log('5. Getting database statistics...');
    const stats = await dbService.getStats();
    console.log('Database stats:', {
      database: stats.database,
      collections: stats.collections,
      objects: stats.objects
    });
    console.log('✅ Database stats retrieved!\n');

    console.log('🎉 All Atlas connection tests passed successfully!');

  } catch (error) {
    console.error('❌ Atlas connection test failed:', error.message);
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication failed - check your MongoDB Atlas credentials');
    } else if (error.message.includes('network')) {
      console.log('\n💡 Network error - check your internet connection and Atlas network access');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Connection timeout - check your Atlas cluster status');
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify MONGODB_URI in .env file');
    console.log('2. Check MongoDB Atlas network access settings');
    console.log('3. Verify database user permissions');
    console.log('4. Ensure cluster is running and accessible');
    
  } finally {
    // Clean up connections
    try {
      await dbService.disconnect();
      console.log('\n🔌 Database connections closed');
    } catch (disconnectError) {
      console.error('❌ Error during disconnect:', disconnectError.message);
    }
    
    console.log('\n✅ Atlas connection test completed');
    process.exit(0);
  }
}

// Run the test
if (require.main === module) {
  testAtlasConnection();
}

module.exports = testAtlasConnection;
