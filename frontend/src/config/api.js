export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  // Helps catch misconfig during dev
  console.warn('NEXT_PUBLIC_API_BASE_URL is not defined. Check your .env files.');
}

export const getApiUrl = (endpoint) =>
  `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;