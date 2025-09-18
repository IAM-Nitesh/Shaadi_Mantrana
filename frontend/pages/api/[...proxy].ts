import type { NextApiRequest, NextApiResponse } from 'next';

// Generic proxy for /api/* -> backend API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
    if (!backendBase) {
      res.status(500).json({ error: 'Backend base URL not configured' });
      return;
    }

    const path = Array.isArray(req.query.proxy) ? req.query.proxy.join('/') : req.query.proxy || '';
    const backendUrl = `${backendBase.replace(/\/$/, '')}/${path}`;

    // Forward headers (but let fetch set host)
    const forwardHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (!v) continue;
      const key = k.toLowerCase();
      // Skip hop-by-hop headers
      if (['host', 'connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'proxy-authorization', 'proxy-authenticate'].includes(key)) continue;
      forwardHeaders[k] = Array.isArray(v) ? v.join(',') : String(v);
    }

    // Ensure cookies from browser are forwarded to backend
    if (req.headers.cookie) forwardHeaders['cookie'] = req.headers.cookie as string;

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: forwardHeaders,
      // Body will be attached below
    };

    if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
      // Support body for POST/PUT/PATCH/DELETE
      fetchOptions.body = req.body && Object.keys(req.body).length === 0 && typeof req.body === 'object' ? undefined : req.body;
    }

    // Use global fetch (Next supports it) and forward response
    const backendRes = await fetch(backendUrl, fetchOptions as any);

    // Copy status
    res.status(backendRes.status);

    // Forward response headers except hop-by-hop
    backendRes.headers.forEach((value, name) => {
      const lname = name.toLowerCase();
      if (['transfer-encoding', 'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'upgrade'].includes(lname)) return;
      // Handle Set-Cookie specially to preserve multiple cookies
      if (lname === 'set-cookie') {
        // node-fetch returns all Set-Cookie as separate header entries, but Headers.forEach gives combined value
        // Split by comma only when it appears to contain multiple cookies (safe heuristic)
        const cookies = Array.isArray(value) ? value : [value];
        res.setHeader('Set-Cookie', cookies);
        return;
      }
      res.setHeader(name, value);
    });

    // Stream body
    const contentType = backendRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await backendRes.json().catch(() => null);
      res.json(data);
    } else {
      const text = await backendRes.text().catch(() => '');
      res.send(text);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('API proxy error:', err);
    res.status(502).json({ error: 'Bad gateway' });
  }
}
