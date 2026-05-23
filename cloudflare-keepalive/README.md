# Cloudflare Keepalive Worker

Runs every 15 minutes to hit your Render `/health` endpoint so it does not go cold. Edit `wrangler.toml` before deploying.

## Prerequisites
- Cloudflare account
- (Recommended) Your domain DNS managed by Cloudflare
- `npm i -g wrangler` or use npx for on-demand

## Configure
Edit `wrangler.toml`:
- Replace `<your-render-service>` in `HEALTH_URL`.
- Set a strong random `PING_TOKEN` (32+ chars) OR remove header in worker & backend if not protecting.

If your `/health` expects the token, ensure backend checks `X-Ping-Token`.

## Deploy
```bash
cd cloudflare-keepalive
# Optionally set secrets instead of plaintext vars
npx wrangler secret put PING_TOKEN   # then remove PING_TOKEN from [vars] block if you do this
npx wrangler deploy
```

## Tail Logs (observe pings)
```bash
npx wrangler tail
```

## Adjust Schedule
Edit cron expression in `[triggers]` (minimum granularity typically 1 minute; free plan currently supports 15-minute reliability targets).

## Loki Correlation
The Worker logs go to Cloudflare, NOT Loki. To mirror ping results into Loki you can:
1. Add a lightweight public endpoint `/internal/ping-log` that accepts JSON and logs it server-side.
2. Or have the backend log each `/health` request with a field `source: 'keepalive'` (preferred).

Example backend log addition (pseudo):
```js
app.get('/health', (req, res) => {
  logger.info({ event: 'health_check', source: req.get('X-Ping-Token') ? 'keepalive' : 'user' }, 'health ok');
  res.json({ status: 'ok' });
});
```

## Security
- If endpoint is public and harmless, the token is optional.
- If you expose internal metrics, keep token and restrict output.

## Cleanup
- To remove cron: remove the `[triggers]` section and redeploy.

---
Last updated: 2025-09-19
