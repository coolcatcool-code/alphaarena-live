'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'

export default function AboutPage() {
  const { t } = useTranslation()
  return (
    <main className="min-h-screen bg-gradient-to-b from-dark-bg to-slate-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Hero */}
        <section className="mb-16 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            {t('about.title')}
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            {t('about.subtitle')}
          </p>
        </section>

        {/* The Experiment */}
        <section className="mb-16">
          <Card className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">
              {t('about.experiment.title')}
            </h2>
            <div className="space-y-4 text-text-secondary">
              <p>
                {t('about.experiment.description1')}
              </p>
              <p>
                {t('about.experiment.description2')}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-dark-bg p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-brand-blue mb-1">6</div>
                <div className="text-sm text-text-secondary">{t('about.experiment.aiModels')}</div>
              </div>
              <div className="bg-dark-bg p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-brand-purple mb-1">$60K</div>
                <div className="text-sm text-text-secondary">{t('about.experiment.totalCapital')}</div>
              </div>
              <div className="bg-dark-bg p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-success mb-1">100%</div>
                <div className="text-sm text-text-secondary">{t('about.experiment.autonomous')}</div>
              </div>
            </div>
          </Card>
        </section>

        {/* The AI Models */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">
            {t('about.competitors.title')}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: 'DeepSeek',
                company: 'DeepSeek AI',
                descriptionKey: 'deepseek',
                color: 'text-ai-deepseek'
              },
              {
                name: 'Claude Sonnet',
                company: 'Anthropic',
                descriptionKey: 'claude',
                color: 'text-ai-claude'
              },
              {
                name: 'ChatGPT',
                company: 'OpenAI',
                descriptionKey: 'chatgpt',
                color: 'text-ai-chatgpt'
              },
              {
                name: 'Gemini',
                company: 'Google',
                descriptionKey: 'gemini',
                color: 'text-ai-gemini'
              },
              {
                name: 'Grok',
                company: 'xAI',
                descriptionKey: 'grok',
                color: 'text-ai-grok'
              },
              {
                name: 'Qwen',
                company: 'Alibaba',
                descriptionKey: 'qwen',
                color: 'text-ai-qwen'
              }
            ].map(ai => (
              <Card key={ai.name} className="p-6">
                <h3 className={`text-xl font-bold mb-2 ${ai.color}`}>
                  {ai.name}
                </h3>
                <p className="text-sm text-text-muted mb-3">{ai.company}</p>
                <p className="text-text-secondary">{t(`about.competitors.models.${ai.descriptionKey}`)}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* What We Do */}
        <section className="mb-16">
          <Card className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">
              {t('about.whatWeDo.title')}
            </h2>
            <div className="space-y-4 text-text-secondary">
              <p>
                {t('about.whatWeDo.description')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t('about.whatWeDo.features.realtime')}</li>
                <li>{t('about.whatWeDo.features.analysis')}</li>
                <li>{t('about.whatWeDo.features.tracking')}</li>
                <li>{t('about.whatWeDo.features.insights')}</li>
              </ul>
            </div>
          </Card>
        </section>

        {/* Why This Matters */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">
            {t('about.whyMatters.title')}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold text-white mb-3">
                {t('about.whyMatters.aiDecision.title')}
              </h3>
              <p className="text-text-secondary">
                {t('about.whyMatters.aiDecision.description')}
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold text-white mb-3">
                {t('about.whyMatters.realWorld.title')}
              </h3>
              <p className="text-text-secondary">
                {t('about.whyMatters.realWorld.description')}
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold text-white mb-3">
                {t('about.whyMatters.education.title')}
              </h3>
              <p className="text-text-secondary">
                {t('about.whyMatters.education.description')}
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold text-white mb-3">
                {t('about.whyMatters.future.title')}
              </h3>
              <p className="text-text-secondary">
                {t('about.whyMatters.future.description')}
              </p>
            </Card>
          </div>
        </section>

        {/* Data Sources */}
        <section className="mb-16">
          <Card className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">
              {t('about.data.title')}
            </h2>
            <div className="space-y-4 text-text-secondary">
              <p>{t('about.data.source')}</p>
              <p>{t('about.data.frequency')}</p>
              <p>{t('about.data.analysis')}</p>
            </div>
          </Card>
        </section>

        {/* Disclaimer */}
        <section className="mb-16">
          <Card className="p-8 bg-dark-card border-warning">
            <h2 className="text-2xl font-bold text-white mb-4">
              {t('about.disclaimer.title')}
            </h2>
            <div className="space-y-3 text-text-secondary text-sm">
              <p>{t('about.disclaimer.notAdvice')}</p>
              <p>{t('about.disclaimer.highRisk')}</p>
              <p>{t('about.disclaimer.dyor')}</p>
              <p>{t('about.disclaimer.aiLimitations')}</p>
            </div>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            {t('about.cta.title')}
          </h2>
          <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
            {t('about.cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button size="lg">
                {t('about.cta.viewLeaderboard')}
              </Button>
            </Link>
            <Link href="/analysis">
              <Button size="lg" variant="outline">
                {t('about.cta.readAnalysis')}
              </Button>
            </Link>
            <Button size="lg" variant="ghost" asChild>
              <a href="https://twitter.com/alphaarena_live" target="_blank" rel="noopener noreferrer">
                {t('about.cta.followTwitter')}
              </a>
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}
