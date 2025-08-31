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
  
  // Grafana Loki Configuration (for client-side logging if needed)
  grafanaLokiUser: process.env.NEXT_PUBLIC_GRAFANA_LOKI_USER || '',
  grafanaLokiPassword: process.env.NEXT_PUBLIC_GRAFANA_LOKI_PASSWORD || '',
  grafanaLokiUrl: process.env.NEXT_PUBLIC_GRAFANA_LOKI_URL || '',
  
  // Security Configuration
  enableHttps: process.env.NEXT_PUBLIC_ENABLE_HTTPS === 'true',
  enableSecureCookies: process.env.NEXT_PUBLIC_ENABLE_SECURE_COOKIES === 'true',
};
