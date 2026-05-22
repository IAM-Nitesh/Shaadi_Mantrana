#!/usr/bin/env node

/**
 * 🧠 SHAADI MANTRANA - AUTOMATED REGRESSION TEARDOWN BRIDGE
 * Usage: node scripts/resolve-regression.js "<keyword>"
 * Example: node scripts/resolve-regression.js "green state"
 */

const fs = require('fs');
const path = require('path');

const keyword = process.argv[2];
if (!keyword) {
  console.error('❌ Error: Please provide a search keyword or title to resolve the regression.');
  console.error('   Usage: node scripts/resolve-regression.js "<keyword>"');
  process.exit(1);
}

const FEEDBACK_FILE = path.join(__dirname, '../ai-agents/knowledge-base/feedback.md');
const PENDING_FILE = path.join(__dirname, '../ai-agents/PENDING_ISSUES.md');
const FEATURES_DIR = path.join(__dirname, '../tests/playwright/features');

// Helper to escape regex special chars
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const searchRegex = new RegExp(escapeRegExp(keyword), 'i');

// 1. Process feedback.md
if (!fs.existsSync(FEEDBACK_FILE)) {
  console.error(`❌ Error: feedback.md not found at ${FEEDBACK_FILE}`);
  process.exit(1);
}

let feedbackContent = fs.readFileSync(FEEDBACK_FILE, 'utf8');

// Find all entries under "Active Findings"
const activeFindingsHeaderIndex = feedbackContent.indexOf('## Active Findings');
const resolvedHeaderIndex = feedbackContent.indexOf('## Resolved / Escalated to Knowledge Base');

if (activeFindingsHeaderIndex === -1 || resolvedHeaderIndex === -1) {
  console.error('❌ Error: Could not locate "Active Findings" or "Resolved" headers in feedback.md');
  process.exit(1);
}

const activeSection = feedbackContent.substring(activeFindingsHeaderIndex, resolvedHeaderIndex);
const resolvedSection = feedbackContent.substring(resolvedHeaderIndex);

// Split active section into blocks starting with ###
const activeBlocks = activeSection.split(/\n(### [^\n]+)/);
let matchedFeedbackBlock = '';
let matchedTitle = '';
let newActiveSection = activeBlocks[0]; // The header part

for (let i = 1; i < activeBlocks.length; i += 2) {
  const header = activeBlocks[i];
  const body = activeBlocks[i + 1] || '';
  const fullBlock = header + body;

  if (searchRegex.test(header) || searchRegex.test(body)) {
    matchedFeedbackBlock = fullBlock;
    matchedTitle = header.replace(/^###\s*/, '').trim();
    console.log(`✅ Matched active finding in feedback.md: "${matchedTitle}"`);
  } else {
    newActiveSection += '\n' + fullBlock;
  }
}

if (!matchedFeedbackBlock) {
  console.log(`⚠️  Warning: No active finding found in feedback.md matching keyword "${keyword}".`);
} else {
  // Append matched block to resolved section
  const updatedResolvedSection = resolvedSection.trim() + '\n\n' + matchedFeedbackBlock.trim() + '\n';
  
  // Reconstruct feedback.md
  feedbackContent = feedbackContent.substring(0, activeFindingsHeaderIndex) + 
                    newActiveSection.trim() + '\n\n' + 
                    updatedResolvedSection;
  
  fs.writeFileSync(FEEDBACK_FILE, feedbackContent, 'utf8');
  console.log('📝 Updated feedback.md (moved active finding to Resolved).');
}

// 2. Process PENDING_ISSUES.md
if (!fs.existsSync(PENDING_FILE)) {
  console.error(`❌ Error: PENDING_ISSUES.md not found at ${PENDING_FILE}`);
  process.exit(1);
}

let pendingContent = fs.readFileSync(PENDING_FILE, 'utf8');
const pendingLines = pendingContent.split('\n');
let updatedPendingContent = '';
let struckCount = 0;

for (let i = 0; i < pendingLines.length; i++) {
  const line = pendingLines[i];
  // Match headers starting with ### inside Pending section (which is before Processed section)
  if (line.startsWith('###') && searchRegex.test(line) && !line.includes('~~')) {
    // Strike through this line
    const cleanHeader = line.replace(/^###\s*/, '').trim();
    const struckLine = `### ~~${cleanHeader}~~`;
    updatedPendingContent += struckLine + '\n';
    struckCount++;
    console.log(`✅ Struck through pending issue: "${cleanHeader}"`);
  } else {
    updatedPendingContent += line + '\n';
  }
}

if (struckCount === 0) {
  console.log(`⚠️  Warning: No matching unstruck issue header found in PENDING_ISSUES.md.`);
} else {
  fs.writeFileSync(PENDING_FILE, updatedPendingContent.trim() + '\n', 'utf8');
  console.log('📝 Updated PENDING_ISSUES.md.');
}

// 3. Create Playwright Feature skeleton
if (!matchedTitle) {
  matchedTitle = keyword;
}

const cleanFileName = matchedTitle
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/(^_+|_+$)/g, '');

const featureFilePath = path.join(FEATURES_DIR, `regression_${cleanFileName}.feature`);

if (!fs.existsSync(FEATURES_DIR)) {
  fs.mkdirSync(FEATURES_DIR, { recursive: true });
}

if (fs.existsSync(featureFilePath)) {
  console.log(`⚠️  Warning: Feature file already exists at ${featureFilePath}. Skipping creation.`);
} else {
  const featureContent = `@regression
Feature: Regression Test - ${matchedTitle}

  Scenario: Prevent regression and verify fix
    Given I am logged in as an active user
    # TODO: Implement reproduction steps for: ${matchedTitle}
    # Then verify correct state is preserved
`;
  
  fs.writeFileSync(featureFilePath, featureContent, 'utf8');
  console.log(`🎨 Created Playwright regression feature template at:`);
  console.log(`   ${featureFilePath}`);
}

console.log('🏁 Regression teardown process complete.');
process.exit(0);
