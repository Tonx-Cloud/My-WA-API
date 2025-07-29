/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@my-wa-api/shared'],
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig
