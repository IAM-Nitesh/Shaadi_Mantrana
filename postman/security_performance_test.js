#!/usr/bin/env node

/**
 * Focused Security and Performance Testing for Shaadi Mantra
 * Tests endpoints that don't require authentication
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:5500';

// Test results storage
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  security: {
    vulnerabilities: [],
    passed: 0,
    failed: 0,
    total: 0
  },
  performance: {
    slowEndpoints: [],
    averageResponseTime: 0,
    totalRequests: 0,
    responseTimes: []
  }
};

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
      data: error.response?.data,
      headers: error.response?.headers
    };
  }
};

// Security Tests
const runSecurityTests = async () => {
  log('🔒 Starting Security Tests...', 'SECURITY');

  // 1. SQL Injection test
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

  // 2. NoSQL Injection test
  const noSqlInjection = await makeRequest('GET', '/api/profiles/uuid/{"$ne":null}');
  testResults.security.total++;
  if (noSqlInjection.status === 404 || noSqlInjection.status === 400) {
    testResults.security.passed++;
    log('✅ NoSQL injection protection working', 'SECURITY');
  } else {
    testResults.security.failed++;
    testResults.security.vulnerabilities.push('NoSQL Injection vulnerability detected');
    log('❌ NoSQL injection vulnerability detected', 'SECURITY');
  }

  // 3. Invalid token test
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

  // 4. Missing token test
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

  // 5. Large payload test
  const largePayload = await makeRequest('POST', '/api/auth/send-otp', {
    email: 'A'.repeat(10000)
  });
  testResults.security.total++;
  if (largePayload.status === 400 || largePayload.status === 413) {
    testResults.security.passed++;
    log('✅ Large payload protection working', 'SECURITY');
  } else {
    testResults.security.failed++;
    testResults.security.vulnerabilities.push('Large payload not properly rejected');
    log('❌ Large payload not properly rejected', 'SECURITY');
  }

  // 6. Security headers check
  const healthCheck = await makeRequest('GET', '/api/auth/health');
  testResults.security.total++;
  const securityHeaders = healthCheck.headers;
  const requiredHeaders = [
    'content-security-policy',
    'x-frame-options',
    'x-content-type-options',
    'strict-transport-security'
  ];
  
  const missingHeaders = requiredHeaders.filter(header => !securityHeaders[header]);
  if (missingHeaders.length === 0) {
    testResults.security.passed++;
    log('✅ Security headers properly configured', 'SECURITY');
  } else {
    testResults.security.failed++;
    testResults.security.vulnerabilities.push(`Missing security headers: ${missingHeaders.join(', ')}`);
    log(`❌ Missing security headers: ${missingHeaders.join(', ')}`, 'SECURITY');
  }

  // 7. CORS test
  const corsTest = await makeRequest('GET', '/api/auth/health', null, {
    'Origin': 'https://malicious-site.com'
  });
  testResults.security.total++;
  const corsHeader = corsTest.headers['access-control-allow-origin'];
  if (!corsHeader || corsHeader === 'null' || corsHeader !== 'https://malicious-site.com') {
    testResults.security.passed++;
    log('✅ CORS protection working', 'SECURITY');
  } else {
    testResults.security.failed++;
    testResults.security.vulnerabilities.push('CORS misconfiguration detected');
    log('❌ CORS misconfiguration detected', 'SECURITY');
  }
};

// Performance Tests
const runPerformanceTests = async () => {
  log('⚡ Starting Performance Tests...', 'PERFORMANCE');

  const performanceEndpoints = [
    { method: 'GET', endpoint: '/api/auth/health', name: 'Health Check' },
    { method: 'GET', endpoint: '/api/auth/preapproved/check?email=test@example.com', name: 'Preapproved Check' }
  ];

  for (const endpoint of performanceEndpoints) {
    const times = [];
    
    // Run 10 requests to get average response time
    for (let i = 0; i < 10; i++) {
      const result = await makeRequest(endpoint.method, endpoint.endpoint);
      if (result.success) {
        times.push(result.responseTime);
        testResults.performance.responseTimes.push(result.responseTime);
      }
      await sleep(50); // Small delay between requests
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    testResults.performance.totalRequests += times.length;

    if (avgTime > 1000) {
      testResults.performance.slowEndpoints.push({
        endpoint: endpoint.endpoint,
        name: endpoint.name,
        averageTime: avgTime
      });
      log(`⚠️ Slow endpoint: ${endpoint.name} (${avgTime.toFixed(2)}ms)`, 'PERFORMANCE');
    } else {
      log(`✅ Fast endpoint: ${endpoint.name} (${avgTime.toFixed(2)}ms)`, 'PERFORMANCE');
    }
  }

  if (testResults.performance.responseTimes.length > 0) {
    testResults.performance.averageResponseTime = testResults.performance.responseTimes.reduce((a, b) => a + b, 0) / testResults.performance.responseTimes.length;
  }
};

// Load Testing
const runLoadTest = async () => {
  log('📈 Starting Load Test...', 'LOAD');

  const concurrentRequests = 20;
  const promises = [];

  for (let i = 0; i < concurrentRequests; i++) {
    promises.push(makeRequest('GET', '/api/auth/health'));
  }

  const startTime = Date.now();
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

  log(`📊 Load Test Results:`, 'LOAD');
  log(`   Total Requests: ${concurrentRequests}`, 'LOAD');
  log(`   Successful: ${successful}`, 'LOAD');
  log(`   Failed: ${failed}`, 'LOAD');
  log(`   Success Rate: ${((successful / concurrentRequests) * 100).toFixed(2)}%`, 'LOAD');
  log(`   Average Response Time: ${avgResponseTime.toFixed(2)}ms`, 'LOAD');
  log(`   Total Time: ${totalTime}ms`, 'LOAD');
  log(`   Requests per second: ${(concurrentRequests / (totalTime / 1000)).toFixed(2)}`, 'LOAD');

  return {
    total: concurrentRequests,
    successful,
    failed,
    successRate: (successful / concurrentRequests) * 100,
    avgResponseTime,
    totalTime,
    rps: concurrentRequests / (totalTime / 1000)
  };
};

// Generate Report
const generateReport = () => {
  log('📊 Generating Test Report...', 'REPORT');

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: testResults.total > 0 ? ((testResults.passed / testResults.total) * 100).toFixed(2) + '%' : '0%'
    },
    security: {
      total: testResults.security.total,
      passed: testResults.security.passed,
      failed: testResults.security.failed,
      vulnerabilities: testResults.security.vulnerabilities,
      successRate: testResults.security.total > 0 ? ((testResults.security.passed / testResults.security.total) * 100).toFixed(2) + '%' : '0%'
    },
    performance: {
      averageResponseTime: testResults.performance.averageResponseTime.toFixed(2) + 'ms',
      totalRequests: testResults.performance.totalRequests,
      slowEndpoints: testResults.performance.slowEndpoints
    }
  };

  // Save report to file
  const reportPath = path.join(__dirname, 'security_performance_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SHAADI MANTRA SECURITY & PERFORMANCE REPORT');
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
  } else {
    console.log('  ✅ No vulnerabilities detected');
  }
  console.log('');
  console.log('⚡ Performance:');
  console.log(`  Average Response Time: ${report.performance.averageResponseTime}`);
  console.log(`  Total Requests: ${report.performance.totalRequests}`);
  if (report.performance.slowEndpoints.length > 0) {
    console.log('  Slow Endpoints:');
    report.performance.slowEndpoints.forEach(endpoint => {
      console.log(`    - ${endpoint.name}: ${endpoint.averageTime.toFixed(2)}ms`);
    });
  } else {
    console.log('  ✅ All endpoints performing well');
  }
  console.log('='.repeat(60));
  console.log(`📄 Detailed report saved to: ${reportPath}`);

  return report;
};

// Main execution
const main = async () => {
  try {
    log('🚀 Starting Security & Performance Testing...', 'START');
    
    await runSecurityTests();
    await runPerformanceTests();
    const loadTestResults = await runLoadTest();
    
    const report = generateReport();
    
    // Add load test results to report
    report.loadTest = loadTestResults;
    
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
  runSecurityTests,
  runPerformanceTests,
  runLoadTest,
  generateReport
}; 