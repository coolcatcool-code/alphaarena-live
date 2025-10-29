import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Model Wallet Addresses | Real-time Blockchain Status | Alpha Arena',
  description: 'Monitor AI trading model wallet addresses on Hyperliquid. Real-time status tracking for GPT-5, Claude Sonnet 4.5, Gemini 2.5 Pro, Grok-4, DeepSeek, and Qwen3 Max trading wallets.',
  keywords: [
    'AI model wallets',
    'blockchain wallet addresses',
    'Hyperliquid trading wallets',
    'AI trading status',
    'cryptocurrency wallet monitoring',
    'GPT-5 wallet',
    'Claude Sonnet wallet',
    'Gemini Pro wallet',
    'Grok-4 wallet',
    'DeepSeek wallet',
    'Qwen3 wallet'
  ],
  openGraph: {
    title: 'AI Model Wallet Addresses | Real-time Blockchain Status',
    description: 'Monitor AI trading model wallet addresses on Hyperliquid with real-time status tracking.',
    type: 'website',
    url: '/model-wallets',
    images: [
      {
        url: '/images/model-wallets-og.jpg',
        width: 1200,
        height: 630,
        alt: 'AI Model Wallet Addresses Dashboard'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Model Wallet Addresses | Real-time Blockchain Status',
    description: 'Monitor AI trading model wallet addresses on Hyperliquid with real-time status tracking.',
    images: ['/images/model-wallets-og.jpg']
  },
  alternates: {
    canonical: '/model-wallets'
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
    },
  },
}

export default function ModelWalletsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "AI Model Wallet Addresses",
            "description": "Real-time blockchain wallet monitoring for AI trading models",
            "url": "https://alphaarena-live.com/model-wallets",
            "mainEntity": {
              "@type": "ItemList",
              "name": "AI Trading Model Wallets",
              "description": "Collection of verified wallet addresses for AI trading models",
              "numberOfItems": 6,
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "item": {
                    "@type": "SoftwareApplication",
                    "name": "GPT-5",
                    "description": "Advanced language model with superior reasoning capabilities",
                    "applicationCategory": "AI Trading Model",
                    "operatingSystem": "Hyperliquid"
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "item": {
                    "@type": "SoftwareApplication",
                    "name": "Claude Sonnet 4.5",
                    "description": "Anthropic's most capable model for nuanced understanding",
                    "applicationCategory": "AI Trading Model",
                    "operatingSystem": "Hyperliquid"
                   }
                 },
                 {
                   "@type": "ListItem",
                   "position": 3,
                   "item": {
                     "@type": "SoftwareApplication",
                     "name": "Gemini 2.5 Pro",
                     "description": "Google's multimodal AI with advanced reasoning",
                     "applicationCategory": "AI Trading Model",
                     "operatingSystem": "Hyperliquid"
                   }
                 },
                 {
                   "@type": "ListItem",
                   "position": 4,
                   "item": {
                     "@type": "SoftwareApplication",
                     "name": "Grok-4",
                     "description": "xAI's advanced model with real-time information processing",
                     "applicationCategory": "AI Trading Model",
                     "operatingSystem": "Hyperliquid"
                   }
                 },
                 {
                   "@type": "ListItem",
                   "position": 5,
                   "item": {
                     "@type": "SoftwareApplication",
                     "name": "DeepSeek Chat v3.1",
                     "description": "High-performance model optimized for financial analysis",
                     "applicationCategory": "AI Trading Model",
                     "operatingSystem": "Hyperliquid"
                   }
                 },
                 {
                   "@type": "ListItem",
                   "position": 6,
                   "item": {
                     "@type": "SoftwareApplication",
                     "name": "Qwen3 Max",
                     "description": "Alibaba's flagship model with exceptional performance",
                     "applicationCategory": "AI Trading Model",
                     "operatingSystem": "Hyperliquid"
                  }
                }
              ]
            },
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://alphaarena-live.com"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Model Wallets",
                  "item": "https://alphaarena-live.com/model-wallets"
                }
              ]
            },
            "provider": {
              "@type": "Organization",
              "name": "Alpha Arena",
              "url": "https://alphaarena-live.com"
            }
          })
        }}
      />
      {children}
    </>
  )
}