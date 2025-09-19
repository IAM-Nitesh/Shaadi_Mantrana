// Make this module safe to import from client-side bundles by only using
// Node-only modules when running on the server. We'll export top-level
// bindings and assign appropriate implementations depending on runtime.

export let logger: any;
export let httpLogger: any;

export function loggerForUser(userUuid?: string) {
  if (!userUuid) return logger;
  try {
    return logger && typeof logger.child === 'function' ? logger.child({ user_uuid: userUuid }) : logger;
  } catch (e) {
    return logger;
  }
}

const isNode = typeof process !== 'undefined' && (process as any)?.release?.name === 'node';
// Detect Next.js production build phase to avoid initializing pino transports (file / loki) that
// can throw 'sonic boom is not ready yet' while webpack evaluates modules during build.
const isNextBuildPhase = !!(process && (process as any).env && (
  (process as any).env.NEXT_PHASE === 'phase-production-build' ||
  (process as any).env.VERCEL_BUILD === '1' ||
  (process as any).env.__NEXT_PRIVATE_BUILD_PHASE__ === 'build'
));

function makeFallbackLogger() {
  const fallback = {
    debug: (...args: any[]) => console.debug(...args),
    info: (...args: any[]) => console.info(...args),
    warn: (...args: any[]) => console.warn(...args),
    error: (...args: any[]) => console.error(...args),
    child: (_obj: any) => fallback,
  };
  return fallback;
}

if (isNode && !isNextBuildPhase) {
  // Use eval('require') to avoid webpack/static bundlers resolving these
  // Node-only modules when building client bundles. Wrap in try to be safe.
  // eslint-disable-next-line no-eval
  const req = eval('require');
  let fs: any; let path: any; let pino: any; let pinoHttp: any;
  try {
    fs = req('fs');
    path = req('path');
    pino = req('pino');
    pinoHttp = req('pino-http');
  } catch (e) {
    fs = undefined;
    path = undefined;
    pino = undefined;
    pinoHttp = undefined;
  }

  const level = process.env.LOG_LEVEL || 'info';
  const appVersion = process.env.APP_VERSION || (process as any).env?.npm_package_version || '0.0.0';
  const gitSha = process.env.GIT_SHA || process.env.NEXT_PUBLIC_GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || '';
  const sampleInfoRate = parseFloat(process.env.LOG_SAMPLE_INFO_RATE || '1');
  const tmpLogsDir = path ? path.resolve(process.cwd(), 'tmp-logs') : './tmp-logs';
  const importantLogFile = path ? path.join(tmpLogsDir, 'frontend-important.log') : './tmp-logs/frontend-important.log';

  try {
    fs?.mkdirSync?.(tmpLogsDir, { recursive: true });
  } catch (e) {
    // ignore
  }

  const warnDest = pino ? pino.destination({ dest: importantLogFile, sync: false }) : undefined;

  const streams: any[] = [
    { level, stream: process.stdout },
  ];
  if (warnDest) streams.push({ level: 'warn', stream: warnDest });

  // Add pino-loki stream when configured (supports GRAFANA_LOKI_* or legacy LOKI_*)
  const grafanaLokiUrl = process.env.NEXT_PUBLIC_GRAFANA_LOKI_URL || process.env.GRAFANA_LOKI_URL || process.env.NEXT_PUBLIC_LOKI_URL || process.env.LOKI_URL;
  const grafanaLokiUser = process.env.NEXT_PUBLIC_GRAFANA_LOKI_USER || process.env.GRAFANA_LOKI_USER || process.env.NEXT_PUBLIC_LOKI_USER || process.env.LOKI_USER;
  const grafanaLokiPassword = process.env.NEXT_PUBLIC_GRAFANA_LOKI_PASSWORD || process.env.GRAFANA_LOKI_PASSWORD || process.env.NEXT_PUBLIC_LOKI_PASSWORD || process.env.LOKI_PASSWORD;
  if (grafanaLokiUrl) {
    try {
      const mod = req('pino-loki');
      let lokiStream: any;
      if (mod && typeof mod.createWriteStream === 'function') {
        lokiStream = mod.createWriteStream({
          host: grafanaLokiUrl,
          basicAuth: grafanaLokiUser && grafanaLokiPassword ? `${grafanaLokiUser}:${grafanaLokiPassword}` : undefined,
          labels: { service: 'shaadimantra-frontend' },
          timeout: 10000
        });
      } else if (typeof mod === 'function') {
        lokiStream = mod({
          host: grafanaLokiUrl,
          basicAuth: grafanaLokiUser && grafanaLokiPassword ? `${grafanaLokiUser}:${grafanaLokiPassword}` : undefined,
          labels: { service: 'shaadimantra-frontend' },
          timeout: 10000
        });
      }
      if (lokiStream && typeof lokiStream.write === 'function') {
        streams.push({ level: 'info', stream: lokiStream });
        // eslint-disable-next-line no-console
        console.log('[loki] attached frontend pino-loki stream');
      } else {
        // eslint-disable-next-line no-console
        console.warn('pino-loki not configured for frontend logs: invalid stream');
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('pino-loki not configured for frontend logs:', e && (e as any).message);
    }
  }

  let emittedInfo = 0;

  let baseLogger: any;
  try {
    baseLogger = pino(
    {
      level,
      base: {
        service: 'shaadimantra-frontend',
        env: process.env.NODE_ENV || 'development',
        version: appVersion,
        git_sha: gitSha,
      },
      redact: {
        paths: ['req.headers.authorization', 'user.email', 'user.phone', 'body.password', 'body.token'],
        censor: '[REDACTED]',
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      hooks: sampleInfoRate >= 1 ? undefined : {
        logMethod(args: any[], method: any) {
          try {
            const isInfo = method === baseLogger.info;
            if (isInfo && sampleInfoRate < 1) {
              emittedInfo += 1;
              if ((emittedInfo % Math.round(1 / sampleInfoRate)) !== 0) {
                return; // drop
              }
            }
          } catch (_) { /* ignore sampling errors */ }
          method.apply(this, args);
        }
      }
    },
      pino.multistream(streams)
    );
  } catch (err) {
    // Fallback if pino initialization fails for any reason during runtime
    baseLogger = makeFallbackLogger();
    // eslint-disable-next-line no-console
    console.warn('[logger] fallback console logger engaged (pino init failed):', (err as any)?.message);
  }

  logger = baseLogger;
  try {
    if (grafanaLokiUrl) {
      logger.info({ event: 'logger_start', sink: 'loki', service: 'shaadimantra-frontend' }, 'Frontend logger initialized with Loki stream');
    }
  } catch { /* ignore */ }

  httpLogger = pinoHttp ? pinoHttp({
    logger: baseLogger,
    customLogLevel: function (res: any, err: any) {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    serializers: {
      req: (req: any) => ({ method: req.method, url: req.url, headers: req.headers }),
      res: (res: any) => ({ statusCode: res.statusCode }),
    },
  }) : undefined;
} else {
  // Build phase or client: use lightweight console-based logger
  logger = makeFallbackLogger() as any;
  httpLogger = (_req: any, _res: any, _next?: any) => { /* no-op */ };
  if (isNextBuildPhase) {
    try { console.log('[logger] using fallback logger during Next.js build phase'); } catch {}
  }
}

export default logger;
