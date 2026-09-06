/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 must stay external for the Node runtime
  serverExternalPackages: ['better-sqlite3'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    // Allow larger admin image uploads (nginx must allow the same or more)
    proxyClientMaxBodySize: '25mb',
    serverActions: {
      bodySizeLimit: '25mb',
      allowedOrigins: ['secure.wayforpay.com'],
    },
  },
  async rewrites() {
    return [
      {
        source: '/images/uploads/:filename',
        destination: '/api/uploads/:filename',
      },
    ]
  },
}
module.exports = nextConfig
