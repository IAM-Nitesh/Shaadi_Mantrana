// Configuration Service - Uses environment variables with fallbacks
export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Shaadi Mantrana',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
};
