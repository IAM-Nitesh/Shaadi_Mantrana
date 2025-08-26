const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import models
const { User } = require('../src/models');
const PreapprovedEmail = require('../src/models/PreapprovedEmail');

async function migratePreapprovedToUsers() {
  try {
    console.log('🚀 Starting migration from PreapprovedEmail to User collection...');
    
    // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || process.env.DEV_MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all preapproved emails
    const preapprovedEmails = await PreapprovedEmail.find({});
    console.log(`📧 Found ${preapprovedEmails.length} preapproved emails to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const preapproved of preapprovedEmails) {
      try {
        // Check if user already exists with this email
        const existingUser = await User.findOne({ email: preapproved.email });
        
        if (existingUser) {
          console.log(`⏭️  Skipping ${preapproved.email} - user already exists`);
          skippedCount++;
          continue;
        }

        // Create new user from preapproved email data
        const newUser = new User({
          email: preapproved.email,
          userUuid: preapproved.uuid,
          isApprovedByAdmin: preapproved.approvedByAdmin,
          addedAt: preapproved.addedAt || preapproved.createdAt,
          addedBy: preapproved.addedBy,
          isFirstLogin: preapproved.isFirstLogin,
          status: preapproved.status === 'active' ? 'invited' : preapproved.status,
          role: 'user',
          profile: {
            location: "India",
            profileCompleteness: 0,
            interests: [],
            images: []
          },
          preferences: {
            ageRange: {
              min: 18,
              max: 50
            },
            location: [
              "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
              "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
              "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
              "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
              "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
              "Uttar Pradesh", "Uttarakhand", "West Bengal",
              "Andaman and Nicobar Islands", "Chandigarh",
              "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
              "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
            ],
            profession: [],
            education: []
          },
          profileCompleted: false,
          premium: false,
          loginHistory: []
        });

        await newUser.save();
        console.log(`✅ Migrated ${preapproved.email} to User collection`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Error migrating ${preapproved.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${migratedCount}`);
    console.log(`   ⏭️  Skipped (already exists): ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📧 Total processed: ${preapprovedEmails.length}`);

    // Verify migration
    const totalUsers = await User.countDocuments();
    const totalPreapproved = await PreapprovedEmail.countDocuments();
    
    console.log('\n🔍 Verification:');
    console.log(`   👥 Total users in User collection: ${totalUsers}`);
    console.log(`   📧 Total preapproved emails: ${totalPreapproved}`);

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration
migratePreapprovedToUsers(); 