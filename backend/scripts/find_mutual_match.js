(async () => {
  try {
    const path = require('path');
    const root = path.resolve(__dirname, '..');
    process.chdir(root);
    const dbService = require('./../src/services/databaseService');

    await dbService.connect();
    const { DailyLike, Connection } = require('./../src/models');

    const dm = await DailyLike.findOne({ isMutualMatch: true }).lean();
    if (dm) {
      const conn = dm.connectionId ? await Connection.findById(dm.connectionId).lean() : null;
      console.log('FOUND_DAILYLIKE', { id: dm._id.toString(), from: dm.from, to: dm.to, connectionId: dm.connectionId });
      if (conn) console.log('ASSOCIATED_CONNECTION', { id: conn._id.toString(), users: conn.users });
      process.exit(0);
    }

    const conn = await Connection.findOne({}).lean();
    if (conn) {
      console.log('SAMPLE_CONNECTION', { id: conn._id.toString(), users: conn.users });
      process.exit(0);
    }

    console.log('NO_MATCHES_FOUND');
    process.exit(0);
  } catch (e) {
    console.error('ERR', e);
    process.exit(1);
  }
})();
