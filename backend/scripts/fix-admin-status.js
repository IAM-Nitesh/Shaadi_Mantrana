const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { User } = require('../src/models');

async function fixAdminStatus() {
  try {
    console.log('🔧 Fixing admin user status...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://<REDACTED_USER>:<REDACTED_PASS>@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ email: 'codebynitesh@gmail.com' });
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log(`👑 Admin user before fix: ${adminUser.email}`);
    console.log(`   - Role: ${adminUser.role}`);
    console.log(`   - Status: ${adminUser.status}`);
    console.log(`   - isApprovedByAdmin: ${adminUser.isApprovedByAdmin}`);

    // Fix admin user status
    adminUser.status = 'active';
    adminUser.isApprovedByAdmin = true; // Admin users should be approved
    adminUser.role = 'admin'; // Ensure role is admin
    await adminUser.save();

    console.log(`\n✅ Admin user fixed: ${adminUser.email}`);
    console.log(`   - Role: ${adminUser.role}`);
    console.log(`   - Status: ${adminUser.status}`);
    console.log(`   - isApprovedByAdmin: ${adminUser.isApprovedByAdmin}`);

    // Verify the fix
    const updatedAdmin = await User.findOne({ email: 'codebynitesh@gmail.com' });
    console.log(`\n🔍 Verification: ${updatedAdmin.email}`);
    console.log(`   - Role: ${updatedAdmin.role}`);
    console.log(`   - Status: ${updatedAdmin.status}`);
    console.log(`   - isApprovedByAdmin: ${updatedAdmin.isApprovedByAdmin}`);

    console.log('\n✅ Admin status fix completed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run fix
fixAdminStatus(); 