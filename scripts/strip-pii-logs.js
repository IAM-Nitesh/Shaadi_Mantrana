#!/usr/bin/env node
/**
 * strip-pii-logs.js
 * Removes PII (email, phone, profile data) from production log statements
 * in backend/src/controllers/profileControllerMongo.js
 *
 * Run from project root: node scripts/strip-pii-logs.js
 * Safe to re-run — idempotent.
 */

const fs = require('fs');
const path = require('path');

const TARGET = path.join(__dirname, '../backend/src/controllers/profileControllerMongo.js');

if (!fs.existsSync(TARGET)) {
  console.error('Target file not found:', TARGET);
  process.exit(1);
}

let src = fs.readFileSync(TARGET, 'utf8');
const original = src;

// --- Transformations ---

// 1. Strip email from all log/warn/error interpolations: (${...email...})
src = src.replace(/ \(\$\{[^}]*email[^}]*\}\)/g, '');
src = src.replace(/ \(\$\{[^}]*\.email\}\)/g, '');

// 2. Remove lines that dump raw profile data or full update payloads
const linesToRemove = [
  /^\s*console\.log\(['\"`]📋 Raw updates:['\"`],\s*updates\);\s*$/m,
  /^\s*console\.log\(['\"`]🧹 Final sanitized updates:['\"`],\s*sanitizedUpdates\);\s*$/m,
  /^\s*console\.log\(['\"`]📋 Current profile data:['\"`],\s*profile\);\s*$/m,
];
linesToRemove.forEach(pattern => {
  src = src.replace(pattern, '// [SECURITY: PII log removed]');
});

// 3. Wrap remaining console.log/warn/error in NODE_ENV guard (except already-guarded ones)
// Lines that contain email, userUuid, phone, or profile fields
const piiPatterns = [
  /user\.email/,
  /req\.user\.email/,
  /user\.phone/,
  /profile\?\.caste/,
  /profile\?\.religion/,
];

const lines = src.split('\n');
const patched = lines.map(line => {
  // Skip already guarded lines
  if (line.includes('NODE_ENV') || line.includes('AUTH_DEBUG')) return line;
  // Skip comment lines
  if (line.trim().startsWith('//')) return line;

  const hasPii = piiPatterns.some(p => p.test(line));
  if (!hasPii) return line;

  // Only wrap console.* calls
  if (!line.match(/console\.(log|warn|error|debug)/)) return line;

  const indent = line.match(/^(\s*)/)[1];
  return `${indent}if (process.env.NODE_ENV !== 'production') { ${line.trim()} }`;
});

src = patched.join('\n');

if (src === original) {
  console.log('✅ No changes needed — file already clean.');
} else {
  fs.writeFileSync(TARGET, src, 'utf8');
  console.log('✅ PII log scrubbing applied to', TARGET);

  // Show summary of changed lines
  const originalLines = original.split('\n');
  const newLines = src.split('\n');
  let changes = 0;
  originalLines.forEach((line, i) => {
    if (line !== newLines[i]) {
      changes++;
      console.log(`  Line ${i + 1}: [modified]`);
    }
  });
  console.log(`Total lines modified: ${changes}`);
}
