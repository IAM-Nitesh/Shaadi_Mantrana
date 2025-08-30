import type { NextApiRequest, NextApiResponse } from 'next';

// Backend API URL from env
const BACKEND_URL = process.env.BACKEND_URL || 'https://shaadi-mantrana.onrender.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Forward cookies for auth/session
    const cookie = req.headers.cookie;
    const response = await fetch(`${BACKEND_URL}/api/auth/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { cookie } : {}),
      },
      credentials: 'include',
    });

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error: any) {
    console.error('API route /api/auth/status error:', error);
    res.status(500).send('Internal Server Error');
  }
}
