// Model Index - Export all MongoDB models

const User = require('./User');
const Invitation = require('./Invitation');
const Match = require('./Match');
const Connection = require('./Connection');
const DailyLike = require('./DailyLike');
const Message = require('./Message');
const Conversation = require('./Conversation');
const Session = require('./Session');

module.exports = {
  User,
  Invitation,
  Match,
  Connection,
  DailyLike,
  Message,
  Conversation,
  Session
};
