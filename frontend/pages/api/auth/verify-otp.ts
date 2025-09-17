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
      const setCookies: string[] = [];
      for (const [k, v] of backendResp.headers.entries()) {
        if (k.toLowerCase() === 'set-cookie') setCookies.push(v);
      }
      if (setCookies.length > 0) res.setHeader('Set-Cookie', setCookies as any);
    } catch (e) {
      // swallow
    }

    const text = await backendResp.text();
    const contentType = backendResp.headers.get('content-type') || 'text/plain';
    res.setHeader('Content-Type', contentType);
    res.status(backendResp.status).send(text);

  } catch (err: any) {
    return res.status(500).json({ error: 'Proxy error', details: err?.message });
  }
}
