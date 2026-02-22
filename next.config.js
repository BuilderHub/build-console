/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    optimizeFonts: false,
  },
}

module.exports = nextConfig
