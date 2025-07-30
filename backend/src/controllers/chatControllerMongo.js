// Chat Controller - MongoDB Integration
const { User, Connection } = require('../models');

class ChatController {
  // Get chat messages for a connection
  async getChatMessages(req, res) {
    try {
      const userId = req.user.userId;
      const { connectionId } = req.params;
      
      console.log(`💬 Get chat messages - User: ${userId}, Connection: ${connectionId}`);
      
      // Verify the connection exists and user is part of it
      const connection = await Connection.findById(connectionId);
      if (!connection) {
        console.log('❌ Connection not found');
        return res.status(404).json({
          success: false,
          error: 'Connection not found'
        });
      }
      
      // Check if user is part of this connection
      if (!connection.users.includes(userId)) {
        console.log('❌ User not authorized for this connection');
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this chat'
        });
      }
      
      // For now, return empty messages array
      // In a real implementation, you would fetch messages from a Message collection
      const messages = [];
      
      console.log(`✅ Returning ${messages.length} messages for connection ${connectionId}`);
      
      res.status(200).json({
        success: true,
        messages,
        connectionId,
        totalMessages: messages.length
      });
      
    } catch (error) {
      console.error('❌ Get chat messages error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch chat messages'
      });
    }
  }

  // Send a message in a connection
  async sendMessage(req, res) {
    try {
      const userId = req.user.userId;
      const { connectionId } = req.params;
      const { message } = req.body;
      
      console.log(`💬 Send message - User: ${userId}, Connection: ${connectionId}, Message: ${message}`);
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message cannot be empty'
        });
      }
      
      // Verify the connection exists and user is part of it
      const connection = await Connection.findById(connectionId);
      if (!connection) {
        console.log('❌ Connection not found');
        return res.status(404).json({
          success: false,
          error: 'Connection not found'
        });
      }
      
      // Check if user is part of this connection
      if (!connection.users.includes(userId)) {
        console.log('❌ User not authorized for this connection');
        return res.status(403).json({
          success: false,
          error: 'Not authorized to send message in this chat'
        });
      }
      
      // For now, just return success
      // In a real implementation, you would save the message to a Message collection
      const savedMessage = {
        id: Date.now().toString(),
        senderId: userId,
        message: message.trim(),
        timestamp: new Date().toISOString(),
        connectionId
      };
      
      console.log(`✅ Message sent successfully: ${savedMessage.id}`);
      
      res.status(201).json({
        success: true,
        message: savedMessage
      });
      
    } catch (error) {
      console.error('❌ Send message error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }
  }

  // Mark messages as read
  async markAsRead(req, res) {
    try {
      const userId = req.user.userId;
      const { connectionId } = req.params;
      
      console.log(`👁️ Mark as read - User: ${userId}, Connection: ${connectionId}`);
      
      // Verify the connection exists and user is part of it
      const connection = await Connection.findById(connectionId);
      if (!connection) {
        console.log('❌ Connection not found');
        return res.status(404).json({
          success: false,
          error: 'Connection not found'
        });
      }
      
      // Check if user is part of this connection
      if (!connection.users.includes(userId)) {
        console.log('❌ User not authorized for this connection');
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this chat'
        });
      }
      
      // For now, just return success
      // In a real implementation, you would update message read status
      
      console.log(`✅ Messages marked as read for connection ${connectionId}`);
      
      res.status(200).json({
        success: true,
        message: 'Messages marked as read',
        markedCount: 0
      });
      
    } catch (error) {
      console.error('❌ Mark as read error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark messages as read'
      });
    }
  }
}

module.exports = new ChatController(); 