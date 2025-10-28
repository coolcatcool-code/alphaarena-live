/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['www.alphaarena-live.com', 'alphaarena-live.com'],
    formats: ['image/avif', 'image/webp']
  },
  // Cloudflare Pages compatibility
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Optimize for Cloudflare Pages (25 MiB file size limit)
  webpack: (config, { isServer }) => {
    // Disable webpack cache to avoid large cache files
    config.cache = false
    return config
  },
  // Reduce build output size
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-accordion']
  },
}

module.exports = nextConfig
