// Migration script to update Session collection TTL configuration
// This script migrates from creation-based TTL to activity-based TTL
const mongoose = require('mongoose');
const { Session } = require('../src/models');
const config = require('../src/config');

async function migrateSessionTTL() {
  console.log('🔄 Starting Session TTL Migration...\n');

  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || process.env.DEV_MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not configured');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const sessionsCollection = db.collection('sessions');

    // Step 1: Get current session count and indexes
    const sessionCount = await sessionsCollection.countDocuments();
    console.log(`📊 Current sessions: ${sessionCount}`);

    const currentIndexes = await sessionsCollection.indexes();
    console.log('📋 Current indexes:');
    currentIndexes.forEach(index => {
      console.log(`   - ${index.name}: ${Object.keys(index.key).join(', ')}`);
    });

    // Step 2: Drop old TTL index if it exists
    console.log('\n🗑️  Removing old TTL index...');
    try {
      await sessionsCollection.dropIndex({ createdAt: 1 });
      console.log('✅ Dropped old TTL index (createdAt: 1)');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Old TTL index not found or already removed');
      } else {
        console.log('⚠️  Could not drop old index:', error.message);
      }
    }

    // Step 3: Update existing sessions to have lastAccessed field
    console.log('\n🔄 Updating existing sessions with lastAccessed field...');
    const updateResult = await sessionsCollection.updateMany(
      { lastAccessed: { $exists: false } },
      [
        {
          $set: {
            lastAccessed: '$createdAt',
            migratedAt: new Date()
          }
        }
      ]
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} sessions with lastAccessed field`);

    // Step 4: Add new activity-based TTL index
    console.log('\n📅 Adding new activity-based TTL index...');
    try {
      await sessionsCollection.createIndex(
        { lastAccessed: 1 },
        {
          expireAfterSeconds: 7 * 24 * 60 * 60, // 7 days of inactivity
          name: 'lastAccessed_ttl'
        }
      );
      console.log('✅ Added new TTL index (lastAccessed: 1) - expires after 7 days of inactivity');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️  TTL index already exists');
      } else {
        throw error;
      }
    }

    // Step 5: Add compound index for better performance
    console.log('\n⚡ Adding performance indexes...');
    try {
      await sessionsCollection.createIndex(
        { userId: 1, lastAccessed: -1 },
        { name: 'userId_lastAccessed' }
      );
      console.log('✅ Added compound index (userId: 1, lastAccessed: -1)');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️  Performance index already exists');
      } else {
        console.log('⚠️  Could not create performance index:', error.message);
      }
    }

    // Step 6: Verify the migration
    console.log('\n🔍 Verifying migration...');
    const newIndexes = await sessionsCollection.indexes();
    console.log('📋 New indexes:');
    newIndexes.forEach(index => {
      console.log(`   - ${index.name}: ${Object.keys(index.key).join(', ')}`);
    });

    const finalCount = await sessionsCollection.countDocuments();
    console.log(`📊 Final session count: ${finalCount}`);

    // Step 7: Show TTL effectiveness
    const expiredSessions = await sessionsCollection.countDocuments({
      lastAccessed: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    console.log(`⏰ Sessions that will expire in next TTL cycle: ${expiredSessions}`);

    console.log('\n🎉 Session TTL Migration completed successfully!');
    console.log('\n📈 Migration Summary:');
    console.log('   - Updated TTL from creation-based to activity-based');
    console.log('   - Absolute expiry: 30 days from creation');
    console.log('   - Activity expiry: 7 days from last access');
    console.log('   - Added performance indexes');
    console.log('   - Migration timestamp added to updated documents');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateSessionTTL();
}

module.exports = migrateSessionTTL;
