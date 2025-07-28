// MongoDB-integrated Connection Controller
const { Connection, User } = require('../models');
const { v4: uuidv4 } = require('uuid');

class ConnectionController {
  // Create a new connection (match/request)
  async createConnection(req, res) {
    try {
      const { targetUserId, type = 'like' } = req.body;
      const userId = req.user.userId;
      if (!userId || !targetUserId) {
        return res.status(400).json({ success: false, error: 'Both userId and targetUserId are required.' });
      }
      if (userId === targetUserId) {
        return res.status(400).json({ success: false, error: 'Cannot connect to yourself.' });
      }
      // Validate users exist
      const [userA, userB] = await Promise.all([
        User.findById(userId),
        User.findById(targetUserId)
      ]);
      if (!userA || !userB) {
        return res.status(404).json({ success: false, error: 'User(s) not found.' });
      }
      // Check for existing connection
      const existing = await Connection.findOne({ users: { $all: [userId, targetUserId] } });
      if (existing) {
        return res.status(409).json({ success: false, error: 'Connection already exists.', connection: existing });
      }
      // Create connection
      const connection = new Connection({
        users: [userId, targetUserId],
        status: 'pending',
        type,
        uuid: uuidv4(),
        initiatedBy: userId,
        timestamps: { initiated: new Date() },
        metadata: { source: 'discovery', platform: 'web' }
      });
      await connection.save();
      res.status(201).json({ success: true, connection });
    } catch (error) {
      console.error('❌ Create connection error:', error);
      res.status(500).json({ success: false, error: 'Failed to create connection' });
    }
  }

  // Get all connections for the current user
  async getConnections(req, res) {
    try {
      const userId = req.user.userId;
      const connections = await Connection.find({ users: userId })
        .sort({ 'timestamps.lastActivity': -1 })
        .lean();
      res.status(200).json({ success: true, connections });
    } catch (error) {
      console.error('❌ Get connections error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch connections' });
    }
  }

  // Get a single connection by UUID
  async getConnectionByUuid(req, res) {
    try {
      const { uuid } = req.params;
      const connection = await Connection.findOne({ uuid });
      if (!connection) {
        return res.status(404).json({ success: false, error: 'Connection not found' });
      }
      // Authorization: Only involved users can view
      if (!connection.users.some(u => u.equals(req.user.userId))) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }
      res.status(200).json({ success: true, connection });
    } catch (error) {
      console.error('❌ Get connection error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch connection' });
    }
  }

  // Update a connection (status, metadata)
  async updateConnection(req, res) {
    try {
      const { uuid } = req.params;
      const updates = req.body;
      const connection = await Connection.findOne({ uuid });
      if (!connection) {
        return res.status(404).json({ success: false, error: 'Connection not found' });
      }
      // Authorization: Only involved users can update
      if (!connection.users.some(u => u.equals(req.user.userId))) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }
      // Only allow certain fields to be updated
      if (updates.status) connection.status = updates.status;
      if (updates.type) connection.type = updates.type;
      if (updates.metadata) connection.metadata = { ...connection.metadata, ...updates.metadata };
      connection.timestamps.lastActivity = new Date();
      await connection.save();
      res.status(200).json({ success: true, connection });
    } catch (error) {
      console.error('❌ Update connection error:', error);
      res.status(500).json({ success: false, error: 'Failed to update connection' });
    }
  }

  // Delete a connection (unmatch/block)
  async deleteConnection(req, res) {
    try {
      const { uuid } = req.params;
      const connection = await Connection.findOne({ uuid });
      if (!connection) {
        return res.status(404).json({ success: false, error: 'Connection not found' });
      }
      // Authorization: Only involved users can delete
      if (!connection.users.some(u => u.equals(req.user.userId))) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }
      await connection.deleteOne();
      res.status(200).json({ success: true, message: 'Connection deleted' });
    } catch (error) {
      console.error('❌ Delete connection error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete connection' });
    }
  }
}

module.exports = new ConnectionController(); 