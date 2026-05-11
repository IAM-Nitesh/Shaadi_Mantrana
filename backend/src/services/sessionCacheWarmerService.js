// Session Cache Warmer Service
// Proactively warms the session cache to prevent cold starts and improve performance

const { JWTSessionManager } = require('../middleware/auth');
const { Session } = require('../models');

class SessionCacheWarmerService {
  constructor() {
    this.warmupInterval = null;
    this.bulkUpdateInterval = null;
    this.isRunning = false;
    this.lastWarmupTime = null;
    this.lastBulkUpdateTime = null;
    this.pendingUpdates = new Set(); // Track session IDs that need lastAccessed updates
    this.warmupConfig = {
      interval: 15 * 60 * 1000, // 15 minutes
      recentSessionThreshold: 24 * 60 * 60 * 1000, // 24 hours
      batchSize: 100, // Process 100 sessions at a time
      maxSessionsToWarm: 1000, // Maximum sessions to warm
      bulkUpdateInterval: 60 * 1000, // Process bulk updates every minute
      maxBulkUpdates: 500 // Maximum number of sessions to update in one batch
    };
  }

  // Start the cache warmer service
  start() {
    if (this.isRunning) {
      console.log('ℹ️  Session cache warmer service is already running');
      return;
    }

    console.log('🔥 Starting Session Cache Warmer Service...');

    // Run warmup at regular intervals
    this.warmupInterval = setInterval(() => {
      this.warmSessionCache().catch(error => {
        console.error('❌ Session cache warmup failed:', error.message);
      });
    }, this.warmupConfig.interval);
    
    // Run bulk updates at regular intervals
    this.bulkUpdateInterval = setInterval(() => {
      this.processBulkUpdates().catch(error => {
        console.error('❌ Session bulk update failed:', error.message);
      });
    }, this.warmupConfig.bulkUpdateInterval);
    
    // Run initial warmup immediately
    this.warmSessionCache().catch(error => {
      console.error('❌ Initial session cache warmup failed:', error.message);
    });

    this.isRunning = true;
    console.log('✅ Session Cache Warmer Service started');
    console.log(`   - Warmup interval: Every ${this.warmupConfig.interval / (60 * 1000)} minutes`);
    console.log(`   - Bulk update interval: Every ${this.warmupConfig.bulkUpdateInterval / (1000)} seconds`);
  }

  // Stop the cache warmer service
  stop() {
    if (!this.isRunning) {
      return;
    }

    if (this.warmupInterval) {
      clearInterval(this.warmupInterval);
      this.warmupInterval = null;
    }
    
    if (this.bulkUpdateInterval) {
      clearInterval(this.bulkUpdateInterval);
      this.bulkUpdateInterval = null;
    }

    this.isRunning = false;
    console.log('🛑 Session Cache Warmer Service stopped');
  }
  
  // Add a session ID to the pending updates queue
  queueSessionUpdate(sessionId) {
    if (!sessionId) return false;
    this.pendingUpdates.add(sessionId);
    return true;
  }
  
  // Process bulk lastAccessed updates
  async processBulkUpdates() {
    if (this.pendingUpdates.size === 0) {
      return { processed: 0 };
    }
    
    console.log(`🔄 Processing bulk session updates (${this.pendingUpdates.size} pending)`);
    
    try {
      // Take a limited number of sessions from the pending updates
      const sessionIds = Array.from(this.pendingUpdates).slice(0, this.warmupConfig.maxBulkUpdates);
      
      // Clear the processed sessions from pending updates
      sessionIds.forEach(id => this.pendingUpdates.delete(id));
      
      if (sessionIds.length === 0) {
        return { processed: 0 };
      }
      
      // Use the JWTSessionManager's bulk update method
      const result = await JWTSessionManager.bulkUpdateLastAccessed(sessionIds);
      
      console.log(`✅ Bulk session update completed: Updated ${result.modified}/${result.matched} sessions`);
      this.lastBulkUpdateTime = new Date();
      
      return {
        processed: sessionIds.length,
        result
      };
    } catch (error) {
      console.error('❌ Bulk session update error:', error);
      return { 
        processed: 0,
        error: error.message
      };
    }
  }

  // Warm session cache by preloading active sessions
  async warmSessionCache() {
    try {
      console.log('🔥 Starting session cache warmup...');
      const startTime = Date.now();

      // Find recently active sessions (within the last 24 hours)
      const cutoffTime = new Date(Date.now() - this.warmupConfig.recentSessionThreshold);
      
      // Count total sessions to warm
      const totalSessionsToWarm = await Session.countDocuments({
        lastAccessed: { $gt: cutoffTime }
      });
      
      console.log(`🔍 Found ${totalSessionsToWarm} sessions active in the last 24 hours`);
      
      // Limit the number of sessions to warm
      const sessionsToWarm = Math.min(totalSessionsToWarm, this.warmupConfig.maxSessionsToWarm);
      
      // Process in batches to avoid memory issues
      let processedCount = 0;
      let warmedCount = 0;
      
      // Use cursor for memory-efficient processing
      const cursor = Session.find({ lastAccessed: { $gt: cutoffTime } })
        .sort({ lastAccessed: -1 }) // Most recently accessed first
        .limit(sessionsToWarm)
        .cursor();
      
      // Process in batches
      const sessionBatch = [];
      
      for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        sessionBatch.push(doc);
        processedCount++;
        
        // Process batch when it reaches batch size or at the end
        if (sessionBatch.length >= this.warmupConfig.batchSize || processedCount >= sessionsToWarm) {
          const sessionIds = sessionBatch.map(session => session.sessionId);
          
          // Pre-warm the session cache
          for (const session of sessionBatch) {
            try {
              // Add to in-memory cache
              JWTSessionManager.warmSessionCache(session);
              warmedCount++;
            } catch (err) {
              console.error('❌ Error warming session cache for session:', session.sessionId);
            }
          }
          
          // Clear batch
          sessionBatch.length = 0;
          
          console.log(`🔥 Warmed ${warmedCount}/${processedCount} sessions so far...`);
        }
      }
      
      const duration = Date.now() - startTime;
      this.lastWarmupTime = new Date();
      
      console.log(`✅ Session cache warmup completed: ${warmedCount}/${processedCount} sessions in ${duration}ms`);
      
      return {
        processed: processedCount,
        warmed: warmedCount,
        duration: duration
      };
    } catch (error) {
      console.error('❌ Session cache warmup error:', error);
      throw error;
    }
  }

  // Get status of the cache warmer
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastWarmupTime: this.lastWarmupTime,
      config: this.warmupConfig
    };
  }
}

// Create singleton instance
const sessionCacheWarmer = new SessionCacheWarmerService();

module.exports = sessionCacheWarmer;