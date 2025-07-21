const express = require('express');
const router = express.Router();
const { invitationController } = require('../config/controllers');
const { authenticateToken } = require('../middleware/auth');

// Protected invitation routes (require authentication)
router.post('/', authenticateToken, invitationController.createInvitation || invitationController.sendInvitation);
router.get('/', authenticateToken, invitationController.getInvitations);

// Legacy route support
router.post('/send', authenticateToken, invitationController.createInvitation || invitationController.sendInvitation);

module.exports = router;
