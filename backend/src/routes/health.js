// Health Check Routes
// Comprehensive health monitoring for database and system status

const express = require('express');
const router = express.Router();
const databaseService = require('../services/databaseService');
const connectionPoolManager = require('../services/connection-pool-manager');
const mongoose = require('mongoose');

// Basic health check
router.get('/', async (req, res) => {
  try {
    const dbHealth = await databaseService.healthCheck();
    const poolStatus = connectionPoolManager.getStatus();
    
    const isHealthy = dbHealth.status === 'healthy' && poolStatus.isHealthy;
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth,
      connectionPool: poolStatus,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database-specific health check
router.get('/database', async (req, res) => {
  try {
    const dbHealth = await databaseService.healthCheck();
    const poolStatus = connectionPoolManager.getStatus();
    const dbStats = await databaseService.getStats();
    
    res.status(dbHealth.status === 'healthy' ? 200 : 503).json({
      status: dbHealth.status,
      connectionPool: poolStatus,
      stats: dbStats,
      mongoose: {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Reset circuit breaker endpoint (for manual recovery)
router.post('/database/reset', async (req, res) => {
  try {
    connectionPoolManager.resetCircuitBreaker();
    
    res.json({
      status: 'success',
      message: 'Circuit breaker reset',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple ping endpoint
router.get('/ping', (req, res) => {
  res.json({
    status: 'pong',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;