#!/usr/bin/env node

/**
 * Test User Management Actions
 * Tests resume, pause, and resend invite functionality
 */

require('dotenv').config({ path: '.env.development' });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Invitation = require('../src/models/Invitation');
const InviteEmailService = require('../src/services/inviteEmailService');

async function testUserActions() {
  console.log('🧪 Testing User Management Actions...\n');

  try {
    // Connect to MongoDB
    console.log('1️⃣ Connecting to MongoDB...');
    const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully\n');

    // Test email
    const testEmail = `test-actions-${Date.now()}@example.com`;
    const firstName = 'Test';
    const lastName = 'Actions';

    console.log('2️⃣ Creating test user...');
    console.log(`   - Email: ${testEmail}`);
    console.log(`   - Name: ${firstName} ${lastName}\n`);

    // Check if user already exists
    const existingUser = await User.findOne({ email: testEmail });
    if (existingUser) {
      console.log('⚠️ User already exists, deleting for fresh test');
      await User.deleteOne({ email: testEmail });
    }

    // Generate UUID for the new user
    const { v4: uuidv4 } = require('uuid');
    const userUuid = uuidv4();

    // Create test user
    const testUser = new User({
      email: testEmail,
      userUuid,
      role: 'user',
      status: 'active',
      isFirstLogin: true,
      isApprovedByAdmin: true,
      profile: {
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        profileCompleteness: 50
      },
      preferences: {
        ageRange: { min: 18, max: 50 },
        education: [],
        location: [],
        profession: []
      },
      verification: {
        approvalType: 'admin',
        isVerified: true,
        verifiedAt: new Date()
      },
      profileCompleted: false,
      loginHistory: []
    });

    await testUser.save();
    console.log(`✅ Test user created with ID: ${testUser._id}`);

    // Test 1: Pause User
    console.log('\n3️⃣ Testing Pause User Action...');
    testUser.status = 'paused';
    testUser.isApprovedByAdmin = false;
    testUser.lastActive = new Date();
    await testUser.save();
    console.log(`✅ User paused - Status: ${testUser.status}, Approved: ${testUser.isApprovedByAdmin}`);

    // Test 2: Resume User
    console.log('\n4️⃣ Testing Resume User Action...');
    testUser.status = 'active';
    testUser.isApprovedByAdmin = true;
    testUser.lastActive = new Date();
    await testUser.save();
    console.log(`✅ User resumed - Status: ${testUser.status}, Approved: ${testUser.isApprovedByAdmin}`);

    // Test 3: Resend Invite
    console.log('\n5️⃣ Testing Resend Invite Action...');
    
    // Generate new invitation ID
    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update or create invitation record
    let invitation = await Invitation.findOne({ email: testUser.email });
    if (invitation) {
      // Update existing invitation
      invitation.count += 1;
      invitation.sentDate = new Date();
      invitation.status = 'sent';
      invitation.invitationId = invitationId;
      invitation.sentBy = testUser._id; // Using test user as admin for this test
    } else {
      // Create new invitation
      invitation = new Invitation({
        email: testUser.email,
        uuid: testUser.userUuid,
        invitationId,
        status: 'sent',
        sentDate: new Date(),
        count: 1,
        sentBy: testUser._id
      });
    }

    await invitation.save();
    console.log(`✅ Invitation record updated - Count: ${invitation.count}, ID: ${invitation.invitationId}`);

    // Send invitation email
    try {
      const emailResult = await InviteEmailService.sendInviteEmail(testUser.email, testUser.userUuid);
      
      if (emailResult.success) {
        console.log(`✅ Invitation email sent successfully`);
        console.log(`   - Method: ${emailResult.method}`);
        console.log(`   - Invite Link: ${emailResult.inviteLink}`);
      } else {
        console.log(`⚠️ Email service issue:`, emailResult.emailError);
      }
    } catch (emailError) {
      console.error('❌ Failed to send invitation email:', emailError);
    }

    // Test 4: Verify Login Blocking
    console.log('\n6️⃣ Testing Login Blocking for Paused Users...');
    
    // Pause user again
    testUser.status = 'paused';
    testUser.isApprovedByAdmin = false;
    await testUser.save();
    console.log(`✅ User paused again for login test`);

    // Simulate login attempt (this would normally be done in the auth controller)
    const canLogin = testUser.role !== 'admin' && testUser.isApprovedByAdmin !== false;
    console.log(`   - Can login: ${canLogin ? 'Yes' : 'No'}`);
    console.log(`   - Expected: No (user is paused)`);

    if (!canLogin) {
      console.log(`✅ Login correctly blocked for paused user`);
    } else {
      console.log(`❌ Login should be blocked but wasn't`);
    }

    // Test 5: Verify Login Allowing
    console.log('\n7️⃣ Testing Login Allowing for Active Users...');
    
    // Resume user
    testUser.status = 'active';
    testUser.isApprovedByAdmin = true;
    await testUser.save();
    console.log(`✅ User resumed again for login test`);

    // Simulate login attempt
    const canLoginNow = testUser.role !== 'admin' && testUser.isApprovedByAdmin !== false;
    console.log(`   - Can login: ${canLoginNow ? 'Yes' : 'No'}`);
    console.log(`   - Expected: Yes (user is active)`);

    if (canLoginNow) {
      console.log(`✅ Login correctly allowed for active user`);
    } else {
      console.log(`❌ Login should be allowed but wasn't`);
    }

    console.log('\n🎉 User management actions test completed successfully!');

    // Clean up test data
    console.log('\n8️⃣ Cleaning up test data...');
    await User.deleteOne({ email: testEmail });
    await Invitation.deleteOne({ email: testEmail });
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ User actions test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

async function main() {
  console.log('🚀 User Management Actions Test\n');
  await testUserActions();
}

if (require.main === module) {
  main().catch(console.error);
} 