// Simple log generator to test pino -> promtail -> loki flow
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'tmp-logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const logfile = path.join(logDir, 'api.log');

function writeLog(level, obj) {
  const entry = {
    time: new Date().toISOString(),
    level,
    ...obj
  };
  fs.appendFileSync(logfile, JSON.stringify(entry) + '\n');
}

writeLog('info', { msg: 'Service started', pid: process.pid });
writeLog('info', { msg: 'Incoming request', path: '/api/health', request_id: 'test-1' });
writeLog('error', { msg: 'Database connection failed', err: { message: 'timeout' } });

console.log('Wrote sample logs to', logfile);
