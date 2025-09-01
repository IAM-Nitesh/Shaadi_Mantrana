// Session Cleanup Service
// Handles automatic cleanup of expired sessions and monitoring

const { JWTSessionManager } = require('../middleware/auth');
const { Session } = require('../models');

class SessionCleanupService {
  constructor() {
    this.cleanupInterval = null;
    this.monitoringInterval = null;
    this.isRunning = false;
  }

  // Start the cleanup service
  start() {
    if (this.isRunning) {
      console.log('ℹ️  Session cleanup service is already running');
      return;
    }

    console.log('🧹 Starting Session Cleanup Service...');

    // Run cleanup every hour
    this.cleanupInterval = setInterval(async () => {
      try {
        await JWTSessionManager.cleanExpiredSessions();
      } catch (error) {
        console.error('❌ Session cleanup failed:', error.message);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Run monitoring every 6 hours
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.logSessionStats();
      } catch (error) {
        console.error('❌ Session monitoring failed:', error.message);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours

    this.isRunning = true;
    console.log('✅ Session Cleanup Service started');
    console.log('   - Cleanup interval: Every 1 hour');
    console.log('   - Monitoring interval: Every 6 hours');
  }

  // Stop the cleanup service
  stop() {
    if (!this.isRunning) {
      return;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isRunning = false;
    console.log('🛑 Session Cleanup Service stopped');
  }

  // Get session statistics
  async getSessionStats() {
    try {
      const totalSessions = await Session.countDocuments();
      const active24h = await Session.countDocuments({
        lastAccessed: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      const active7d = await Session.countDocuments({
        lastAccessed: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });
      const expiredSessions = await Session.countDocuments({
        lastAccessed: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });

      return {
        total: totalSessions,
        active24h,
        active7d,
        expired: expiredSessions,
        storageMB: Math.round(totalSessions * 0.5 * 100) / 100 // Rough estimate: 0.5MB per session
      };
    } catch (error) {
      console.error('❌ Error getting session stats:', error.message);
      return null;
    }
  }

  // Log session statistics
  async logSessionStats() {
    const stats = await this.getSessionStats();
    if (!stats) return;

    console.log('📊 Session Statistics:');
    console.log(`   - Total sessions: ${stats.total}`);
    console.log(`   - Active (24h): ${stats.active24h}`);
    console.log(`   - Active (7d): ${stats.active7d}`);
    console.log(`   - Expired: ${stats.expired}`);
    console.log(`   - Estimated storage: ${stats.storageMB} MB`);

    // Alert if too many expired sessions
    if (stats.expired > stats.total * 0.3) {
      console.warn('⚠️  High number of expired sessions detected');
    }
  }

  // Manual cleanup trigger
  async runManualCleanup() {
    console.log('🔄 Running manual session cleanup...');
    try {
      await JWTSessionManager.cleanExpiredSessions();
      await this.logSessionStats();
      console.log('✅ Manual cleanup completed');
    } catch (error) {
      console.error('❌ Manual cleanup failed:', error.message);
    }
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      cleanupInterval: this.cleanupInterval ? 'Active' : 'Inactive',
      monitoringInterval: this.monitoringInterval ? 'Active' : 'Inactive'
    };
  }
}

// Singleton instance
const sessionCleanupService = new SessionCleanupService();

module.exports = sessionCleanupService;
