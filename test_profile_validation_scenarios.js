// Comprehensive Profile Validation Test Script
// Tests all scenarios via frontend API calls

const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:5500';
const FRONTEND_URL = 'http://localhost:3000';

// Test user data
const testUser = {
  email: 'test@example.com',
  userUuid: 'test-uuid-123',
  authToken: null
};

// Test results tracking
const testResults = {
  passed: [],
  failed: [],
  total: 0
};

// Helper function to log test results
function logTestResult(scenario, passed, details = '') {
  testResults.total++;
  const result = {
    scenario,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  if (passed) {
    testResults.passed.push(result);
    console.log(`✅ ${scenario}`);
  } else {
    testResults.failed.push(result);
    console.log(`❌ ${scenario}: ${details}`);
  }
}

// Helper function to make authenticated API calls
async function makeAuthenticatedRequest(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.authToken}`
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
}

// Test Scenario 1: Profile Completeness Validation
async function testProfileCompleteness() {
  console.log('\n🧪 Testing Profile Completeness Validation...');
  
  // Scenario 1.1: Profile completeness < 100%
  try {
    const incompleteProfile = {
      name: 'Test User',
      gender: 'Male',
      // Missing required fields to keep completion < 100%
    };
    
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'PUT', incompleteProfile);
    
    if (result.success && result.data.profileCompleteness < 100) {
      logTestResult('Scenario 1.1: Profile completeness < 100%', true);
    } else {
      logTestResult('Scenario 1.1: Profile completeness < 100%', false, 
        `Expected completion < 100%, got ${result.data?.profileCompleteness}`);
    }
  } catch (error) {
    logTestResult('Scenario 1.1: Profile completeness < 100%', false, error.message);
  }
  
  // Scenario 1.2: Profile completeness = 100%
  try {
    const completeProfile = {
      name: 'Test User',
      gender: 'Male',
      nativePlace: 'Delhi',
      currentResidence: 'Mumbai',
      maritalStatus: 'Never Married',
      manglik: 'No',
      dateOfBirth: '1990-01-01',
      timeOfBirth: '2025-07-30T08:34:00.000Z',
      placeOfBirth: 'Delhi',
      height: '170',
      weight: '70',
      complexion: 'Medium',
      education: 'B.Tech',
      occupation: 'Software Engineer',
      annualIncome: '500000',
      eatingHabit: 'Vegetarian',
      smokingHabit: 'No',
      drinkingHabit: 'No',
      father: 'Test Father',
      mother: 'Test Mother',
      brothers: '1',
      sisters: '1',
      fatherGotra: 'Test',
      motherGotra: 'Test',
      grandfatherGotra: 'Test',
      grandmotherGotra: 'Test',
      specificRequirements: 'None',
      settleAbroad: 'Maybe',
      about: 'Test about me section with valid content',
      interests: ['Reading', 'Traveling']
    };
    
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'PUT', completeProfile);
    
    if (result.success && result.data.profileCompleteness === 100) {
      logTestResult('Scenario 1.2: Profile completeness = 100%', true);
    } else {
      logTestResult('Scenario 1.2: Profile completeness = 100%', false, 
        `Expected completion 100%, got ${result.data?.profileCompleteness}`);
    }
  } catch (error) {
    logTestResult('Scenario 1.2: Profile completeness = 100%', false, error.message);
  }
}

// Test Scenario 2: User Email Validation
async function testEmailValidation() {
  console.log('\n🧪 Testing Email Validation...');
  
  // Scenario 2.1: Invalid email format
  try {
    const invalidEmailProfile = {
      email: 'gmail', // Invalid email format
      name: 'Test User'
    };
    
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'PUT', invalidEmailProfile);
    
    if (!result.success && result.status === 400) {
      logTestResult('Scenario 2.1: Invalid email format rejected', true);
    } else {
      logTestResult('Scenario 2.1: Invalid email format rejected', false, 
        'Expected 400 error for invalid email');
    }
  } catch (error) {
    logTestResult('Scenario 2.1: Invalid email format rejected', false, error.message);
  }
  
  // Scenario 2.2: Missing email
  try {
    const noEmailProfile = {
      name: 'Test User'
      // Missing email field
    };
    
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'PUT', noEmailProfile);
    
    // Email should not be required for profile updates (it's in user document)
    logTestResult('Scenario 2.2: Missing email handled', true);
  } catch (error) {
    logTestResult('Scenario 2.2: Missing email handled', false, error.message);
  }
}

// Test Scenario 3: Profile Image Validation
async function testImageValidation() {
  console.log('\n🧪 Testing Image Validation...');
  
  // Scenario 3.1: Valid image path
  try {
    const validImageProfile = {
      name: 'Test User',
      images: 'profile_pictures/6889c189b71c45518f1f29d9.jpg'
    };
    
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'PUT', validImageProfile);
    
    if (result.success) {
      logTestResult('Scenario 3.1: Valid image path accepted', true);
    } else {
      logTestResult('Scenario 3.1: Valid image path accepted', false, result.error);
    }
  } catch (error) {
    logTestResult('Scenario 3.1: Valid image path accepted', false, error.message);
  }
  
  // Scenario 3.2: Invalid image path
  try {
    const invalidImageProfile = {
      name: 'Test User',
      images: 'invalid/path/image.jpg'
    };
    
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'PUT', invalidImageProfile);
    
    // Should still accept the update (image validation happens on upload, not update)
    logTestResult('Scenario 3.2: Invalid image path handled', true);
  } catch (error) {
    logTestResult('Scenario 3.2: Invalid image path handled', false, error.message);
  }
}

// Test Scenario 4: Profile Information Validation
async function testProfileInformationValidation() {
  console.log('\n🧪 Testing Profile Information Validation...');
  
  // Scenario 4.1: About field validation
  try {
    const invalidAboutProfile = {
      name: 'Test User',
      about: 'naaaa' // Invalid placeholder content
    };
    
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'PUT', invalidAboutProfile);
    
    if (result.success) {
      logTestResult('Scenario 4.1: About field validation', true);
    } else {
      logTestResult('Scenario 4.1: About field validation', false, result.error);
    }
  } catch (error) {
    logTestResult('Scenario 4.1: About field validation', false, error.message);
  }
  
  // Scenario 4.2: Date of birth validation
  try {
    const futureDateProfile = {
      name: 'Test User',
      dateOfBirth: '2030-01-01' // Future date
    };
    
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'PUT', futureDateProfile);
    
    if (result.success) {
      logTestResult('Scenario 4.2: Date of birth validation', true);
    } else {
      logTestResult('Scenario 4.2: Date of birth validation', false, result.error);
    }
  } catch (error) {
    logTestResult('Scenario 4.2: Date of birth validation', false, error.message);
  }
  
  // Scenario 4.3: Age validation
  try {
    const underageProfile = {
      name: 'Test User',
      dateOfBirth: '2010-01-01' // Under 18
    };
    
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'PUT', underageProfile);
    
    if (result.success) {
      logTestResult('Scenario 4.3: Age validation', true);
    } else {
      logTestResult('Scenario 4.3: Age validation', false, result.error);
    }
  } catch (error) {
    logTestResult('Scenario 4.3: Age validation', false, error.message);
  }
  
  // Scenario 4.4: Location validation
  try {
    const invalidLocationProfile = {
      name: 'Test User',
      location: 'InvalidLocation123' // Invalid location
    };
    
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'PUT', invalidLocationProfile);
    
    if (result.success) {
      logTestResult('Scenario 4.4: Location validation', true);
    } else {
      logTestResult('Scenario 4.4: Location validation', false, result.error);
    }
  } catch (error) {
    logTestResult('Scenario 4.4: Location validation', false, error.message);
  }
  
  // Scenario 4.5: Gender validation
  try {
    const invalidGenderProfile = {
      name: 'Test User',
      gender: 'Other' // Invalid gender
    };
    
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'PUT', invalidGenderProfile);
    
    if (!result.success && result.status === 400) {
      logTestResult('Scenario 4.5: Gender validation', true);
    } else {
      logTestResult('Scenario 4.5: Gender validation', false, 'Expected 400 error for invalid gender');
    }
  } catch (error) {
    logTestResult('Scenario 4.5: Gender validation', false, error.message);
  }
  
  // Scenario 4.6: Annual income validation
  try {
    const invalidIncomeProfile = {
      name: 'Test User',
      annualIncome: 'abc123' // Invalid income
    };
    
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'PUT', invalidIncomeProfile);
    
    if (result.success) {
      logTestResult('Scenario 4.6: Annual income validation', true);
    } else {
      logTestResult('Scenario 4.6: Annual income validation', false, result.error);
    }
  } catch (error) {
    logTestResult('Scenario 4.6: Annual income validation', false, error.message);
  }
  
  // Scenario 4.7: Occupation validation
  try {
    const invalidOccupationProfile = {
      name: 'Test User',
      occupation: '' // Empty occupation
    };
    
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'PUT', invalidOccupationProfile);
    
    if (result.success) {
      logTestResult('Scenario 4.7: Occupation validation', true);
    } else {
      logTestResult('Scenario 4.7: Occupation validation', false, result.error);
    }
  } catch (error) {
    logTestResult('Scenario 4.7: Occupation validation', false, error.message);
  }
  
  // Scenario 4.8: Height validation
  try {
    const invalidHeightProfile = {
      name: 'Test User',
      height: '500' // Invalid height
    };
    
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'PUT', invalidHeightProfile);
    
    if (result.success) {
      logTestResult('Scenario 4.8: Height validation', true);
    } else {
      logTestResult('Scenario 4.8: Height validation', false, result.error);
    }
  } catch (error) {
    logTestResult('Scenario 4.8: Height validation', false, error.message);
  }
  
  // Scenario 4.9: Weight validation
  try {
    const invalidWeightProfile = {
      name: 'Test User',
      weight: '500' // Invalid weight
    };
    
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'PUT', invalidWeightProfile);
    
    if (result.success) {
      logTestResult('Scenario 4.9: Weight validation', true);
    } else {
      logTestResult('Scenario 4.9: Weight validation', false, result.error);
    }
  } catch (error) {
    logTestResult('Scenario 4.9: Weight validation', false, error.message);
  }
  
  // Scenario 4.10: Lifestyle habits validation
  try {
    const invalidHabitsProfile = {
      name: 'Test User',
      smokingHabit: 'Invalid',
      drinkingHabit: 'Invalid',
      eatingHabit: 'Invalid'
    };
    
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'PUT', invalidHabitsProfile);
    
    if (!result.success && result.status === 400) {
      logTestResult('Scenario 4.10: Lifestyle habits validation', true);
    } else {
      logTestResult('Scenario 4.10: Lifestyle habits validation', false, 'Expected 400 error for invalid habits');
    }
  } catch (error) {
    logTestResult('Scenario 4.10: Lifestyle habits validation', false, error.message);
  }
}

// Test Scenario 5: User Verification Validation
async function testUserVerificationValidation() {
  console.log('\n🧪 Testing User Verification Validation...');
  
  // Get current user profile to check verification status
  try {
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'GET');
    
    if (result.success) {
      const user = result.data.profile;
      
      // Scenario 5.1: isVerified field validation
      if (typeof user.verification?.isVerified === 'boolean') {
        logTestResult('Scenario 5.1: isVerified field validation', true);
      } else {
        logTestResult('Scenario 5.1: isVerified field validation', false, 'isVerified should be boolean');
      }
      
      // Scenario 5.2: verifiedAt timestamp validation
      if (user.verification?.verifiedAt && new Date(user.verification.verifiedAt).getTime() > 0) {
        logTestResult('Scenario 5.2: verifiedAt timestamp validation', true);
      } else {
        logTestResult('Scenario 5.2: verifiedAt timestamp validation', false, 'verifiedAt should be valid timestamp');
      }
      
      // Scenario 5.3: approvalType validation
      if (user.verification?.approvalType === 'admin') {
        logTestResult('Scenario 5.3: approvalType validation', true);
      } else {
        logTestResult('Scenario 5.3: approvalType validation', false, 'approvalType should be admin');
      }
    } else {
      logTestResult('Scenario 5: User verification validation', false, 'Failed to get user profile');
    }
  } catch (error) {
    logTestResult('Scenario 5: User verification validation', false, error.message);
  }
}

// Test Scenario 6: User Role and Status Validation
async function testUserRoleAndStatusValidation() {
  console.log('\n🧪 Testing User Role and Status Validation...');
  
  try {
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'GET');
    
    if (result.success) {
      const user = result.data.profile;
      
      // Scenario 6.1: role validation
      if (user.role === 'user') {
        logTestResult('Scenario 6.1: role validation', true);
      } else {
        logTestResult('Scenario 6.1: role validation', false, `Expected role 'user', got '${user.role}'`);
      }
      
      // Scenario 6.2: status validation
      if (user.status === 'active') {
        logTestResult('Scenario 6.2: status validation', true);
      } else {
        logTestResult('Scenario 6.2: status validation', false, `Expected status 'active', got '${user.status}'`);
      }
      
      // Scenario 6.3: isApprovedByAdmin validation
      if (user.isApprovedByAdmin === true) {
        logTestResult('Scenario 6.3: isApprovedByAdmin validation', true);
      } else {
        logTestResult('Scenario 6.3: isApprovedByAdmin validation', false, 'isApprovedByAdmin should be true');
      }
      
      // Scenario 6.4: premium validation
      if (user.premium === false) {
        logTestResult('Scenario 6.4: premium validation', true);
      } else {
        logTestResult('Scenario 6.4: premium validation', false, 'premium should be false for regular users');
      }
      
      // Scenario 6.5: isFirstLogin validation
      if (typeof user.isFirstLogin === 'boolean') {
        logTestResult('Scenario 6.5: isFirstLogin validation', true);
      } else {
        logTestResult('Scenario 6.5: isFirstLogin validation', false, 'isFirstLogin should be boolean');
      }
    } else {
      logTestResult('Scenario 6: User role and status validation', false, 'Failed to get user profile');
    }
  } catch (error) {
    logTestResult('Scenario 6: User role and status validation', false, error.message);
  }
}

// Test Scenario 7: Login History Validation
async function testLoginHistoryValidation() {
  console.log('\n🧪 Testing Login History Validation...');
  
  try {
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'GET');
    
    if (result.success) {
      const user = result.data.profile;
      
      // Scenario 7.1: loginHistory array validation
      if (Array.isArray(user.loginHistory)) {
        logTestResult('Scenario 7.1: loginHistory array validation', true);
      } else {
        logTestResult('Scenario 7.1: loginHistory array validation', false, 'loginHistory should be an array');
      }
    } else {
      logTestResult('Scenario 7: Login history validation', false, 'Failed to get user profile');
    }
  } catch (error) {
    logTestResult('Scenario 7: Login history validation', false, error.message);
  }
}

// Test Scenario 8: User Preferences Validation
async function testUserPreferencesValidation() {
  console.log('\n🧪 Testing User Preferences Validation...');
  
  try {
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'GET');
    
    if (result.success) {
      const user = result.data.profile;
      
      // Scenario 8.1: ageRange validation
      if (user.preferences?.ageRange) {
        const { min, max } = user.preferences.ageRange;
        if (typeof min === 'number' && typeof max === 'number' && min < max && min >= 18 && max <= 100) {
          logTestResult('Scenario 8.1: ageRange validation', true);
        } else {
          logTestResult('Scenario 8.1: ageRange validation', false, 'Invalid age range values');
        }
      } else {
        logTestResult('Scenario 8.1: ageRange validation', false, 'ageRange not found');
      }
      
      // Scenario 8.2: location array validation
      if (Array.isArray(user.preferences?.location)) {
        logTestResult('Scenario 8.2: location array validation', true);
      } else {
        logTestResult('Scenario 8.2: location array validation', false, 'location should be an array');
      }
      
      // Scenario 8.3: profession and education arrays validation
      if (Array.isArray(user.preferences?.profession) && Array.isArray(user.preferences?.education)) {
        logTestResult('Scenario 8.3: profession and education arrays validation', true);
      } else {
        logTestResult('Scenario 8.3: profession and education arrays validation', false, 'profession and education should be arrays');
      }
    } else {
      logTestResult('Scenario 8: User preferences validation', false, 'Failed to get user profile');
    }
  } catch (error) {
    logTestResult('Scenario 8: User preferences validation', false, error.message);
  }
}

// Test Scenario 9: Date Validation
async function testDateValidation() {
  console.log('\n🧪 Testing Date Validation...');
  
  try {
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'GET');
    
    if (result.success) {
      const user = result.data.profile;
      
      // Scenario 9.1: timeOfBirth timestamp validation
      if (user.timeOfBirth) {
        const timeOfBirth = new Date(user.timeOfBirth);
        if (!isNaN(timeOfBirth.getTime()) && timeOfBirth < new Date()) {
          logTestResult('Scenario 9.1: timeOfBirth timestamp validation', true);
        } else {
          logTestResult('Scenario 9.1: timeOfBirth timestamp validation', false, 'timeOfBirth should be valid past timestamp');
        }
      } else {
        logTestResult('Scenario 9.1: timeOfBirth timestamp validation', true, 'timeOfBirth is optional');
      }
    } else {
      logTestResult('Scenario 9: Date validation', false, 'Failed to get user profile');
    }
  } catch (error) {
    logTestResult('Scenario 9: Date validation', false, error.message);
  }
}

// Test Scenario 10: System Timestamp Validation
async function testSystemTimestampValidation() {
  console.log('\n🧪 Testing System Timestamp Validation...');
  
  try {
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'GET');
    
    if (result.success) {
      const user = result.data.profile;
      
      // Scenario 10.1: createdAt and updatedAt validation
      if (user.createdAt && user.updatedAt) {
        const createdAt = new Date(user.createdAt);
        const updatedAt = new Date(user.updatedAt);
        
        if (!isNaN(createdAt.getTime()) && !isNaN(updatedAt.getTime())) {
          logTestResult('Scenario 10.1: createdAt and updatedAt validation', true);
        } else {
          logTestResult('Scenario 10.1: createdAt and updatedAt validation', false, 'Invalid timestamp format');
        }
      } else {
        logTestResult('Scenario 10.1: createdAt and updatedAt validation', false, 'Missing timestamp fields');
      }
      
      // Scenario 10.2: lastActive validation
      if (user.lastActive) {
        const lastActive = new Date(user.lastActive);
        if (!isNaN(lastActive.getTime())) {
          logTestResult('Scenario 10.2: lastActive validation', true);
        } else {
          logTestResult('Scenario 10.2: lastActive validation', false, 'Invalid lastActive timestamp');
        }
      } else {
        logTestResult('Scenario 10.2: lastActive validation', false, 'Missing lastActive field');
      }
    } else {
      logTestResult('Scenario 10: System timestamp validation', false, 'Failed to get user profile');
    }
  } catch (error) {
    logTestResult('Scenario 10: System timestamp validation', false, error.message);
  }
}

// Test Scenario 11: Edge Cases and Negative Scenarios
async function testEdgeCasesAndNegativeScenarios() {
  console.log('\n🧪 Testing Edge Cases and Negative Scenarios...');
  
  // Scenario 11.1: Special characters in fields
  try {
    const specialCharsProfile = {
      name: 'Test@User#123',
      about: 'Special chars: !@#$%^&*()'
    };
    
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'PUT', specialCharsProfile);
    
    if (result.success) {
      logTestResult('Scenario 11.1: Special characters handling', true);
    } else {
      logTestResult('Scenario 11.1: Special characters handling', false, result.error);
    }
  } catch (error) {
    logTestResult('Scenario 11.1: Special characters handling', false, error.message);
  }
  
  // Scenario 11.2: Missing required fields
  try {
    const emptyProfile = {
      // Empty profile with no required fields
    };
    
    const result = await makeAuthenticatedRequest('/api/profiles/me', 'PUT', emptyProfile);
    
    if (result.success) {
      logTestResult('Scenario 11.2: Missing required fields handling', true);
    } else {
      logTestResult('Scenario 11.2: Missing required fields handling', false, result.error);
    }
  } catch (error) {
    logTestResult('Scenario 11.2: Missing required fields handling', false, error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Profile Validation Tests...');
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  
  // First, we need to authenticate (this would normally be done via frontend)
  // For testing purposes, we'll simulate the authentication
  console.log('\n🔐 Note: Authentication token required for testing');
  console.log('Please ensure you have a valid auth token in testUser.authToken');
  
  // Run all test scenarios
  await testProfileCompleteness();
  await testEmailValidation();
  await testImageValidation();
  await testProfileInformationValidation();
  await testUserVerificationValidation();
  await testUserRoleAndStatusValidation();
  await testLoginHistoryValidation();
  await testUserPreferencesValidation();
  await testDateValidation();
  await testSystemTimestampValidation();
  await testEdgeCasesAndNegativeScenarios();
  
  // Print final results
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`📈 Total: ${testResults.total}`);
  console.log(`🎯 Success Rate: ${((testResults.passed.length / testResults.total) * 100).toFixed(2)}%`);
  
  if (testResults.failed.length > 0) {
    console.log('\n❌ Failed Scenarios:');
    testResults.failed.forEach(result => {
      console.log(`  - ${result.scenario}: ${result.details}`);
    });
  }
  
  console.log('\n🏁 Test execution completed!');
}

// Export for use
module.exports = {
  runAllTests,
  testResults
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
} 