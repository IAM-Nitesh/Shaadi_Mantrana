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

if (isNode) {
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
      const pinoLoki = req('pino-loki');
      const lokiStream = pinoLoki.createWriteStream({
        host: grafanaLokiUrl,
        basicAuth: grafanaLokiUser && grafanaLokiPassword ? `${grafanaLokiUser}:${grafanaLokiPassword}` : undefined,
        labels: { service: 'shaadimantra-frontend' },
        timeout: 10000
      });
      streams.push({ level: 'info', stream: lokiStream });
    } catch (e) {
      // Do not crash the server if pino-loki is not available
      // eslint-disable-next-line no-console
      console.warn('pino-loki not configured for frontend logs:', e && e.message);
    }
  }

  const baseLogger = pino(
    {
      level,
      base: { service: 'shaadimantra-api', env: process.env.NODE_ENV || 'development' },
      redact: {
        paths: ['req.headers.authorization', 'user.email', 'user.phone', 'body.password', 'body.token'],
        censor: '[REDACTED]',
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    pino.multistream(streams)
  );

  logger = baseLogger;

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
  // Client-side fallback logger
  const fallback = {
    debug: (...args: any[]) => console.debug(...args),
    info: (...args: any[]) => console.info(...args),
    warn: (...args: any[]) => console.warn(...args),
    error: (...args: any[]) => console.error(...args),
    child: (obj: any) => ({ ...fallback, _childMeta: obj }),
  };

  logger = fallback as any;
  httpLogger = (_req: any, _res: any, _next?: any) => { /* no-op */ };
}

export default logger;
