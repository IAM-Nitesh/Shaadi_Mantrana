Short diagnosis

HTTP 401 "authentication error: invalid token" means Grafana Cloud rejected the credentials — not a network or URL problem. You tried numeric user, api_key, and sa-1-loki-admin variants and all returned 401.
Immediate next steps (safe, ordered)

Rotate / revoke the exposed key now (you posted keys here). Create a new API key in Grafana Cloud before further testing.
Grafana Cloud → Configuration → API Keys → Add API Key → give a name (e.g. promtail-loki-push) → choose role (use Admin or the specific push/ingest role per Grafana Cloud docs) → Create → copy the key (shows once).
Test the new key with curl (prefer Bearer token; try api_key username fallback). Use one of these tests:
If the new key still 401:
Confirm the API key scope/role supports Loki ingestion (Grafana Cloud docs or support will show required role).
Confirm you used the exact key string (no newlines/truncation) and pasted into curl exactly.
Check any org/account-specific push instructions in Grafana Cloud (some accounts use different ingest endpoints or require tenant headers).
Open a Grafana Cloud support ticket with the Grafana-Trace-Id from the 401 response header.
Operational notes

Do NOT use long-lived app secrets in files in repo. Store keys in secrets manager and inject into Promtail/containers at runtime.
Use Promtail (preferred) to push logs instead of application-level pushes; configure promtail clients with the new key and check promtail logs for digestible auth errors.
After you create a new key and confirm success, update backend/.env (or CI secrets) and rotate keys regularly.
If you want, I can:

Provide the exact Promtail client config snippet to use the new key, or
Walk you step-by-step through generating the API key in Grafana Cloud (UI steps), or
Retry curl with a new key if you paste the POST result (HTTP_CODE and any WWW-Authenticate or Grafana-Trace-Id). Which do you want next?