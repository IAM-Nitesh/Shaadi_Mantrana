/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configure source directory for Next.js
  experimental: {
    appDir: true // Using app router
  },
  
  // Set up build output for static export if needed
  trailingSlash: true,
  output: 'export',
  distDir: 'out',
  
  // Configure asset paths for static hosting
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Handle environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Configure webpack to handle frontend assets
  webpack: (config, { isServer }) => {
    // Add alias to resolve imports from frontend/src
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'frontend/src'),
    };
    config.resolve.modules.push('frontend/src');
    return config;
  }
};

module.exports = nextConfig;
