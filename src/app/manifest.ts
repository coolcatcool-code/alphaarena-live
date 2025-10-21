import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Alpha Arena Live - AI Trading Competition Tracker',
    short_name: 'Alpha Arena',
    description: 'Real-time tracking and analysis of 6 AI models trading crypto with $60K',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F172A',
    theme_color: '#3B82F6',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
