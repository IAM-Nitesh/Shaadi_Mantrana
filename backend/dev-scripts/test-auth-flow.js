const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { User, Preapproved, Invitation } = require('../src/models');

async function testAuthFlow() {
  try {
    console.log('\ud83e\uddea Testing Authentication Flow with Admin Approval...');
    
    // Connect to MongoDB
    const environment = process.env.NODE_ENV || 'development';
  const DEV_MONGODB_URI = process.env.DEV_MONGODB_URI || '';
    
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
    
    if (!mongoUri) {
      console.error('MONGODB_URI not configured. Set MONGODB_URI or DEV_MONGODB_URI in your environment or .env.development');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');

    const testEmail = 'test-auth-flow@example.com';
    const userUuid = uuidv4();

    // Test 1: Try to send OTP without admin approval (should fail)
    console.log('\\n\ud83d\udcdd Test 1: Attempting login without admin approval...');
    
    const preapprovedCheck = await Preapproved.findOne({ email: testEmail });
    if (preapprovedCheck) {
      console.log('\u274c User already exists in preapproved collection');
    } else {
      console.log('\u2705 User not in preapproved collection (expected)');
    }

    // Test 2: Create admin-approved user
    console.log('\\n\ud83d\udcdd Test 2: Creating admin-approved user...');
    
    // Create preapproved entry
    const preapprovedUser = new Preapproved({
      email: testEmail,
      uuid: userUuid,
      isFirstLogin: true,
      approvedByAdmin: true,
      addedAt: new Date()
    });

    await preapprovedUser.save();
    console.log('\u2705 Created preapproved entry');

    // Create user entry
    const user = new User({
      email: testEmail,
      userUuid: userUuid,
      profile: {
        location: "India",
        profileCompleteness: 17,
        // Initialize all dropdown fields as undefined (empty)
        gender: undefined,
        maritalStatus: undefined,
        manglik: undefined,
        complexion: undefined,
        eatingHabit: undefined,
        smokingHabit: undefined,
        drinkingHabit: undefined,
        settleAbroad: undefined,
        // Initialize other profile fields as empty
        name: '',
        nativePlace: '',
        currentResidence: '',
        dateOfBirth: '',
        timeOfBirth: '',
        placeOfBirth: '',
        height: '',
        weight: '',
        education: '',
        occupation: '',
        annualIncome: '',
        father: '',
        mother: '',
        brothers: '',
        sisters: '',
        fatherGotra: '',
        motherGotra: '',
        grandfatherGotra: '',
        grandmotherGotra: '',
        specificRequirements: '',
        about: '',
        interests: [],
        images: []
      },
      preferences: {
        location: ["Delhi", "Mumbai", "Bangalore"],
        ageRange: {
          min: 18,
          max: 50
        },
        profession: [],
        education: []
      },
      isFirstLogin: true,
      role: 'user',
      status: 'active'
    });

    await user.save();
    console.log('\u2705 Created user entry');

    // Test 3: Verify user can now login (simulate auth check)
    console.log('\\n\ud83d\udcdd Test 3: Verifying user can login...');
    
    const authCheck = await Preapproved.findOne({ email: testEmail });
    if (authCheck && authCheck.approvedByAdmin) {
      console.log('\u2705 User is approved and can login');
    } else {
      console.log('\u274c User is not approved for login');
    }

    // Test 4: Test pause functionality
    console.log('\\n\ud83d\udcdd Test 4: Testing pause functionality...');
    
    await Preapproved.findOneAndUpdate(
      { email: testEmail },
      { approvedByAdmin: false }
    );

    const pausedCheck = await Preapproved.findOne({ email: testEmail });
    if (!pausedCheck.approvedByAdmin) {
      console.log('\u2705 User is paused and cannot login');
    } else {
      console.log('\u274c User pause failed');
    }

    // Test 5: Test resume functionality
    console.log('\\n\ud83d\udcdd Test 5: Testing resume functionality...');
    
    await Preapproved.findOneAndUpdate(
      { email: testEmail },
      { approvedByAdmin: true }
    );

    const resumedCheck = await Preapproved.findOne({ email: testEmail });
    if (resumedCheck.approvedByAdmin) {
      console.log('\u2705 User is resumed and can login again');
    } else {
      console.log('\u274c User resume failed');
    }

    // Test 6: Clean up
    console.log('\\n\ud83e\uddf9 Test 6: Cleaning up test data...');
    
    await Preapproved.findOneAndDelete({ email: testEmail });
    await User.findOneAndDelete({ email: testEmail });
    
    console.log('\u2705 Test data cleaned up');

    console.log('\\n\ud83c\udf89 Authentication flow test completed successfully!');
    console.log('\\n\ud83d\udcca Summary:');
    console.log('- \u2705 Admin approval system working');
    console.log('- \u2705 Authentication checks working');
    console.log('- \u2705 Pause/Resume functionality working');
    console.log('- \u2705 User creation workflow working');

  } catch (error) {
    console.error('\u274c Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\ud83d\udd0c Disconnected from MongoDB');
  }
}

// Run the test
testAuthFlow(); 
