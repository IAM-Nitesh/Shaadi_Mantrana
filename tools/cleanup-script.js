#!/usr/bin/env node

/**
 * Code Cleanup Script
 * Removes temporary files, logs, and helps maintain code quality
 */

const fs = require('fs');
const path = require('path');

const CLEANUP_PATTERNS = [
  // Temporary files
  '**/*.tmp',
  '**/*.temp',
  '**/*.bak',
  '**/*.backup',
  '**/*~',
  '**/.#*',
  
  // Log files
  '**/logs/*.log',
  '**/tmp-logs/*.log',
  '**/temp/*.json',
  
  // Node modules temporary files
  '**/node_modules/**/*.un~',
  
  // Build artifacts
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  
  // IDE files
  '**/.vscode/settings.json',
  '**/.idea/**',
  '**/*.swp',
  '**/*.swo'
];

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build'
];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function cleanupFiles() {
  console.log('🧹 Starting code cleanup...');
  
  let cleanedCount = 0;
  let totalSize = 0;
  
  function walkDir(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        
        if (shouldIgnore(filePath)) {
          continue;
        }
        
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else {
          // Check if file matches cleanup patterns
          const shouldClean = CLEANUP_PATTERNS.some(pattern => {
            const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
            return regex.test(filePath);
          });
          
          if (shouldClean) {
            try {
              fs.unlinkSync(filePath);
              console.log(`🗑️  Removed: ${filePath}`);
              cleanedCount++;
              totalSize += stat.size;
            } catch (error) {
              console.error(`❌ Error removing ${filePath}:`, error.message);
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error reading directory ${dir}:`, error.message);
    }
  }
  
  // Start cleanup from current directory
  walkDir('.');
  
  console.log(`\n✅ Cleanup completed!`);
  console.log(`📊 Files removed: ${cleanedCount}`);
  console.log(`💾 Space saved: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}

function checkForHardcodedCredentials() {
  console.log('\n🔍 Checking for hardcoded credentials...');
  
  const credentialPatterns = [
    /mongodb\+srv:\/\/[^:]+:[^@]+@/,
    /password\s*=\s*['"][^'"]{8,}['"]/, // Only match passwords longer than 8 chars
    /secret\s*=\s*['"][^'"]{8,}['"]/, // Only match secrets longer than 8 chars
    /key\s*=\s*['"][^'"]{8,}['"]/, // Only match keys longer than 8 chars
    /token\s*=\s*['"][^'"]{8,}['"]/, // Only match tokens longer than 8 chars
    /api_key\s*=\s*['"][^'"]{8,}['"]/, // Only match API keys longer than 8 chars
    /private_key\s*=\s*['"][^'"]{8,}['"]/, // Only match private keys longer than 8 chars
    /public_key\s*=\s*['"][^'"]{8,}['"]/ // Only match public keys longer than 8 chars
  ];
  
  let foundCredentials = [];
  
  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      credentialPatterns.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
          // Skip files that are likely sanitization patterns
          if (filePath.includes('requestLogger') || 
              filePath.includes('sanitize') || 
              filePath.includes('logger') ||
              content.includes('***') ||
              content.includes('sanitize')) {
            return;
          }
          
          foundCredentials.push({
            file: filePath,
            pattern: pattern.toString(),
            line: content.split('\n').findIndex(line => pattern.test(line)) + 1
          });
        }
      });
    } catch (error) {
      // Ignore files that can't be read
    }
  }
  
  function scanDirectory(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        
        if (shouldIgnore(filePath)) {
          continue;
        }
        
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.json')) {
          scanFile(filePath);
        }
      }
    } catch (error) {
      // Ignore directories that can't be read
    }
  }
  
  scanDirectory('.');
  
  if (foundCredentials.length > 0) {
    console.log('🚨 Found potential hardcoded credentials:');
    foundCredentials.forEach(cred => {
      console.log(`   📁 ${cred.file}:${cred.line} - ${cred.pattern}`);
    });
  } else {
    console.log('✅ No hardcoded credentials found');
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Code Cleanup Script

Usage: node cleanup-script.js [options]

Options:
  --cleanup, -c    Remove temporary files and logs
  --check, -s      Check for hardcoded credentials
  --all, -a        Run all cleanup operations
  --help, -h       Show this help message

Examples:
  node cleanup-script.js --cleanup
  node cleanup-script.js --check
  node cleanup-script.js --all
    `);
    return;
  }
  
  if (args.includes('--cleanup') || args.includes('-c') || args.includes('--all') || args.includes('-a')) {
    cleanupFiles();
  }
  
  if (args.includes('--check') || args.includes('-s') || args.includes('--all') || args.includes('-a')) {
    checkForHardcodedCredentials();
  }
  
  if (args.length === 0) {
    console.log('No options specified. Use --help for usage information.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { cleanupFiles, checkForHardcodedCredentials };
