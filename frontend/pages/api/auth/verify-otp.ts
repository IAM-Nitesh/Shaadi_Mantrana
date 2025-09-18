import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Forward request body and cookies to backend
    const backendResp = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie || ''
      },
      body: JSON.stringify(req.body)
    });

    // Forward Set-Cookie headers from backend to client (handle multiple)
    try {
      // Node fetch may expose multiple Set-Cookie headers via `raw()` (node-fetch) or
      // as repeated header entries. Try both methods for robustness across runtimes.
      let setCookies: string[] = [];

      // Prefer `raw` if available (preserves multiple Set-Cookie values)
      try {
        // @ts-ignore
        const raw = (backendResp.headers as any).raw && (backendResp.headers as any).raw();
        if (raw && raw['set-cookie']) {
          setCookies = setCookies.concat(raw['set-cookie']);
        }
      } catch (e) {
        // ignore
      }

      // Fallback: iterate header entries and collect any Set-Cookie values
      for (const [k, v] of backendResp.headers.entries()) {
        if (k.toLowerCase() === 'set-cookie') setCookies.push(v);
      }

      if (setCookies.length > 0) {
        // Ensure we forward all Set-Cookie headers to the browser
        res.setHeader('Set-Cookie', setCookies as any);
      }
    } catch (e) {
      // swallow - don't fail the request if we can't forward cookies
    }

    const text = await backendResp.text();
    const contentType = backendResp.headers.get('content-type') || 'text/plain';
    res.setHeader('Content-Type', contentType);
    res.status(backendResp.status).send(text);

  } catch (err: any) {
    return res.status(500).json({ error: 'Proxy error', details: err?.message });
  }
}
