#!/usr/bin/env node

/**
 * Test Invitation Functionality
 * Tests the complete invitation process
 */

require('dotenv').config({ path: '.env.development' });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Invitation = require('../src/models/Invitation');
const PreapprovedEmail = require('../src/models/PreapprovedEmail');
const InviteEmailService = require('../src/services/inviteEmailService');

async function testInvitation() {
  console.log('🧪 Testing Invitation Functionality...\n');

  try {
    // Connect to MongoDB
    console.log('1️⃣ Connecting to MongoDB...');
    const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully\n');

    // Test email
    const testEmail = `test-${Date.now()}@example.com`;
    const firstName = 'Test';
    const lastName = 'User';

    console.log('2️⃣ Testing invitation process...');
    console.log(`   - Email: ${testEmail}`);
    console.log(`   - Name: ${firstName} ${lastName}\n`);

    // Check if user already exists
    const existingUser = await User.findOne({ email: testEmail });
    if (existingUser) {
      console.log('⚠️ User already exists, skipping test');
      return;
    }

    // Check if invitation already exists
    const existingInvitation = await Invitation.findOne({ email: testEmail });
    if (existingInvitation) {
      console.log('⚠️ Invitation already exists, skipping test');
      return;
    }

    // Generate UUID for the new user
    const { v4: uuidv4 } = require('uuid');
    const userUuid = uuidv4();
    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('3️⃣ Creating new user...');
    // Create new user in database with isApprovedByAdmin as true
    const newUser = new User({
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
        profileCompleteness: 0
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

    await newUser.save();
    console.log(`✅ New user created with UUID: ${userUuid}`);

    console.log('4️⃣ Creating invitation record...');
    // Create invitation record
    const invitation = new Invitation({
      email: testEmail,
      uuid: userUuid,
      invitationId,
      status: 'sent',
      sentDate: new Date(),
      count: 1,
      sentBy: newUser._id // Use the created user's ObjectId
    });

    await invitation.save();
    console.log(`✅ Invitation record created`);

    console.log('5️⃣ Creating preapproved email entry...');
    // Create preapproved email entry
    const preapprovedEmail = new PreapprovedEmail({
      email: testEmail,
      uuid: userUuid,
      approvedByAdmin: true,
      addedBy: newUser._id, // Use the created user's ObjectId
      addedAt: new Date()
    });

    await preapprovedEmail.save();
    console.log(`✅ Preapproved email entry created`);

    console.log('6️⃣ Sending invitation email...');
    // Send invitation email using the invitation service
    try {
      const emailResult = await InviteEmailService.sendInviteEmail(testEmail, userUuid);
      
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

    console.log('\n7️⃣ Verifying data in database...');
    // Verify all data was created correctly
    const createdUser = await User.findOne({ email: testEmail });
    const createdInvitation = await Invitation.findOne({ email: testEmail });
    const createdPreapproved = await PreapprovedEmail.findOne({ email: testEmail });

    console.log('✅ Verification Results:');
    console.log(`   - User created: ${createdUser ? 'Yes' : 'No'}`);
    console.log(`   - User approved by admin: ${createdUser?.isApprovedByAdmin ? 'Yes' : 'No'}`);
    console.log(`   - Invitation created: ${createdInvitation ? 'Yes' : 'No'}`);
    console.log(`   - Preapproved entry created: ${createdPreapproved ? 'Yes' : 'No'}`);

    console.log('\n🎉 Invitation test completed successfully!');

    // Clean up test data
    console.log('\n8️⃣ Cleaning up test data...');
    await User.deleteOne({ email: testEmail });
    await Invitation.deleteOne({ email: testEmail });
    await PreapprovedEmail.deleteOne({ email: testEmail });
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Invitation test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

async function main() {
  console.log('🚀 Invitation Functionality Test\n');
  await testInvitation();
}

if (require.main === module) {
  main().catch(console.error);
} 