# Shaadi Mantra API Testing Suite

Comprehensive testing suite for the Shaadi Mantra backend API with security and performance testing capabilities.

## 📋 Overview

This testing suite includes:
- **Postman Collection v4** - Complete API testing collection
- **Automated Test Runner** - Node.js script for comprehensive testing
- **Security Testing** - Penetration testing and vulnerability assessment
- **Performance Testing** - Response time and load testing
- **Cleanup Scripts** - Automatic test data cleanup

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Backend server running on `http://localhost:5500`
- Postman (for manual testing)

### Installation

1. **Install dependencies:**
   ```bash
   cd postman
   npm install
   ```

2. **Import Postman Collection:**
   - Open Postman
   - Import `Shaadi_Mantra_API_Collection_v4_Comprehensive_Testing.json`
   - Set environment variables (see Configuration section)

3. **Run automated tests:**
   ```bash
   npm test
   ```

## 📁 File Structure

```
postman/
├── Shaadi_Mantra_API_Collection_v4_Comprehensive_Testing.json  # Postman collection
├── api_testing_runner.js                                       # Automated test runner
├── package.json                                                # Dependencies
├── README.md                                                   # This file
└── test_report.json                                           # Generated test report
```

## ⚙️ Configuration

### Environment Variables

Set these in your Postman environment or modify the test runner:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `baseUrl` | Backend API base URL | `http://localhost:5500` |
| `testEmail` | Test user email | `test@example.com` |
| `testOTP` | Test OTP code | `123456` |
| `inviteEmail` | Email for invitation tests | `invite@example.com` |

### Test Configuration

Modify `api_testing_runner.js` for custom settings:

```javascript
const BASE_URL = 'http://localhost:5500';
const TEST_EMAIL = 'test@example.com';
const TEST_OTP = '123456';
```

## 🧪 Test Categories

### 1. Authentication Tests
- Health check
- OTP sending and verification
- Token management
- Session handling
- Preapproved email checks

### 2. Profile Management Tests
- CRUD operations on user profiles
- Profile updates and validation
- Profile completeness checks
- Onboarding message handling

### 3. Matching & Discovery Tests
- Discovery profile retrieval
- Like/Pass functionality
- Match creation and management
- Statistics and analytics

### 4. Chat & Connections Tests
- Connection management
- Message sending and retrieval
- Read status updates

### 5. File Upload Tests
- Single and multiple file uploads
- Profile picture management
- Storage statistics

### 6. Invitation Tests
- Email invitation sending
- Invitation management

## 🔒 Security Testing

### Vulnerability Tests
- **SQL Injection Protection**
- **XSS (Cross-Site Scripting) Protection**
- **NoSQL Injection Protection**
- **Authentication Bypass**
- **Rate Limiting**
- **Large Payload Handling**

### Security Headers Check
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

## ⚡ Performance Testing

### Response Time Analysis
- Average response time calculation
- Slow endpoint identification
- Performance benchmarking

### Load Testing
- Concurrent request handling
- Rate limiting effectiveness
- Resource utilization

## 📊 Test Reports

### Automated Reports
The test runner generates comprehensive reports including:

```json
{
  "summary": {
    "total": 25,
    "passed": 23,
    "failed": 2,
    "successRate": "92.00%"
  },
  "security": {
    "vulnerabilities": [],
    "successRate": "100.00%"
  },
  "performance": {
    "averageResponseTime": "245.67ms",
    "slowEndpoints": []
  }
}
```

### Manual Testing with Postman
1. Import the collection
2. Set up environment variables
3. Run individual requests or entire folders
4. Review response times and status codes

## 🧹 Cleanup

### Automatic Cleanup
The test runner automatically:
- Deletes test profiles
- Logs out test sessions
- Clears authentication tokens
- Removes test data

### Manual Cleanup
If tests fail, manually clean up:

```bash
# Run cleanup only
npm run test:cleanup
```

## 🚨 Troubleshooting

### Common Issues

1. **Backend not running:**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:5500
   ```
   **Solution:** Start the backend server first

2. **Authentication failures:**
   ```
   Error: OTP verification failed
   ```
   **Solution:** Check if test user exists and OTP is correct

3. **Rate limiting:**
   ```
   Error: Too many requests
   ```
   **Solution:** Wait 15 minutes or adjust rate limits in development

4. **Timeout errors:**
   ```
   Error: Request timeout
   ```
   **Solution:** Check server performance and increase timeout if needed

### Debug Mode

Enable detailed logging:

```javascript
// In api_testing_runner.js
const DEBUG = true;
```

## 📈 Performance Benchmarks

### Expected Response Times
- Health check: < 100ms
- Authentication: < 500ms
- Profile operations: < 1000ms
- Discovery: < 2000ms
- File uploads: < 5000ms

### Load Testing Results
- Concurrent users: 100
- Requests per second: 50
- Error rate: < 1%

## 🔧 Customization

### Adding New Tests

1. **Add to Postman Collection:**
   - Create new request in appropriate folder
   - Add test scripts for validation

2. **Add to Test Runner:**
   ```javascript
   const runCustomTests = async () => {
     // Your test logic here
   };
   ```

### Custom Security Tests

```javascript
// Add to runSecurityTests function
const customSecurityTest = await makeRequest('POST', '/api/custom', {
  payload: 'malicious_data'
});
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review test logs in console
3. Check generated test reports
4. Verify backend server status

## 📝 Changelog

### v4.0.0 (Current)
- Added comprehensive security testing
- Added performance benchmarking
- Added automatic cleanup
- Added detailed reporting
- Added Postman collection v4

### v3.0.0
- Added authentication tests
- Added profile management tests
- Added basic security checks

---

**Note:** Always run tests in a development environment. Never run security tests against production systems without proper authorization. 