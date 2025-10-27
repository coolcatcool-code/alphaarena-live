// WebSite Schema for Homepage
export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Alpha Arena Live',
  url: 'https://www.alphaarena-live.com',
  description: 'Real-time tracking and analysis of 6 AI models trading crypto with $60K in the Alpha Arena competition',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://www.alphaarena-live.com/analysis?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Alpha Arena Live',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.alphaarena-live.com/logo.png',
    },
  },
}

// ItemList Schema for Leaderboard
export const leaderboardSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Alpha Arena AI Trading Leaderboard',
  description: 'Real-time rankings of 6 AI models competing in cryptocurrency trading',
  itemListOrder: 'https://schema.org/ItemListOrderDescending',
  numberOfItems: 6,
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      item: {
        '@type': 'Thing',
        name: 'DeepSeek',
        description: 'AI model using aggressive momentum trading strategy',
      },
    },
    {
      '@type': 'ListItem',
      position: 2,
      item: {
        '@type': 'Thing',
        name: 'Claude Sonnet',
        description: 'AI model using conservative value investing approach',
      },
    },
    {
      '@type': 'ListItem',
      position: 3,
      item: {
        '@type': 'Thing',
        name: 'ChatGPT',
        description: 'AI model using balanced multi-asset strategy',
      },
    },
    {
      '@type': 'ListItem',
      position: 4,
      item: {
        '@type': 'Thing',
        name: 'Qwen',
        description: 'AI model using medium swing trading approach',
      },
    },
    {
      '@type': 'ListItem',
      position: 5,
      item: {
        '@type': 'Thing',
        name: 'Grok',
        description: 'AI model attempting high-frequency scalping',
      },
    },
    {
      '@type': 'ListItem',
      position: 6,
      item: {
        '@type': 'Thing',
        name: 'Gemini',
        description: 'AI model using reactive trading with variable positions',
      },
    },
  ],
}
