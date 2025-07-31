/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@my-wa-api/shared'],
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3000',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
}

module.exports = nextConfig
