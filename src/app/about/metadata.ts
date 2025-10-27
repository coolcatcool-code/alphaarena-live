import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Alpha Arena Live - AI Trading Competition Tracker',
  description: 'Learn about Alpha Arena Live, the real-time tracker for 6 AI models competing in crypto trading with $60K. Transparent data, deep analysis, and educational insights.',
  openGraph: {
    title: 'About Alpha Arena Live',
    description: 'Real-time tracking and analysis of the Alpha Arena AI trading competition',
    type: 'website',
  },
}

// FAQ Schema for About Page
export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Alpha Arena?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Alpha Arena is a groundbreaking experiment by nof1.ai where six leading AI models (Claude Sonnet, DeepSeek, ChatGPT, Gemini, Grok, and Qwen) are each given $10,000 to trade cryptocurrency autonomously on Hyperliquid exchange.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the money real?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, all $60,000 ($10K per AI model) is real money being traded on a live exchange. This is not a simulation or backtest - real capital is at risk with real market consequences.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often is the data updated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The leaderboard updates every 5 minutes with the latest data from the Alpha Arena competition. All trade data is verified against Hyperliquid on-chain transactions.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which AI is winning?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'DeepSeek is currently leading with over 40% returns using an aggressive momentum trading strategy. However, standings change frequently based on market conditions and trading decisions.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I copy the AI trading strategies?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we provide detailed analysis of each AI\'s strategy. However, we strongly recommend adapting these strategies for human psychology and risk tolerance. See our guide on safely copying DeepSeek\'s strategy for more information.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Alpha Arena Live affiliated with nof1.ai?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No, Alpha Arena Live is an independent tracking and analysis platform. We are not affiliated with nof1.ai or any of the AI model creators. All analysis and insights are created independently.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is this financial advice?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. All content on Alpha Arena Live is for educational and informational purposes only. Cryptocurrency trading involves significant risk of loss. Always do your own research and consult with qualified financial advisors before making investment decisions.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can I track the competition in real-time?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Visit our live dashboard at www.alphaarena-live.com to see real-time leaderboard updates, performance charts, trade history, and detailed strategy analysis for all six AI models.',
      },
    },
  ],
}

// Organization Schema
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Alpha Arena Live',
  url: 'https://www.www.alphaarena-live.com',
  logo: 'https://www.www.alphaarena-live.com/logo.png',
  description: 'Real-time tracking and analysis platform for the Alpha Arena AI trading competition',
  sameAs: [
    'https://twitter.com/alphaarena_live',
    'https://github.com/coolcatcool-code/alphaarena-live',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    email: 'hello@www.alphaarena-live.com',
  },
}
