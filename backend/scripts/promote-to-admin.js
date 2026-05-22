const mongoose = require('mongoose');
const config = require('../src/config');
const readline = require('readline');

// Import the User model
const User = require('../src/models/User');

async function promoteToAdmin() {
  try {
    // Security check: refuse to run in production without explicit override
    if (process.env.NODE_ENV === 'production' && !process.env.FORCE_PROMOTE_ADMIN) {
      console.error('❌ This script is blocked in production environment');
      console.error('   To override, set FORCE_PROMOTE_ADMIN=true');
      process.exit(1);
    }

    // Get target identifier from command line arguments
    const targetIdentifier = process.argv[2];
    if (!targetIdentifier) {
      console.error('❌ Target email, phone number, or userUuid is required');
      console.error('   Usage: node promote-to-admin.js <email | phoneNumber | userUuid>');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    
    // Use the same configuration as the backend
    const mongoUri = config.DATABASE.URI;
    
    if (!mongoUri) {
      console.log('❌ MongoDB URI not configured');
      return;
    }
    
    console.log('🔍 Using MongoDB URI:', mongoUri.replace(/:[^:@]*@/, ':***@'));
    
    await mongoose.connect(mongoUri, config.DATABASE.OPTIONS);
    console.log('✅ Connected to MongoDB');

    // Find the user by email, phone number, or userUuid
    const identifier = targetIdentifier.trim();
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phoneNumber: identifier },
        { userUuid: identifier }
      ]
    });
    
    if (!user) {
      console.log('❌ User not found with email, phone number, or userUuid:', identifier);
      return;
    }

    const userIdentifier = user.email || user.phoneNumber;

    console.log('👤 Found user:', {
      email: user.email || 'None (Phone Signup)',
      phoneNumber: user.phoneNumber || 'None',
      currentRole: user.role,
      userUuid: user.userUuid
    });

    // Interactive confirmation
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question(`\n⚠️  Are you sure you want to promote ${userIdentifier} to admin? (y/N): `, resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user');
      return;
    }

    console.log(`\n🔧 Promoting ${userIdentifier} to admin role...`);

    // Update user role to admin
    user.role = 'admin';
    await user.save();

    console.log('✅ User promoted to admin successfully!');
    console.log('📊 Updated user info:', {
      email: user.email || 'None',
      phoneNumber: user.phoneNumber || 'None',
      role: user.role,
      userUuid: user.userUuid
    });

  } catch (error) {
    console.error('❌ Error promoting user to admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
promoteToAdmin();
