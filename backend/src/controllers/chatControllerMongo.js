// Chat Controller - MongoDB Integration
const { User, Connection, Conversation } = require('../models');
const Message = require('../models/Message');
const ChatThread = require('../models/ChatThread');
const mongoose = require('mongoose');

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
      
  // Fetch messages from ChatThread (single document per connection)
  const messages = await ChatThread.getByConnection(connectionId, 100);

      // Map messages to API shape with JSON-safe primitives
      // Include both legacy fields (e.g., _id, text, createdAt) and normalized fields (id, message, timestamp)
      const mapped = messages.map(m => {
        const idStr = m._id ? (m._id.toString ? m._id.toString() : m._id) : null;
        const senderStr = m.sender ? (m.sender.toString ? m.sender.toString() : m.sender) : null;
        const createdAtIso = m.createdAt ? (m.createdAt.toISOString ? m.createdAt.toISOString() : m.createdAt) : null;

        return {
          // Legacy/raw fields
          _id: idStr,
          connectionId: m.connectionId,
          sender: senderStr,
          text: m.text,
          status: m.status,
          createdAt: createdAtIso,
          updatedAt: m.updatedAt ? (m.updatedAt.toISOString ? m.updatedAt.toISOString() : m.updatedAt) : null,
          __v: m.__v,

          // Normalized fields (for new clients)
          id: idStr,
          senderId: senderStr,
          message: m.text,
          timestamp: createdAtIso
        };
      });

      console.log(`✅ Returning ${mapped.length} messages for connection ${connectionId}`);

      res.status(200).json({
        success: true,
        messages: mapped,
        connectionId,
        totalMessages: mapped.length
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
      

      // Persist message into ChatThread (atomic append + conversation stat update)
      let msgDoc = null;
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const appendResult = await ChatThread.appendMessage(connectionId, {
          sender: userId,
          text: message.trim(),
          status: 'sent',
          createdAt: new Date()
        }, { session, new: true });

        msgDoc = appendResult.message || null;

        // Update conversation stats within the same session (if conversation exists)
        const conv = await Conversation.findOne({ connectionId }).session(session);
        if (conv) {
          await Conversation.updateOne(
            { _id: conv._id },
            { $set: { messageCount: conv.messageCount + 1, lastMessageAt: new Date() } },
            { session }
          );
        }

        await session.commitTransaction();
      } catch (txErr) {
        await session.abortTransaction();
        console.warn('Transaction failed for sendMessage, falling back to non-transactional append:', txErr.message);

        // Fallback - append without session
        try {
          const appendResult = await ChatThread.appendMessage(connectionId, {
            sender: userId,
            text: message.trim(),
            status: 'sent',
            createdAt: new Date()
          }, { new: true, upsert: true });

          msgDoc = appendResult.message || null;

          const convFallback = await Conversation.findByConnectionId(connectionId);
          if (convFallback) {
            await Conversation.updateStats(convFallback._id, convFallback.messageCount + 1, new Date());
          }
        } catch (fallbackErr) {
          console.error('Fallback persistence failed:', fallbackErr.message);
          return res.status(500).json({ success: false, error: 'Failed to persist message' });
        }
      } finally {
        session.endSession();
      }

      const savedMessage = msgDoc ? {
        id: msgDoc._id,
        senderId: msgDoc.sender,
        message: msgDoc.text,
        timestamp: msgDoc.createdAt,
        connectionId: connectionId,
        status: msgDoc.status
      } : null;

      console.log(` Message persisted successfully: ${savedMessage.id}`);

      res.status(201).json({ success: true, message: savedMessage });

      // Broadcast message via Socket.IO to other users in the room
      // Only broadcast if the message was successfully saved
      if (savedMessage) {
        try {
          const chatService = require('../services/chatService');
          if (chatService && chatService.io) {
            const normalized = {
              id: savedMessage.id ? (savedMessage.id.toString ? savedMessage.id.toString() : String(savedMessage.id)) : null,
              senderId: savedMessage.senderId || savedMessage.sender || userId,
              message: savedMessage.message || savedMessage.text || message,
              timestamp: savedMessage.timestamp && savedMessage.timestamp.toISOString ? savedMessage.timestamp.toISOString() : (new Date(savedMessage.timestamp)).toISOString(),
              status: savedMessage.status || 'sent',
              connectionId: connectionId
            };
            
            // Broadcast to all users in the room
            chatService.io.to(connectionId).emit('new_message', normalized);
            console.log(`📡 Message broadcasted via Socket.IO to room: ${connectionId}`);
          }
        } catch (broadcastError) {
          console.warn('Failed to broadcast message via Socket.IO:', broadcastError.message);
          // Don't fail the request if broadcasting fails
        }
      }
      
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