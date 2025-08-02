const fs = require('fs').promises;
const path = require('path');

class OTPStorage {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.memoryStore = new Map();
    this.storageFile = path.join(__dirname, '../../temp/otp-store.json');
    this.cleanupInterval = null;
    
    // Start cleanup interval
    this.startCleanup();
    
    // Load existing OTPs from file in development
    if (this.isDevelopment) {
      this.loadFromFile();
    }
  }

  async loadFromFile() {
    try {
      const data = await fs.readFile(this.storageFile, 'utf8');
      const stored = JSON.parse(data);
      const now = Date.now();
      
      // Only load non-expired OTPs
      for (const [email, otpData] of Object.entries(stored)) {
        if (otpData.expiresAt > now) {
          this.memoryStore.set(email, otpData);
        }
      }
      
      console.log(`📂 Loaded ${this.memoryStore.size} valid OTPs from file storage`);
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
      console.log('📂 No existing OTP storage file found, starting fresh');
    }
  }

  async saveToFile() {
    if (!this.isDevelopment) return;
    
    try {
      // Ensure temp directory exists
      const tempDir = path.dirname(this.storageFile);
      await fs.mkdir(tempDir, { recursive: true });
      
      // Convert Map to object for JSON serialization
      const data = {};
      for (const [email, otpData] of this.memoryStore.entries()) {
        data[email] = otpData;
      }
      
      await fs.writeFile(this.storageFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Failed to save OTP storage to file:', error.message);
    }
  }

  set(email, otpData) {
    this.memoryStore.set(email, otpData);
    
    if (this.isDevelopment) {
      this.saveToFile();
    }
  }

  get(email) {
    return this.memoryStore.get(email);
  }

  delete(email) {
    const deleted = this.memoryStore.delete(email);
    
    if (this.isDevelopment && deleted) {
      this.saveToFile();
    }
    
    return deleted;
  }

  clear() {
    this.memoryStore.clear();
    
    if (this.isDevelopment) {
      this.saveToFile();
    }
  }

  size() {
    return this.memoryStore.size;
  }

  entries() {
    return this.memoryStore.entries();
  }

  startCleanup() {
    // Clean up expired OTPs every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
  }

  cleanupExpired() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [email, otpData] of this.memoryStore.entries()) {
      if (otpData.expiresAt <= now) {
        this.memoryStore.delete(email);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired OTPs`);
      if (this.isDevelopment) {
        this.saveToFile();
      }
    }
  }

  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Create singleton instance
const otpStorage = new OTPStorage();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down OTP storage...');
  otpStorage.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down OTP storage...');
  otpStorage.stop();
  process.exit(0);
});

module.exports = otpStorage; 