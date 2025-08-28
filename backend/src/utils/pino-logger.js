const fs = require('fs');
const path = require('path');
let pino;
let pinoHttp;
try {
  // load lazily so this file is safe to require in environments without pino installed
  pino = require('pino');
  pinoHttp = require('pino-http');
} catch (e) {
  // If pino isn't installed, provide a console fallback to avoid runtime crashes
  /* eslint-disable no-console */
  module.exports = {
    logger: console,
    httpLogger: (_req, _res, _next) => _next && _next(),
    loggerForUser: (_uuid) => console,
  };
}

const level = process.env.LOG_LEVEL || 'info';
const tmpLogsDir = process.env.LOG_DIR || path.resolve(process.cwd(), 'tmp-logs');
const importantLogFile = path.join(tmpLogsDir, 'backend-important.log');

try {
  fs.mkdirSync(tmpLogsDir, { recursive: true });
} catch (e) {
  // ignore
}

const warnDest = pino.destination({ dest: importantLogFile, sync: false });

const streams = [
  { level, stream: process.stdout },
];
if (warnDest) streams.push({ level: 'warn', stream: warnDest });

const baseLogger = pino(
  {
    level,
    base: { service: 'shaadimantra-backend', env: process.env.NODE_ENV || 'development' },
    redact: {
      paths: ['req.headers.authorization', 'user.email', 'user.phone', 'body.password', 'body.token'],
      censor: '[REDACTED]',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.multistream(streams)
);

function loggerForUser(userUuid) {
  if (!userUuid) return baseLogger;
  try {
    return baseLogger.child({ user_uuid: userUuid });
  } catch (e) {
    return baseLogger;
  }
}

const httpLogger = pinoHttp({
  logger: baseLogger,
  customLogLevel: function (res, err) {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req: (req) => ({ method: req.method, url: req.url, headers: req.headers }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});

module.exports = {
  logger: baseLogger,
  httpLogger,
  loggerForUser,
};
