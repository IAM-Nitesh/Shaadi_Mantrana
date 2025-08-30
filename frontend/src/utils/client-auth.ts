// Client-side auth helpers that call server APIs.
export async function getAuthStatus() {
  try {
    const res = await fetch('/api/auth/status', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    // Handle 304 Not Modified - this means we need fresh data
    if (res.status === 304) {
      // Force a fresh request by adding a timestamp
      const freshRes = await fetch(`/api/auth/status?t=${Date.now()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!freshRes.ok) return { authenticated: false };
      return await freshRes.json();
    }

    if (!res.ok) return { authenticated: false };
    return await res.json();
  } catch (err) {
    return { authenticated: false };
  }
}

export async function getClientToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/token', { method: 'GET', credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.token || null;
  } catch (err) {
    return null;
  }
}

export async function clientLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch (err) {
    // ignore
  }
}
