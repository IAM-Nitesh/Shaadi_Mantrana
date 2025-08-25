# Observability: Pino + Promtail + Grafana Loki (Grafana Cloud)

This guide shows how to wire structured JSON logs from a Next.js / Node API using Pino, collect them with Promtail, and send them to Grafana Cloud Loki.

Prereqs
- Grafana Cloud account (Loki enabled). You should have the Loki push URL and credentials. Example values are stored in `.env.example` (do NOT commit real secrets).
- Node.js app that writes JSON logs to a file or stdout.
- Promtail binary or Docker available on the host that can read those logs.

Files in this folder
- `promtail.yaml` — example Promtail config that tails JSON logs and pushes to Grafana Loki.
- `../frontend/src/utils/pino-logger.ts` — example Pino logger helper to use in the Node/Next API.
- `../tools/log-generator.js` — local script that writes a few sample JSON logs to `tmp-logs/api.log` for testing.

Steps

1) Instrument your API with Pino

 - Install dependencies (in your project root):
```bash
npm install pino pino-http
```

 - Use the `pino-logger.ts` helper. For Next.js API routes or custom server middleware, attach `httpLogger` to incoming requests:

```js
import { httpLogger, logger } from '../utils/pino-logger';

// In Express middleware
app.use(httpLogger);

// Example usage
logger.info({ path: '/api/health', request_id: req.headers['x-request-id'] }, 'health check');
```

2) Make sure logs are written as JSON to a file or stdout

- For container-based deployments, writing JSON to stdout is preferred (promtail can read container logs).
- For VM deployments, write to a file, e.g. `/var/log/shaadimantra/api.log` (ensure promtail has permission to read it).

3) Configure Promtail

- Edit `observability/promtail.yaml` to set your Loki URL and credentials via environment variables. The `clients` section supports basic_auth.
- Start promtail (Docker example):

```bash
docker run --rm \
  -v /var/log/shaadimantra:/var/log/shaadimantra \
  -v $(pwd)/observability/promtail.yaml:/etc/promtail/promtail.yaml \
  grafana/promtail:latest -config.file=/etc/promtail/promtail.yaml
```

4) Test end-to-end

- Run the `tools/log-generator.js` script to write sample logs (local test):

```bash
node tools/log-generator.js
```

- Confirm promtail picked up the log file and sent to Loki (check promtail logs or Grafana Explore for recent logs).

5) Security and environment variables

- Do NOT commit secrets. Use `.env` or your deployment platform's secret manager to set `GRAFANA_LOKI_USER` and `GRAFANA_LOKI_PASSWORD`.
- Example env file is `.env.example` in the repo root.

6) Logging policy to conserve free tier

- Log levels: only send ERROR/WARN/important INFO. Avoid DEBUG in production.
- Keep Loki labels low-cardinality (env, job, service, level). Do not add `userId` or `sessionId` as labels.
- Implement sampling for high-volume INFO endpoints.

7) Optional: Vector instead of Promtail

- Vector gives you powerful transforms, buffering, and rate-limiting before sending to Loki. If you need sampling or dynamic redaction at the collector level, consider Vector.

If you want, I can:
- Commit `pino-logger.ts` into the backend server (or Next.js API folder) and add a small middleware example.
- Create a `docker-compose` example that runs promtail and a tiny test app to validate the pipeline locally.
