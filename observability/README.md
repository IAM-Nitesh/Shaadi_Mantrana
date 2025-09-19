# Observability: Pino -> Grafana Loki (Direct)  *(Promtail Optional)*

Primary path now is **direct streaming with `pino-loki`** from both backend and Next.js server runtime.
`promtail` remains **optional** for environments where you prefer an agent (multi-process tailing, legacy file logs, transformations) but is **no longer required** for standard deployments.

Prereqs
- Grafana Cloud account (Loki enabled). You should have the Loki push URL and credentials. Example values are stored in `.env.example` (do NOT commit real secrets).
- Node.js app that writes JSON logs to a file or stdout.
- Promtail binary or Docker available on the host that can read those logs.

Files in this folder
- `promtail.yaml` — OPTIONAL legacy/agent example (can be removed later).
- `../frontend/src/utils/pino-logger.ts` — Pino + Loki helper (frontend server context).
- `../backend/src/utils/pino-logger.js` — Backend Pino + Loki helper.
- `../tools/log-generator.js` — Local sample log generator (still works if you want to test Promtail).

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

3) (Optional) Configure Promtail (ONLY if you prefer an agent)

Skip this if direct streaming is sufficient.

To use Promtail anyway:
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

7) Optional: Collector Alternatives

- **Promtail** (legacy / file tailing) – only keep if you aggregate logs from multiple processes or hosts.
- **Vector** – consider if you need buffering, fan‑out, or transform pipelines before Loki.

8) Upcoming Enhancements

- Configurable sampling (INFO rate) via `LOG_SAMPLE_INFO_RATE`.
- Normalized labels: `service`, `env`, `version`, `git_sha`.

If you want, I can:
- Commit `pino-logger.ts` into the backend server (or Next.js API folder) and add a small middleware example.
- Create a `docker-compose` example that runs promtail and a tiny test app to validate the pipeline locally.
