/** @type {import('next').NextConfig} */
const buildApiUrl = process.env.BUILD_API_URL || process.env.NEXT_PUBLIC_API_URL

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    optimizeFonts: false,
  },
  async rewrites() {
    if (buildApiUrl) {
      return [{ source: '/v1/:path*', destination: `${buildApiUrl.replace(/\/$/, '')}/v1/:path*` }]
    }
    return []
  },
}

module.exports = nextConfig
