#!/usr/bin/env node

/**
 * 🧠 SHAADI MANTRANA - KNOWLEDGE DECAY AUDITOR
 * Parses continuous-learning.md and checks for expired entries based on their Expiry Hint.
 */

const fs = require('fs');
const path = require('path');

const LEARNING_FILE = path.join(__dirname, '../ai-agents/knowledge-base/continuous-learning.md');

// Check if file exists
if (!fs.existsSync(LEARNING_FILE)) {
  console.error(`❌ Error: Learning file not found at ${LEARNING_FILE}`);
  process.exit(1);
}

const content = fs.readFileSync(LEARNING_FILE, 'utf8');

// Split the file by markdown horizontal rule separator
const sections = content.split(/\n---\n/);
const currentDate = new Date();

let expiredCount = 0;
let totalCount = 0;

console.log('🔍 Auditing continuous-learning.md for knowledge decay...');

// Regex patterns to parse learning headers and metadata
const titleRegex = /### 🎓 Learning:\s*(.+)/;
const dateRegex = /\*\*Date\*\*:\s*([^\n\r]+)/;
const expiryRegex = /\*\*Expiry Hint\*\*:\s*([^\n\r|]+)/i;

sections.forEach((section) => {
  const titleMatch = section.match(titleRegex);
  if (!titleMatch) return;

  totalCount++;
  const title = titleMatch[1].trim();
  const dateMatch = section.match(dateRegex);
  const expiryMatch = section.match(expiryRegex);

  const dateVal = dateMatch ? dateMatch[1].trim() : 'Unknown';
  let expiryHint = expiryMatch ? expiryMatch[1].trim() : 'Permanent';

  // Check if Expiry Hint looks like a date (e.g. YYYY-MM-DD)
  const datePattern = /(\d{4}-\d{2}-\d{2})/;
  const dateMatchInExpiry = expiryHint.match(datePattern);

  if (dateMatchInExpiry) {
    const expiryDateStr = dateMatchInExpiry[1];
    const expiryDate = new Date(expiryDateStr);

    if (!isNaN(expiryDate.getTime())) {
      if (expiryDate < currentDate) {
        expiredCount++;
        console.warn(`\x1b[33m⚠️  EXPIRED KNOWLEDGE DEBT:\x1b[0m "${title}"`);
        console.warn(`   - Registered: ${dateVal}`);
        console.warn(`   - Expired On: \x1b[31m${expiryDateStr}\x1b[0m`);
        console.warn(`   - Expiry Hint: "${expiryHint}"\n`);
      }
    }
  }
});

console.log(`📊 Knowledge Decay Summary:`);
console.log(`   - Total learnings evaluated: ${totalCount}`);
console.log(`   - Expired learning entries: ${expiredCount > 0 ? `\x1b[31m${expiredCount}\x1b[0m` : '\x1b[32m0\x1b[0m'}`);

// Exit code behavior based on arguments
const isStrict = process.argv.includes('--strict');
if (expiredCount > 0 && isStrict) {
  console.error('\x1b[31m❌ Fail: Strict mode enabled, blocking preflight due to knowledge debt.\x1b[0m');
  process.exit(1);
} else if (expiredCount > 0) {
  console.log('\x1b[33m💡 Recommendation: Archive expired entries or bump their expiry hints.\x1b[0m');
}

process.exit(0);
