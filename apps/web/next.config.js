/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  typescript: {
    // Already checked in pre-commit/CI, ignore errors during next build to speed it up
    ignoreBuildErrors: true,
  },
  eslint: {
    // Already checked in linting, ignore eslint during next build to speed it up
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig
