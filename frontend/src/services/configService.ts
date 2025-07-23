// Simple config service for API base URL
const configService = {
  apiBaseUrl: process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4500'
};

export default configService;
