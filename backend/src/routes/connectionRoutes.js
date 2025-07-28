const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionControllerMongo');
const { authenticateToken } = require('../middleware/auth');

// Create a new connection
router.post('/', authenticateToken, connectionController.createConnection);

// Get all connections for the current user
router.get('/', authenticateToken, connectionController.getConnections);

// Get a single connection by UUID
router.get('/:uuid', authenticateToken, connectionController.getConnectionByUuid);

// Update a connection (status, metadata)
router.patch('/:uuid', authenticateToken, connectionController.updateConnection);

// Delete a connection (unmatch/block)
router.delete('/:uuid', authenticateToken, connectionController.deleteConnection);

module.exports = router; 