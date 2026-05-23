#!/usr/bin/env node

/**
 * Frontend Environment Validation Script
 * This script validates that all required environment variables are set correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating frontend environment configuration...\n');

// Load environment variables
require('dotenv').config();

// Check if we're in a production environment
const isProduction = process.env.VERCEL === 'true' || 
                    process.env.NODE_ENV === 'production';

console.log('🔧 Environment Status:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   VERCEL: ${process.env.VERCEL || 'not set'}`);
console.log(`   Detected as production: ${isProduction}\n`);

// Required environment variables (only in production)
const requiredVars = {
  'NEXT_PUBLIC_API_BASE_URL': 'Backend API base URL'
};

// Production-specific variables
const productionVars = {
  'NEXT_PUBLIC_B2_BUCKET_NAME': 'Backblaze B2 bucket name',
  'NEXT_PUBLIC_B2_BUCKET_ID': 'Backblaze B2 bucket ID'
};

// Optional variables
const optionalVars = {
  'NEXT_PUBLIC_APP_NAME': 'Application name',
  'NEXT_PUBLIC_APP_VERSION': 'Application version',
  'NEXT_PUBLIC_ENABLE_DEBUG': 'Enable debug mode',
  'NEXT_PUBLIC_ENABLE_ANALYTICS': 'Enable analytics',
  'NEXT_PUBLIC_ENABLE_HTTPS': 'Enable HTTPS',
  'NEXT_PUBLIC_ENABLE_SECURE_COOKIES': 'Enable secure cookies'
};

console.log('📋 Required Environment Variables:');
let missingVars = 0;

for (const [varName, description] of Object.entries(requiredVars)) {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName}: ${description} - Set`);
  } else {
    if (isProduction) {
      console.log(`   ❌ ${varName}: ${description} - Missing (REQUIRED in production)`);
      missingVars++;
    } else {
      console.log(`   ⚠️  ${varName}: ${description} - Missing (will be required in production)`);
    }
  }
}

console.log('\n🌐 Production Environment Variables:');
for (const [varName, description] of Object.entries(productionVars)) {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName}: ${description} - Set`);
  } else {
    if (isProduction) {
      console.log(`   ❌ ${varName}: ${description} - Missing (REQUIRED in production)`);
      missingVars++;
    } else {
      console.log(`   ⚠️  ${varName}: ${description} - Missing (will be required in production)`);
    }
  }
}

console.log('\n🔧 Optional Environment Variables:');
for (const [varName, description] of Object.entries(optionalVars)) {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName}: ${description} - Set`);
  } else {
    console.log(`   ℹ️  ${varName}: ${description} - Not set (optional)`);
  }
}

// Check for hardcoded values in source code
console.log('\n🔍 Checking for hardcoded values in source code...');

const sourceFiles = [
  'src/services/configService.ts',
  'next.config.js'
  // Exclude package.json as it contains development scripts with hardcoded URLs
];

let hardcodedIssues = 0;

for (const filePath of sourceFiles) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for problematic hardcoded patterns (production URLs, not localhost)
    const problematicPatterns = [
      /https:\/\/shaadi-mantrana\.onrender\.com/g,
      /https:\/\/shaadi-mantrana-app-frontend\.vercel\.app/g // Old deprecated URL
    ];
    
    // Check for acceptable localhost patterns (these are NOT warnings)
    const acceptablePatterns = [
      /localhost:3000/g,
      /localhost:3001/g,
      /127\.0\.0\.1:3000/g,
      /127\.0\.0\.1:3001/g
    ];
    
    for (const pattern of problematicPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`   ❌ ${filePath}: Found hardcoded production URL - ${matches[0]}`);
        hardcodedIssues++;
      }
    }
    
    // Log acceptable localhost patterns as info, not warnings
    for (const pattern of acceptablePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`   ℹ️  ${filePath}: Found localhost URL - ${matches[0]} (acceptable for development)`);
      }
    }
  }
}

if (hardcodedIssues === 0) {
  console.log('   ✅ No problematic hardcoded values found');
}

// Configuration validation
console.log('\n⚙️  Configuration Validation:');
try {
  const config = require('../src/services/configService');
  console.log(`   ✅ Config service loaded successfully`);
  console.log(`   ✅ API Base URL: ${config.config.apiBaseUrl || 'Not set'}`);
  console.log(`   ✅ App Name: ${config.config.appName}`);
  console.log(`   ✅ App Version: ${config.config.appVersion}`);
} catch (error) {
  console.log(`   ❌ Config service loading failed: ${error.message}`);
  console.log(`   ℹ️  This is expected if the service hasn't been built yet`);
  // Don't count this as a missing variable since it's a build-time issue
}

// Summary
console.log('\n📊 Validation Summary:');
if (missingVars === 0 && hardcodedIssues === 0) {
  console.log('   ✅ All required environment variables are set');
  console.log('   ✅ No problematic hardcoded values found');
  console.log('   ✅ Configuration is valid');
} else {
  if (missingVars > 0) {
    console.log(`   ⚠️  ${missingVars} missing environment variables`);
  }
  if (hardcodedIssues > 0) {
    console.log(`   ❌ ${hardcodedIssues} problematic hardcoded values found`);
  }
}

if (isProduction) {
  console.log('\n🚀 Production Environment Detected');
  if (missingVars === 0) {
    console.log('   ✅ All production variables are properly configured');
    console.log('   ✅ Ready for production deployment');
  } else {
    console.log('   ❌ Missing required production variables');
    console.log('   ❌ Please set all required variables before deployment');
  }
} else {
  console.log('\n🛠️  Development Environment Detected');
  console.log('   - Environment variables are optional for development');
  console.log('   - Set NODE_ENV=production for production deployment');
  console.log('   - Configure production environment variables when deploying');
}

console.log('\n✨ Validation complete!');
