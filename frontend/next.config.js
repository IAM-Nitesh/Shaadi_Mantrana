/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  outputFileTracingRoot: __dirname,
  trailingSlash: true,
  transpilePackages: ['@capacitor-firebase/authentication'],
  images: {
    unoptimized: true,
  },
  experimental: {
    viewTransition: true
  }
}

module.exports = nextConfig

