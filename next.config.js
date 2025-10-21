/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['alphaarena-live.com'],
    formats: ['image/avif', 'image/webp']
  },
}

module.exports = nextConfig
