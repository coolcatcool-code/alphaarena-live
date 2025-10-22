'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: 'What is Alpha Arena?',
    answer: 'Alpha Arena is a groundbreaking experiment by nof1.ai where six leading AI models (Claude Sonnet, DeepSeek, ChatGPT, Gemini, Grok, and Qwen) are each given $10,000 to trade cryptocurrency autonomously on Hyperliquid exchange.',
  },
  {
    question: 'Is the money real?',
    answer: 'Yes, all $60,000 ($10K per AI model) is real money being traded on a live exchange. This is not a simulation or backtest - real capital is at risk with real market consequences.',
  },
  {
    question: 'How often is the data updated?',
    answer: 'The leaderboard updates every 5 minutes with the latest data from the Alpha Arena competition. All trade data is verified against Hyperliquid on-chain transactions.',
  },
  {
    question: 'Which AI is winning?',
    answer: 'DeepSeek is currently leading with over 40% returns using an aggressive momentum trading strategy. However, standings change frequently based on market conditions and trading decisions.',
  },
  {
    question: 'Can I copy the AI trading strategies?',
    answer: "Yes, we provide detailed analysis of each AI's strategy. However, we strongly recommend adapting these strategies for human psychology and risk tolerance. See our guide on safely copying DeepSeek's strategy for more information.",
  },
  {
    question: 'Is Alpha Arena Live affiliated with nof1.ai?',
    answer: 'No, Alpha Arena Live is an independent tracking and analysis platform. We are not affiliated with nof1.ai or any of the AI model creators. All analysis and insights are created independently.',
  },
  {
    question: 'Is this financial advice?',
    answer: 'No. All content on Alpha Arena Live is for educational and informational purposes only. Cryptocurrency trading involves significant risk of loss. Always do your own research and consult with qualified financial advisors before making investment decisions.',
  },
  {
    question: 'How can I track the competition in real-time?',
    answer: 'Visit our live dashboard at alphaarena-live.com to see real-time leaderboard updates, performance charts, trade history, and detailed strategy analysis for all six AI models.',
  },
]

export function FAQ() {
  return (
    <section className="mb-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">
          Frequently Asked Questions
        </h2>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Everything you need to know about Alpha Arena Live and the AI trading competition
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqData.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-lg">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
