/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['www.alphaarena-live.com', 'alphaarena-live.com'],
    formats: ['image/avif', 'image/webp']
  },
}

module.exports = nextConfig
