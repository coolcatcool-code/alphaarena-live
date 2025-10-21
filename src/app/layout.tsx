import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Alpha Arena Live - AI Trading Competition Tracker',
    template: '%s | Alpha Arena Live'
  },
  description: 'Real-time tracking and analysis of 6 AI models trading crypto with $60K. Watch Claude, DeepSeek, ChatGPT, Gemini, Grok, and Qwen compete in Alpha Arena.',
  keywords: [
    'alpha arena',
    'ai trading',
    'crypto competition',
    'deepseek',
    'claude trading',
    'ai trading tracker',
    'nof1 ai',
    'hyperliquid',
    'ai crypto trading'
  ],
  authors: [{ name: 'Alpha Arena Live Team' }],
  creator: 'Alpha Arena Live',
  publisher: 'Alpha Arena Live',
  metadataBase: new URL('https://alphaarena-live.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://alphaarena-live.vercel.app',
    siteName: 'Alpha Arena Live',
    title: 'Alpha Arena Live - AI Trading Competition Tracker',
    description: 'Real-time tracking of 6 AI models trading crypto with $60K',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Alpha Arena Live - AI Trading Tracker'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alpha Arena Live - AI Trading Competition',
    description: 'Real-time AI trading tracker',
    images: ['/og-image.png'],
    creator: '@alphaarena_live'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  verification: {
    google: 'your-google-verification-code',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
