/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Required for OpenNext Cloudflare
  images: {
    domains: ['www.alphaarena-live.com', 'alphaarena-live.com'],
    formats: ['image/avif', 'image/webp']
  },
  // Cloudflare Workers compatibility
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Optimize for Cloudflare Pages (25 MiB file size limit)
  webpack: (config, { isServer }) => {
    // Completely disable webpack cache to avoid large cache files
    config.cache = false

    // Also disable filesystem cache
    if (config.cache && typeof config.cache === 'object') {
      config.cache.type = 'memory'
    }

    return config
  },
  // Disable all caching mechanisms
  generateBuildId: async () => {
    // Use timestamp to ensure fresh builds
    return `build-${Date.now()}`
  },
  // Reduce build output size
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-accordion']
  },
}

module.exports = nextConfig
