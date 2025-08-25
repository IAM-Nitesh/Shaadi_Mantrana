const fs = require('fs').promises;
const path = require('path');

// Simple OTP storage without class to avoid 'this' context issues
const memoryStore = {}; // Use simple object instead of Map
const isDevelopment = process.env.NODE_ENV === 'development';
const storageFile = path.join(__dirname, '../../temp/otp-store.json');
let cleanupInterval = null;

console.log('🔐 OTPStorage: Initializing with memoryStore as object');
console.log('🔐 OTPStorage: memoryStore type:', typeof memoryStore);

// Start cleanup interval
function startCleanup() {
  // Clean up expired OTPs every 5 minutes
  cleanupInterval = setInterval(() => {
    cleanupExpired();
  }, 5 * 60 * 1000);
}

function cleanupExpired() {
  const now = Date.now();
  let cleanedCount = 0;
  
  console.log(`🔐 OTPStorage: Starting cleanup, current store size: ${size()}`);
  
  for (const [email, otpData] of Object.entries(memoryStore)) {
    console.log(`🔐 OTPStorage: Checking ${email}, expires at ${new Date(otpData.expiresAt).toISOString()}, current time: ${new Date(now).toISOString()}`);
    if (otpData.expiresAt <= now) {
      console.log(`🔐 OTPStorage: Expired OTP found for ${email}, deleting`);
      delete memoryStore[email];
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired OTPs`);
    if (isDevelopment) {
      saveToFile();
    }
  } else {
    console.log(`🔐 OTPStorage: No expired OTPs found during cleanup`);
  }
}

async function saveToFile() {
  if (!isDevelopment) return;
  
  try {
    // Ensure temp directory exists
    const tempDir = path.dirname(storageFile);
    await fs.mkdir(tempDir, { recursive: true });
    
    await fs.writeFile(storageFile, JSON.stringify(memoryStore, null, 2));
  } catch (error) {
    console.error('❌ Failed to save OTP storage to file:', error.message);
  }
}

function set(email, otpData) {
  console.log(`🔐 OTPStorage: Setting OTP for ${email}, expires at ${new Date(otpData.expiresAt).toISOString()}`);
  
  memoryStore[email] = otpData;
  console.log(`🔐 OTPStorage: Current store size after set: ${size()}`);
  
  if (isDevelopment) {
    saveToFile();
  }
}

function get(email) {
  const otpData = memoryStore[email];
  console.log(`🔐 OTPStorage: Getting OTP for ${email}, found: ${!!otpData}`);
  if (otpData) {
    console.log(`🔐 OTPStorage: OTP expires at ${new Date(otpData.expiresAt).toISOString()}, current time: ${new Date().toISOString()}`);
  }
  return otpData;
}

function deleteOTP(email) {
  console.log(`🔐 OTPStorage: Deleting OTP for ${email}`);
  const deleted = delete memoryStore[email];
  console.log(`🔐 OTPStorage: Delete result: ${deleted}, current store size: ${size()}`);
  
  if (isDevelopment && deleted) {
    saveToFile();
  }
  
  return deleted;
}

function clear() {
  Object.keys(memoryStore).forEach(key => delete memoryStore[key]);
  
  if (isDevelopment) {
    saveToFile();
  }
}

function size() {
  return Object.keys(memoryStore).length;
}

function entries() {
  return Object.entries(memoryStore);
}

function stop() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// Start cleanup
startCleanup();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down OTP storage...');
  stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down OTP storage...');
  stop();
  process.exit(0);
});

// Export the functions
module.exports = {
  set,
  get,
  delete: deleteOTP,
  clear,
  size,
  entries,
  stop
}; 