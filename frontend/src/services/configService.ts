// To configure the backend port, set NEXT_PUBLIC_API_BASE_URL in your .env file.
// Example: NEXT_PUBLIC_API_BASE_URL=http://localhost:3500 (static), 4500 (dev), 5500 (prod)
const configService = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4500'
};
export default configService;
