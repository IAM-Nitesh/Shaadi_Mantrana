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

// Support both legacy `LOKI_*` env names and clearer `GRAFANA_LOKI_*` names.
// Priority: `GRAFANA_LOKI_URL` > `LOKI_URL`. Same for user/password.
const lokiUrl = process.env.GRAFANA_LOKI_URL || process.env.LOKI_URL;
const lokiUser = process.env.GRAFANA_LOKI_USER || process.env.LOKI_USER;
const lokiPassword = process.env.GRAFANA_LOKI_PASSWORD || process.env.LOKI_PASSWORD;

// If a Loki push URL is provided, add a pino-loki stream so logs are forwarded to Grafana Cloud
if (lokiUrl) {
  try {
    const pinoLoki = require('pino-loki');
    const lokiStream = pinoLoki.createWriteStream({
      host: lokiUrl,
      basicAuth: lokiUser && lokiPassword ? `${lokiUser}:${lokiPassword}` : undefined,
      labels: { service: 'shaadimantra-backend' },
      timeout: 10000
    });

    // pino-loki exposes a writable stream we can push to
    streams.push({ level: 'info', stream: lokiStream });
  } catch (e) {
    // If pino-loki isn't installed or fails, continue without crashing
    // eslint-disable-next-line no-console
    console.warn('pino-loki integration not available:', e && e.message);
  }
}

const baseLogger = pino(
  {
    level,
    base: { 
      service: 'shaadimantra-backend', 
      env: (process.env.NODE_ENV === 'production' || 
            process.env.RENDER === 'true' || 
            process.env.VERCEL === 'true' ||
            process.env.HEROKU === 'true') ? 'production' : 'development'
    },
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
