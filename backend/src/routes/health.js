// Health Check Routes
const express = require('express');
const router = express.Router();
const databaseService = require('../services/databaseService');
const connectionPoolManager = require('../services/connection-pool-manager');
const mongoose = require('mongoose');

function requireHealthToken(req, res, next) {
  if (process.env.NODE_ENV !== 'production') return next();

  const token = req.headers['x-ping-token'] || req.headers['x-health-token'];
  const required = process.env.HEALTH_CHECK_TOKEN || process.env.PING_TOKEN;

  if (!required) return next();
  if (token !== required) {
    return res.status(401).json({ status: 'unauthorized' });
  }
  return next();
}

// Basic health check — public response omits internal details in production
router.get('/', async (req, res) => {
  try {
    const dbHealth = await databaseService.healthCheck();
    const poolStatus = connectionPoolManager.getStatus();
    const isHealthy = dbHealth.status === 'healthy' && poolStatus.isHealthy;

    const token = req.headers['x-ping-token'] || req.headers['x-health-token'];
    const required = process.env.HEALTH_CHECK_TOKEN || process.env.PING_TOKEN;
    const showDetails =
      process.env.NODE_ENV !== 'production' ||
      (required && token === required);

    if (!showDetails) {
      return res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth,
      connectionPool: poolStatus,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/database', requireHealthToken, async (req, res) => {
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
        name: mongoose.connection.name,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

router.post('/database/reset', requireHealthToken, async (req, res) => {
  try {
    connectionPoolManager.resetCircuitBreaker();
    res.json({
      status: 'success',
      message: 'Circuit breaker reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Minimal ping for CI, keepalive, and load balancers
router.get('/ping', (req, res) => {
  res.json({
    status: 'pong',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
