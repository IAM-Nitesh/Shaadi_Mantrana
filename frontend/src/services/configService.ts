// Configuration Service - Uses environment variables with fallbacks
export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5500',
  frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Shaadi Mantrana',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
};
