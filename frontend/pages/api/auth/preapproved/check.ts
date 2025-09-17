import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const url = new URL(`${BACKEND_URL}/api/auth/preapproved/check`);
    // copy query params
    Object.keys(req.query || {}).forEach((k) => {
      const v = req.query[k];
      if (Array.isArray(v)) v.forEach((vv) => url.searchParams.append(k, vv));
      else if (v !== undefined) url.searchParams.append(k, String(v));
    });

    const backendResp = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': req.headers.cookie || ''
      }
    });

    // Forward Set-Cookie if backend sent any
    try {
      const setCookies: string[] = [];
      for (const [k, v] of backendResp.headers.entries()) {
        if (k.toLowerCase() === 'set-cookie') setCookies.push(v);
      }
      if (setCookies.length > 0) res.setHeader('Set-Cookie', setCookies as any);
    } catch (e) {
      // ignore
    }

    const contentType = backendResp.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);
    const text = await backendResp.text();
    res.status(backendResp.status).send(text);
  } catch (err: any) {
    res.status(502).json({ error: 'Proxy error', details: err?.message });
  }
}
