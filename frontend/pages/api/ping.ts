import type { NextApiRequest, NextApiResponse } from 'next'

// Simple scheduled ping endpoint for Vercel cron.
// Fetches the Render backend /health endpoint and returns summary.
// Optionally requires a shared secret via PING_SECRET to avoid external abuse.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const start = Date.now();
  try {
    const secret = process.env.PING_SECRET;
    if (secret) {
      const provided = req.headers['x-ping-secret'] || req.query.secret;
      if (provided !== secret) {
        return res.status(401).json({ ok: false, error: 'unauthorized' });
      }
    }

    const target = process.env.RENDER_HEALTH_URL || 'https://shaadi-mantrana.onrender.com/health';
    const r = await fetch(target, { headers: { 'User-Agent': 'vercel-cron-ping/1.0' }, cache: 'no-store' });
    const latency = Date.now() - start;
    const statusOk = r.ok;
    let body: any = null;
    try { body = await r.json(); } catch { /* ignore non-json */ }

    return res.status(200).json({ ok: true, target, backend_status: r.status, backend_ok: statusOk, latency_ms: latency, body });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message, latency_ms: Date.now() - start });
  }
}
