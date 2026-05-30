/**
 * S0-6: Account deletion must hard-delete user and associated data.
 */
const mongoose = require('mongoose');
const { User, Session, Message } = require('../src/models');
const profileController = require('../src/controllers/profileControllerMongo');

jest.mock('../src/services/b2StorageService', () => ({
  b2Storage: {
    deleteProfilePicture: jest.fn().mockResolvedValue({ success: true }),
  },
}));

describe('Account deletion (hard delete)', () => {
  let userId;
  let otherUserId;
  const userUuid = 'test-delete-uuid-001';

  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || process.env.MONGODB_TEST_URI;
    if (!uri) {
      console.warn('Skipping account deletion tests: MONGODB_URI not set');
      return;
    }
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState !== 1) return;

    await User.deleteMany({ userUuid });
    await Session.deleteMany({ userUuid });
    await Message.deleteMany({});

    const user = await User.create({
      userUuid,
      email: 'delete-test@example.com',
      phoneNumber: '+919999999001',
      status: 'active',
      role: 'user',
      verification: { isVerified: true },
      profile: { name: 'Delete Test', profileCompleteness: 50 },
    });
    userId = user._id;

    const other = await User.create({
      userUuid: 'other-user-uuid-001',
      email: 'other@example.com',
      status: 'active',
      role: 'user',
      verification: { isVerified: true },
      profile: { name: 'Other User' },
    });
    otherUserId = other._id;

    await Session.create({
      sessionId: 'sess-delete-test',
      userId: userId.toString(),
      userUuid,
      email: 'delete-test@example.com',
      role: 'user',
      refreshToken: 'rt',
      accessToken: 'at',
    });

    await Message.create({
      senderId: userId,
      receiverId: otherUserId,
      content: 'Hello',
      connectionId: new mongoose.Types.ObjectId(),
    });
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ userUuid: { $in: [userUuid, 'other-user-uuid-001'] } });
      await mongoose.disconnect();
    }
  });

  test('deleteAccount purges user, sessions, and messages', async () => {
    if (mongoose.connection.readyState !== 1) {
      return; // skip when no DB
    }

    const req = {
      user: { userId, userUuid },
    };
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };

    await profileController.deleteAccount(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await User.findById(userId);
    expect(user).toBeNull();

    const sessions = await Session.find({ userId: userId.toString() });
    expect(sessions).toHaveLength(0);

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });
    expect(messages).toHaveLength(0);

    const { b2Storage } = require('../src/services/b2StorageService');
    expect(b2Storage.deleteProfilePicture).toHaveBeenCalledWith(userId);
  });
});
