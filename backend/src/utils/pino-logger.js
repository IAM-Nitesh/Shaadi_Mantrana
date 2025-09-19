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
const appVersion = process.env.APP_VERSION || process.env.npm_package_version || '0.0.0';
const gitSha = process.env.GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.RENDER_GIT_COMMIT || '';
const sampleInfoRate = parseFloat(process.env.LOG_SAMPLE_INFO_RATE || '1'); // 1 = log all info
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

// If a Loki push URL is provided, add a pino-loki stream
if (lokiUrl) {
  try {
    const pinoLokiMod = require('pino-loki');
    const { createWriteStream } = pinoLokiMod || {};
    // Normalize host: allow providing push endpoint or base URL
    let host = lokiUrl.replace(/\/$/, '');
    host = host.replace(/\/loki\/api\/v1\/push$/, '');
    const pushUrl = host + '/loki/api/v1/push';

    let factoryCandidates = [];
    if (typeof createWriteStream === 'function') factoryCandidates.push((opts) => createWriteStream(opts));
    if (typeof pinoLokiMod === 'function') factoryCandidates.push(pinoLokiMod);
    if (pinoLokiMod && typeof pinoLokiMod.default === 'function') factoryCandidates.push(pinoLokiMod.default);

    let lokiStream;
    for (const make of factoryCandidates) {
      try {
        lokiStream = make({
          host,
          basicAuth: lokiUser && lokiPassword ? `${lokiUser}:${lokiPassword}` : undefined,
          labels: { service: 'shaadimantra-backend' },
          timeout: 10000
        });
        if (lokiStream && typeof lokiStream.write === 'function') {
          // eslint-disable-next-line no-console
          console.log('[loki] attached backend pino-loki stream variant');
          break;
        }
      } catch (_) { /* try next */ }
    }

    if (!lokiStream || typeof lokiStream.write !== 'function') {
      // Fallback: minimal writer sending each line directly to Loki push API.
      // eslint-disable-next-line no-console
      console.warn('pino-loki integration not available: using fallback direct push');
      const { Writable } = require('stream');
      const authHeader = (lokiUser && lokiPassword)
        ? 'Basic ' + Buffer.from(`${lokiUser}:${lokiPassword}`).toString('base64')
        : null;
      lokiStream = new Writable({
        write(chunk, _enc, cb) {
          try {
            const line = chunk.toString();
            // Attempt to extract message JSON if line already JSON
            let parsed;
            try { parsed = JSON.parse(line); } catch (_) { parsed = { msg: line }; }
            const ts = (Date.now() * 1e6).toString();
            const payload = {
              streams: [
                {
                  stream: { service: 'shaadimantra-backend' },
                  values: [[ts, JSON.stringify(parsed)]]
                }
              ]
            };
            fetch(pushUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(authHeader ? { Authorization: authHeader } : {})
              },
              body: JSON.stringify(payload)
            }).catch(() => {/* swallow */}).finally(() => cb());
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Loki fallback write error:', err && err.message);
            cb();
          }
        }
      });
    }

    streams.push({ level: 'info', stream: lokiStream });
    // eslint-disable-next-line no-console
    console.log('[loki] backend logging configured (host=', host, 'fallback=', !(lokiStream && factoryCandidates.length), ')');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('pino-loki integration not available:', e && e.message);
  }
}

let emittedInfo = 0;

const baseLogger = pino({
  level,
  base: {
    service: 'shaadimantra-backend',
    env: (process.env.NODE_ENV === 'production' ||
      process.env.RENDER === 'true' ||
      process.env.VERCEL === 'true' ||
      process.env.HEROKU === 'true') ? 'production' : 'development',
    version: appVersion,
    git_sha: gitSha,
  },
  redact: {
    paths: ['req.headers.authorization', 'user.email', 'user.phone', 'body.password', 'body.token'],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
}, pino.multistream(streams));

// Manual sampling wrapper for info logs only when rate < 1
if (sampleInfoRate > 0 && sampleInfoRate < 1) {
  const originalInfo = baseLogger.info.bind(baseLogger);
  baseLogger.info = function (...args) {
    emittedInfo += 1;
    if ((emittedInfo % Math.round(1 / sampleInfoRate)) !== 0) return;
    return originalInfo(...args);
  };
}

try {
  if (lokiUrl) baseLogger.info({ event: 'logger_start', sink: 'loki', service: 'shaadimantra-backend' }, 'Backend logger initialized with Loki stream');
} catch (_) { }

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
