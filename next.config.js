/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
    serverActions: {
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
