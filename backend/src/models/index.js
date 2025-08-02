// Model Index - Export all MongoDB models
const User = require('./User');
const Invitation = require('./Invitation');
const Match = require('./Match');
const Connection = require('./Connection');
const DailyLike = require('./DailyLike');

module.exports = {
  User,
  Invitation,
  Match,
  Connection,
  DailyLike
};
