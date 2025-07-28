/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for development to enable API calls
  // output: 'export', // Commented out for development
  // trailingSlash: true, // Commented out to prevent trailing slash issues
  images: {
    unoptimized: true
  },
  // distDir: '../android/app/src/main/assets/www', // Commented out for development
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Add API proxy for development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4500'}/api/:path*`,
      },
    ];
  },
}

module.exports = nextConfig
