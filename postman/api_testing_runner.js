#!/usr/bin/env node

/**
 * Comprehensive API Testing Runner for Shaadi Mantra
 * Performs security testing, performance testing, and cleanup
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:5500';
const TEST_EMAIL = 'codebynitesh@gmail.com';
const TEST_OTP = '855568'; // This will be updated dynamically
const INVITE_EMAIL = 'invite@example.com';

// Test results storage
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  security: {
    vulnerabilities: [],
    passed: 0,
    failed: 0
  },
  performance: {
    slowEndpoints: [],
    averageResponseTime: 0,
    totalRequests: 0
  },
  cleanup: {
    deletedRecords: 0,
    errors: []
  }
};

// Authentication tokens
let authToken = null;
let refreshToken = null;
let sessionId = null;
let testUserId = null;

// Utility functions
const log = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  const startTime = Date.now();
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 10000
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      status: response.status,
      data: response.data,
      responseTime,
      headers: response.headers
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.message,
      responseTime,
      data: error.response?.data
    };
  }
};

// Test categories
const runAuthenticationTests = async () => {
  log('🔐 Starting Authentication Tests...', 'TEST');
  
  // Health check
  const health = await makeRequest('GET', '/api/auth/health');
  testResults.total++;
  if (health.success && health.status === 200) {
    testResults.passed++;
    log('✅ Health check passed', 'PASS');
  } else {
    testResults.failed++;
    log('❌ Health check failed', 'FAIL');
  }

  // Send OTP and get fresh OTP
  const sendOTP = await makeRequest('POST', '/api/auth/send-otp', { email: TEST_EMAIL });
  testResults.total++;
  if (sendOTP.success && sendOTP.status === 200) {
    testResults.passed++;
    log('✅ Send OTP passed', 'PASS');
    
    // Extract OTP from response
    const freshOTP = sendOTP.data.otp;
    if (freshOTP) {
      log(`📧 Fresh OTP received: ${freshOTP}`, 'INFO');
      
      // Verify OTP with fresh token
      const verifyOTP = await makeRequest('POST', '/api/auth/verify-otp', { 
        email: TEST_EMAIL, 
        otp: freshOTP 
      });
      testResults.total++;
      if (verifyOTP.success && verifyOTP.status === 200 && verifyOTP.data.session) {
        testResults.passed++;
        authToken = verifyOTP.data.session.accessToken;
        refreshToken = verifyOTP.data.session.refreshToken;
        sessionId = verifyOTP.data.session.sessionId;
        testUserId = verifyOTP.data.user?._id;
        log('✅ OTP verification passed', 'PASS');
      } else {
        testResults.failed++;
        log('❌ OTP verification failed', 'FAIL');
        log(`❌ Verification response: ${JSON.stringify(verifyOTP.data)}`, 'ERROR');
      }
    } else {
      testResults.failed++;
      log('❌ No OTP received in response', 'FAIL');
    }
  } else {
    testResults.failed++;
    log('❌ Send OTP failed', 'FAIL');
  }

  // Check preapproved email
  const preapproved = await makeRequest('GET', `/api/auth/preapproved/check?email=${TEST_EMAIL}`);
  testResults.total++;
  if (preapproved.success) {
    testResults.passed++;
    log('✅ Preapproved check passed', 'PASS');
  } else {
    testResults.failed++;
    log('❌ Preapproved check failed', 'FAIL');
  }
};

const runProfileTests = async () => {
  if (!authToken) {
    log('⚠️ Skipping profile tests - no auth token', 'WARN');
    return;
  }

  log('👤 Starting Profile Tests...', 'TEST');

  // Get my profile
  const getProfile = await makeRequest('GET', '/api/profiles/me', null, {
    'Authorization': `Bearer ${authToken}`
  });
  testResults.total++;
  if (getProfile.success && getProfile.status === 200) {
    testResults.passed++;
    log('✅ Get profile passed', 'PASS');
  } else {
    testResults.failed++;
    log('❌ Get profile failed', 'FAIL');
  }

  // Update profile
  const updateData = {
    name: 'Test User Updated',
    age: 25,
    gender: 'female',
    location: 'Mumbai, India',
    bio: 'Updated test bio',
    interests: ['reading', 'traveling'],
    profileCompleteness: 100
  };
  
  const updateProfile = await makeRequest('PUT', '/api/profiles/me', updateData, {
    'Authorization': `Bearer ${authToken}`
  });
  testResults.total++;
  if (updateProfile.success && updateProfile.status === 200) {
    testResults.passed++;
    log('✅ Update profile passed', 'PASS');
  } else {
    testResults.failed++;
    log('❌ Update profile failed', 'FAIL');
  }

  // Get all profiles
  const getAllProfiles = await makeRequest('GET', '/api/profiles?page=1&limit=10', null, {
    'Authorization': `Bearer ${authToken}`
  });
  testResults.total++;
  if (getAllProfiles.success && getAllProfiles.status === 200) {
    testResults.passed++;
    log('✅ Get all profiles passed', 'PASS');
  } else {
    testResults.failed++;
    log('❌ Get all profiles failed', 'FAIL');
  }
};

const runMatchingTests = async () => {
  if (!authToken) {
    log('⚠️ Skipping matching tests - no auth token', 'WARN');
    return;
  }

  log('💕 Starting Matching Tests...', 'TEST');

  // Get discovery profiles
  const discovery = await makeRequest('GET', '/api/matching/discovery', null, {
    'Authorization': `Bearer ${authToken}`
  });
  testResults.total++;
  if (discovery.success && discovery.status === 200) {
    testResults.passed++;
    log('✅ Discovery profiles passed', 'PASS');
  } else {
    testResults.failed++;
    log('❌ Discovery profiles failed', 'FAIL');
  }

  // Get liked profiles
  const liked = await makeRequest('GET', '/api/matching/liked', null, {
    'Authorization': `Bearer ${authToken}`
  });
  testResults.total++;
  if (liked.success && liked.status === 200) {
    testResults.passed++;
    log('✅ Get liked profiles passed', 'PASS');
  } else {
    testResults.failed++;
    log('❌ Get liked profiles failed', 'FAIL');
  }

  // Get matches
  const matches = await makeRequest('GET', '/api/matching/matches', null, {
    'Authorization': `Bearer ${authToken}`
  });
  testResults.total++;
  if (matches.success && matches.status === 200) {
    testResults.passed++;
    log('✅ Get matches passed', 'PASS');
  } else {
    testResults.failed++;
    log('❌ Get matches failed', 'FAIL');
  }

  // Get stats
  const stats = await makeRequest('GET', '/api/matching/stats', null, {
    'Authorization': `Bearer ${authToken}`
  });
  testResults.total++;
  if (stats.success && stats.status === 200) {
    testResults.passed++;
    log('✅ Get stats passed', 'PASS');
  } else {
    testResults.failed++;
    log('❌ Get stats failed', 'FAIL');
  }
};

const runSecurityTests = async () => {
  log('🔒 Starting Security Tests...', 'SECURITY');

  // SQL Injection test
  const sqlInjection = await makeRequest('POST', '/api/auth/verify-otp', {
    email: "'; DROP TABLE users; --",
    otp: '123456'
  });
  testResults.security.total++;
  if (sqlInjection.status === 400 || sqlInjection.status === 401) {
    testResults.security.passed++;
    log('✅ SQL injection protection working', 'SECURITY');
  } else {
    testResults.security.failed++;
    testResults.security.vulnerabilities.push('SQL Injection vulnerability detected');
    log('❌ SQL injection vulnerability detected', 'SECURITY');
  }

  // XSS test
  if (authToken) {
    const xssTest = await makeRequest('PUT', '/api/profiles/me', {
      name: "<script>alert('XSS')</script>",
      bio: "<img src=x onerror=alert('XSS')>",
      age: 25
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    testResults.security.total++;
    if (xssTest.status === 400 || xssTest.status === 422) {
      testResults.security.passed++;
      log('✅ XSS protection working', 'SECURITY');
    } else {
      testResults.security.failed++;
      testResults.security.vulnerabilities.push('XSS vulnerability detected');
      log('❌ XSS vulnerability detected', 'SECURITY');
    }
  }

  // Invalid token test
  const invalidToken = await makeRequest('GET', '/api/profiles/me', null, {
    'Authorization': 'Bearer invalid_token_here'
  });
  testResults.security.total++;
  if (invalidToken.status === 401) {
    testResults.security.passed++;
    log('✅ Invalid token rejection working', 'SECURITY');
  } else {
    testResults.security.failed++;
    testResults.security.vulnerabilities.push('Invalid token not properly rejected');
    log('❌ Invalid token not properly rejected', 'SECURITY');
  }

  // Missing token test
  const missingToken = await makeRequest('GET', '/api/profiles/me');
  testResults.security.total++;
  if (missingToken.status === 401) {
    testResults.security.passed++;
    log('✅ Missing token rejection working', 'SECURITY');
  } else {
    testResults.security.failed++;
    testResults.security.vulnerabilities.push('Missing token not properly rejected');
    log('❌ Missing token not properly rejected', 'SECURITY');
  }

  // Rate limiting test
  const rateLimitPromises = [];
  for (let i = 0; i < 10; i++) {
    rateLimitPromises.push(makeRequest('POST', '/api/auth/send-otp', {
      email: `rate_limit_test_${i}@example.com`
    }));
  }
  const rateLimitResults = await Promise.all(rateLimitPromises);
  const rateLimited = rateLimitResults.some(result => result.status === 429);
  testResults.security.total++;
  if (rateLimited) {
    testResults.security.passed++;
    log('✅ Rate limiting working', 'SECURITY');
  } else {
    testResults.security.failed++;
    testResults.security.vulnerabilities.push('Rate limiting not working');
    log('❌ Rate limiting not working', 'SECURITY');
  }
};

const runPerformanceTests = async () => {
  log('⚡ Starting Performance Tests...', 'PERFORMANCE');

  const performanceEndpoints = [
    { method: 'GET', endpoint: '/api/auth/health' },
    { method: 'GET', endpoint: '/api/profiles?page=1&limit=50', auth: true },
    { method: 'GET', endpoint: '/api/matching/discovery', auth: true }
  ];

  const responseTimes = [];

  for (const endpoint of performanceEndpoints) {
    const headers = endpoint.auth && authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    
    // Run 5 requests to get average response time
    const times = [];
    for (let i = 0; i < 5; i++) {
      const result = await makeRequest(endpoint.method, endpoint.endpoint, null, headers);
      if (result.success) {
        times.push(result.responseTime);
        responseTimes.push(result.responseTime);
      }
      await sleep(100); // Small delay between requests
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    testResults.performance.totalRequests += times.length;

    if (avgTime > 2000) {
      testResults.performance.slowEndpoints.push({
        endpoint: endpoint.endpoint,
        averageTime: avgTime
      });
      log(`⚠️ Slow endpoint: ${endpoint.endpoint} (${avgTime.toFixed(2)}ms)`, 'PERFORMANCE');
    } else {
      log(`✅ Fast endpoint: ${endpoint.endpoint} (${avgTime.toFixed(2)}ms)`, 'PERFORMANCE');
    }
  }

  testResults.performance.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
};

const runCleanup = async () => {
  log('🧹 Starting Cleanup...', 'CLEANUP');

  if (authToken) {
    // Delete test profile
    const deleteProfile = await makeRequest('DELETE', '/api/profiles/me', null, {
      'Authorization': `Bearer ${authToken}`
    });
    if (deleteProfile.success) {
      testResults.cleanup.deletedRecords++;
      log('✅ Test profile deleted', 'CLEANUP');
    } else {
      testResults.cleanup.errors.push('Failed to delete test profile');
      log('❌ Failed to delete test profile', 'CLEANUP');
    }

    // Logout
    const logout = await makeRequest('POST', '/api/auth/logout', null, {
      'Authorization': `Bearer ${authToken}`
    });
    if (logout.success) {
      log('✅ Logout successful', 'CLEANUP');
    } else {
      testResults.cleanup.errors.push('Failed to logout');
      log('❌ Failed to logout', 'CLEANUP');
    }
  }
};

const generateReport = () => {
  log('📊 Generating Test Report...', 'REPORT');

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%'
    },
    security: {
      total: testResults.security.total,
      passed: testResults.security.passed,
      failed: testResults.security.failed,
      vulnerabilities: testResults.security.vulnerabilities,
      successRate: ((testResults.security.passed / testResults.security.total) * 100).toFixed(2) + '%'
    },
    performance: {
      averageResponseTime: testResults.performance.averageResponseTime.toFixed(2) + 'ms',
      totalRequests: testResults.performance.totalRequests,
      slowEndpoints: testResults.performance.slowEndpoints
    },
    cleanup: {
      deletedRecords: testResults.cleanup.deletedRecords,
      errors: testResults.cleanup.errors
    }
  };

  // Save report to file
  const reportPath = path.join(__dirname, 'test_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SHAADI MANTRA API TESTING REPORT');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${report.summary.total}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Success Rate: ${report.summary.successRate}`);
  console.log('');
  console.log('🔒 Security Tests:');
  console.log(`  Passed: ${report.security.passed}/${report.security.total} (${report.security.successRate})`);
  if (report.security.vulnerabilities.length > 0) {
    console.log('  Vulnerabilities Found:');
    report.security.vulnerabilities.forEach(vuln => console.log(`    - ${vuln}`));
  }
  console.log('');
  console.log('⚡ Performance:');
  console.log(`  Average Response Time: ${report.performance.averageResponseTime}`);
  console.log(`  Total Requests: ${report.performance.totalRequests}`);
  if (report.performance.slowEndpoints.length > 0) {
    console.log('  Slow Endpoints:');
    report.performance.slowEndpoints.forEach(endpoint => {
      console.log(`    - ${endpoint.endpoint}: ${endpoint.averageTime.toFixed(2)}ms`);
    });
  }
  console.log('');
  console.log('🧹 Cleanup:');
  console.log(`  Deleted Records: ${report.cleanup.deletedRecords}`);
  if (report.cleanup.errors.length > 0) {
    console.log('  Errors:');
    report.cleanup.errors.forEach(error => console.log(`    - ${error}`));
  }
  console.log('='.repeat(60));
  console.log(`📄 Detailed report saved to: ${reportPath}`);

  return report;
};

// Main execution
const main = async () => {
  try {
    log('🚀 Starting Comprehensive API Testing...', 'START');
    
    await runAuthenticationTests();
    await runProfileTests();
    await runMatchingTests();
    await runSecurityTests();
    await runPerformanceTests();
    await runCleanup();
    
    const report = generateReport();
    
    // Exit with appropriate code
    if (testResults.failed > 0 || testResults.security.failed > 0) {
      log('❌ Some tests failed', 'END');
      process.exit(1);
    } else {
      log('✅ All tests passed successfully', 'END');
      process.exit(0);
    }
    
  } catch (error) {
    log(`❌ Test execution failed: ${error.message}`, 'ERROR');
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runAuthenticationTests,
  runProfileTests,
  runMatchingTests,
  runSecurityTests,
  runPerformanceTests,
  runCleanup,
  generateReport
}; 