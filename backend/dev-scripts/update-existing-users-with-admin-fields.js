const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { User } = require('../src/models');
const PreapprovedEmail = require('../src/models/PreapprovedEmail');

async function updateExistingUsersWithAdminFields() {
  try {
    console.log('🚀 Starting update of existing users with admin tracking fields...');
    
    // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || process.env.DEV_MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all preapproved emails
    const preapprovedEmails = await PreapprovedEmail.find({});
    console.log(`📧 Found ${preapprovedEmails.length} preapproved emails to check`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const preapproved of preapprovedEmails) {
      try {
        // Find corresponding user
        const user = await User.findOne({ email: preapproved.email });
        
        if (!user) {
          console.log(`⚠️  No user found for ${preapproved.email}`);
          skippedCount++;
          continue;
        }

        // Check if user already has admin tracking fields
        if (user.addedAt && user.addedBy) {
          console.log(`⏭️  User ${preapproved.email} already has admin tracking fields`);
          skippedCount++;
          continue;
        }

        // Update user with admin tracking fields
        user.addedAt = preapproved.addedAt || preapproved.createdAt;
        user.addedBy = preapproved.addedBy;
        user.isApprovedByAdmin = preapproved.approvedByAdmin;
        
        await user.save();
        console.log(`✅ Updated user ${preapproved.email} with admin tracking fields`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Error updating ${preapproved.email}:`, error.message);
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`   ✅ Successfully updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped (already updated): ${skippedCount}`);
    console.log(`   📧 Total processed: ${preapprovedEmails.length}`);

    // Verify updates
    const usersWithAdminFields = await User.countDocuments({ 
      addedAt: { $exists: true }, 
      addedBy: { $exists: true } 
    });
    const totalUsers = await User.countDocuments();
    
    console.log('\n🔍 Verification:');
    console.log(`   👥 Total users: ${totalUsers}`);
    console.log(`   📊 Users with admin tracking: ${usersWithAdminFields}`);

    console.log('\n✅ Update completed successfully!');
    
  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run update
updateExistingUsersWithAdminFields(); 