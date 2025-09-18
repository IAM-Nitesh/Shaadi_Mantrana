# Logging & Grafana Loki Integration

This document explains how to configure the backend to forward structured logs to Grafana Cloud (Loki) and how to forward client logs from the frontend in a secure manner.

Important: Do NOT commit credentials into the repository. Use Render/Vercel environment variables or another secrets store.

Required environment variables (backend Render service):

- `GRAFANA_LOKI_URL` (preferred): Grafana Cloud Loki push URL. Example: `https://logs-prod-028.grafana.net/loki/api/v1/push`
- `GRAFANA_LOKI_USER` (optional): Username for basic auth when pushing logs to Loki.
- `GRAFANA_LOKI_PASSWORD` (optional): Password for basic auth when pushing logs to Loki.
- `LOKI_CLIENT_API_KEY`: Shared secret for allowing frontend/client to POST logs to `/api/logs`.

Note: For backward compatibility the backend also accepts the legacy `LOKI_URL`, `LOKI_USER`, and `LOKI_PASSWORD` env names if `GRAFANA_LOKI_*` are not set.
- `LOG_LEVEL`: Optional. Default `info`.
- `LOG_DIR`: Optional. Local directory for important log fallback (defaults to `tmp-logs`).

Frontend configuration (Vercel):

- Configure the frontend to send client-side logs to backend endpoint `POST /api/logs`.
- Include header `X-Client-Log-Key` with the value of `LOKI_CLIENT_API_KEY`.
- Only send non-sensitive information. The backend sanitizes `email` and `otp` but avoid sending PII.
 - Include `user_uuid` in the payload when available, or set header `X-User-UUID` to help correlate client logs to a specific user.

Security & Operational Notes:

- The backend will only accept client logs if `LOKI_CLIENT_API_KEY` is set and the header matches.
 - All logs are structured (JSON) via `pino` and forwarded to Loki when `GRAFANA_LOKI_URL` (or legacy `LOKI_URL`) is configured.
- For local development, logs remain on stdout and a local fallback file at `tmp-logs/backend-important.log` is created for warnings/errors.
- Do not enable development-only helper endpoints (like `/api/auth/_dev/last-otp`) in production.

How to verify:

1. Deploy backend to Render with the required environment variables set.
2. Trigger some traffic and observe logs in Render's console.
3. Verify logs appear in Grafana Cloud by searching for label `service=shaadimantra-backend` (server) or `service=shaadimantra-frontend` (frontend) in the Loki Explore UI.
4. For client logs, call `POST /api/logs` with `X-Client-Log-Key` and a small JSON payload, then check server logs and Loki.

Troubleshooting:

- If pino-loki cannot connect, the server falls back to stdout and the `tmp-logs` file. Check for `pino-loki integration not available` warnings in startup logs.
- If logs are missing in Grafana Cloud, verify `GRAFANA_LOKI_URL`/`LOKI_URL`, `GRAFANA_LOKI_USER`/`LOKI_USER`, and `GRAFANA_LOKI_PASSWORD`/`LOKI_PASSWORD` are correct and reachable from the Render network.
- Ensure `LOG_LEVEL` is set appropriately (e.g., `info` in production).

Contact: If you need help wiring Render/Vercel environment variables, ask the person who manages the deployment account to add the required variables.
