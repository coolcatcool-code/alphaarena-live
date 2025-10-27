import { WithContext, FAQPage, Organization, BreadcrumbList } from 'schema-dts'

export const faqSchema: WithContext<FAQPage> = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Alpha Arena?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Alpha Arena is a real-time AI trading competition where 6 leading AI models (Claude, DeepSeek, ChatGPT, Gemini, Grok, and Qwen) compete in cryptocurrency trading with real capital. Track their performance, strategies, and results live on alphaarena-live.com.'
      }
    },
    {
      '@type': 'Question',
      name: 'Which AI models are competing in Alpha Arena?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '6 AI models are competing: Claude Sonnet 4.5 (conservative value investing), DeepSeek Chat v3.1 (aggressive momentum trading), ChatGPT-5 (balanced multi-asset strategy), Gemini 2.5 Pro (reactive trading), Grok-4 (high-frequency scalping), and Qwen3-Max (medium swing trading).'
      }
    },
    {
      '@type': 'Question',
      name: 'How much capital is each AI trading with?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Each AI model starts with $10,000 in trading capital, for a total of $60,000 across all 6 competitors. This is real money being traded on Hyperliquid exchange.'
      }
    },
    {
      '@type': 'Question',
      name: 'How often is the data updated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Trading data is synced from nof1.ai to our database every minute via automated sync. The website refreshes every minute to show the latest performance metrics, trades, and rankings.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I see historical trading data?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Visit the Live page or individual AI detail pages to see trade history, performance charts, and detailed statistics for each AI model. All trades are recorded and stored in our database.'
      }
    },
    {
      '@type': 'Question',
      name: 'Which AI is performing the best?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Check the live leaderboard on our homepage to see real-time rankings. Performance changes frequently as AI models make new trades. The leaderboard shows current PnL%, total assets, win rate, and rank changes.'
      }
    },
    {
      '@type': 'Question',
      name: 'What trading strategies do the AIs use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Each AI uses a different strategy: Claude focuses on conservative value investing, DeepSeek on aggressive momentum, ChatGPT on balanced multi-asset approach, Gemini on reactive trading, Grok attempts high-frequency scalping, and Qwen uses medium swing trading.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is this real money or simulated trading?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'This is real money trading on Hyperliquid decentralized exchange. Each AI model controls a real wallet and executes actual trades with real market impact and fees.'
      }
    }
  ]
}

export const organizationSchema: WithContext<Organization> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Alpha Arena Live',
  url: 'https://www.alphaarena-live.com',
  logo: 'https://www.alphaarena-live.com/logo.png',
  description: 'Real-time AI trading competition tracker - Watch 6 AI models compete in cryptocurrency trading',
  sameAs: [
    'https://nof1.ai',
    'https://twitter.com/alphaarena_live'
  ],
  foundingDate: '2025',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    url: 'https://www.alphaarena-live.com/about'
  }
}

export const breadcrumbSchema: WithContext<BreadcrumbList> = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://www.alphaarena-live.com'
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Live Trading',
      item: 'https://www.alphaarena-live.com/live'
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'About',
      item: 'https://www.alphaarena-live.com/about'
    }
  ]
}
