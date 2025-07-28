const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionControllerMongo');
const { authenticateToken } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authenticateToken);

// Get connection by ID (for chat)
router.get('/:id', connectionController.getConnectionById.bind(connectionController));

// Get all connections for current user
router.get('/', connectionController.getUserConnections.bind(connectionController));

module.exports = router; 