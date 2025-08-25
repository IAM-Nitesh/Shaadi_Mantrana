// Database migration script to fix invitations collection
const mongoose = require('mongoose');

// Load environment variables based on NODE_ENV
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});

// Fallback to .env if environment-specific file doesn't exist
require('dotenv').config();

async function fixInvitations() {
  try {
    // Use the same MongoDB URI logic as the main application
    const environment = process.env.NODE_ENV || 'development';
    const DEV_MONGODB_URI = 'mongodb+srv://<REDACTED_USER>:<REDACTED_PASS>@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    let mongoUri;
    switch (environment) {
      case 'development':
      case 'dev':
      case 'local':
        mongoUri = process.env.MONGODB_URI || DEV_MONGODB_URI;
        break;
      case 'production':
      case 'prod':
        mongoUri = process.env.MONGODB_URI || process.env.MONGODB_PRODUCTION_URI;
        break;
      case 'test':
        mongoUri = process.env.MONGODB_TEST_URI || DEV_MONGODB_URI;
        break;
      default:
        mongoUri = DEV_MONGODB_URI;
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get the database instance
    const db = mongoose.connection.db;
    
    // Check if invitations collection exists
    const collections = await db.listCollections().toArray();
    const invitationsCollection = collections.find(col => col.name === 'invitations');
    
    if (!invitationsCollection) {
      console.log('✅ Invitations collection does not exist yet - no fix needed');
      return;
    }

    console.log('🔍 Checking invitations collection...');

    // Get all indexes on the invitations collection
    const indexes = await db.collection('invitations').indexes();
    console.log('📋 Current indexes:', indexes.map(idx => idx.name));

    // Check if there's an invitationCode index
    const invitationCodeIndex = indexes.find(idx => 
      idx.key && idx.key.invitationCode !== undefined
    );

    if (invitationCodeIndex) {
      console.log('⚠️  Found problematic invitationCode index:', invitationCodeIndex.name);
      console.log('🗑️  Dropping invitationCode index...');
      
      try {
        await db.collection('invitations').dropIndex(invitationCodeIndex.name);
        console.log('✅ Successfully dropped invitationCode index');
      } catch (dropError) {
        console.log('⚠️  Could not drop index (might not exist):', dropError.message);
      }
    } else {
      console.log('✅ No problematic invitationCode index found');
    }

    // Check for documents with null invitationCode and remove them
    const nullInvitationCodeCount = await db.collection('invitations').countDocuments({
      invitationCode: null
    });

    if (nullInvitationCodeCount > 0) {
      console.log(`🗑️  Found ${nullInvitationCodeCount} documents with null invitationCode`);
      console.log('🗑️  Removing documents with null invitationCode...');
      
      const result = await db.collection('invitations').deleteMany({
        invitationCode: null
      });
      
      console.log(`✅ Removed ${result.deletedCount} documents with null invitationCode`);
    } else {
      console.log('✅ No documents with null invitationCode found');
    }

    // Verify the fix by checking if we can create a new invitation
    console.log('🧪 Testing invitation creation...');
    
    const testInvitation = {
      uuid: 'test-uuid-' + Date.now(),
      email: 'test@example.com',
      invitationId: 'test-invitation-' + Date.now(),
      sentDate: new Date(),
      count: 1,
      status: 'sent'
    };

    try {
      await db.collection('invitations').insertOne(testInvitation);
      console.log('✅ Test invitation created successfully');
      
      // Clean up test invitation
      await db.collection('invitations').deleteOne({ uuid: testInvitation.uuid });
      console.log('✅ Test invitation cleaned up');
    } catch (testError) {
      console.error('❌ Test invitation creation failed:', testError.message);
    }

    console.log('✅ Invitations collection fix completed');

  } catch (error) {
    console.error('❌ Error during invitations fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixInvitations();
}

module.exports = { fixInvitations }; 
