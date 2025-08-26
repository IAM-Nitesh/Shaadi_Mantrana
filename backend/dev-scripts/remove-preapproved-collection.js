const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { User } = require('../src/models');
const PreapprovedEmail = require('../src/models/PreapprovedEmail');

async function removePreapprovedCollection() {
  try {
    console.log('🚀 Starting safe removal of PreapprovedEmail collection...');
    
    // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || process.env.DEV_MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI not configured. Set MONGODB_URI or DEV_MONGODB_URI in your environment.');
  await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all preapproved emails
    const preapprovedEmails = await PreapprovedEmail.find({});
    console.log(`📧 Found ${preapprovedEmails.length} preapproved emails to verify`);

    // Verify all preapproved emails have corresponding users
    let allMigrated = true;
    const missingUsers = [];

    for (const preapproved of preapprovedEmails) {
      const user = await User.findOne({ email: preapproved.email });
      if (!user) {
        allMigrated = false;
        missingUsers.push(preapproved.email);
        console.log(`❌ No user found for ${preapproved.email}`);
      } else {
        console.log(`✅ User found for ${preapproved.email}`);
      }
    }

    if (!allMigrated) {
      console.log('\n❌ Cannot remove PreapprovedEmail collection - some users are missing:');
      missingUsers.forEach(email => console.log(`   - ${email}`));
      return;
    }

    console.log('\n✅ All preapproved emails have corresponding users in User collection');

    // Get final counts
    const totalUsers = await User.countDocuments();
    const totalPreapproved = await PreapprovedEmail.countDocuments();
    
    console.log('\n📊 Final Verification:');
    console.log(`   👥 Total users in User collection: ${totalUsers}`);
    console.log(`   📧 Total preapproved emails: ${totalPreapproved}`);

    // Ask for confirmation
    console.log('\n⚠️  About to delete PreapprovedEmail collection...');
    console.log('This action cannot be undone!');
    
    // For safety, we'll just log what would be deleted instead of actually deleting
    console.log('\n🔍 Would delete the following preapproved emails:');
    preapprovedEmails.forEach(preapproved => {
      console.log(`   - ${preapproved.email} (UUID: ${preapproved.uuid})`);
    });

    console.log('\n✅ PreapprovedEmail collection is ready for deletion');
    console.log('📝 To actually delete the collection, run:');
    console.log('   db.preapprovedemails.drop()');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run verification
removePreapprovedCollection(); 