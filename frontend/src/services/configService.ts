// Configuration Service - Uses environment variables with fallbacks
export const config = {
  // API Configuration
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  
  // Application Information
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Shaadi Mantrana',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Feature Flags
  enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  
  // Backblaze B2 Configuration (for file access)
  b2BucketName: process.env.NEXT_PUBLIC_B2_BUCKET_NAME || '',
  b2BucketId: process.env.NEXT_PUBLIC_B2_BUCKET_ID || '',
  
  // Grafana Loki Configuration (server-only credentials)
  grafanaLokiUser: process.env.GRAFANA_LOKI_USER || '',
  grafanaLokiPassword: process.env.GRAFANA_LOKI_PASSWORD || '',
  grafanaLokiUrl: process.env.GRAFANA_LOKI_URL || '',
  lokiClientApiKey: process.env.LOKI_CLIENT_API_KEY || '',
  lokiUrl: process.env.LOKI_URL || '',
  
  // Security Configuration
  enableHttps: process.env.NEXT_PUBLIC_ENABLE_HTTPS === 'true',
  enableSecureCookies: process.env.NEXT_PUBLIC_ENABLE_SECURE_COOKIES === 'true',
  
  // Token Refresh Configuration
  TOKEN_REFRESH_INTERVAL: 2 * 60 * 1000, // 2 minutes
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
  TOKEN_HEALTH_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
  TOKEN_MAX_RETRIES: 3,
  TOKEN_RETRY_DELAY: 5000, // 5 seconds
  TOKEN_GRACE_PERIOD: 60 * 1000, // 1 minute
};
