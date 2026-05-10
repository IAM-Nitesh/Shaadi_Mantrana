/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  outputFileTracingRoot: __dirname,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  optimizeFonts: false,
  // Proxy API requests to backend in development
  async rewrites() {
    // Rewrites are not supported with output: 'export'
    // This will only work in development mode without 'next build'
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:5500/api/:path*',
        },
      ];
    }
    return [];
  },
}

module.exports = nextConfig

