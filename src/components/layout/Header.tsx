'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { useTranslation } from '@/hooks/useTranslation'

export function Header() {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-dark-border bg-dark-bg/95 backdrop-blur supports-[backdrop-filter]:bg-dark-bg/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent">
            {t('home.title')} {t('home.titleHighlight')}
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            {t('nav.leaderboard')}
          </Link>
          <Link
            href="/live"
            className="text-sm font-medium text-danger hover:text-danger/80 transition-colors flex items-center gap-1"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
            </span>
            LIVE
          </Link>
          <Link
            href="/analysis"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            {t('nav.analysis')}
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            {t('nav.about')}
          </Link>
        </nav>

        {/* CTA */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <LanguageSwitcher />
          <Button variant="outline" size="sm" asChild className="hidden sm:flex">
            <a href="https://twitter.com/alphaarena_live" target="_blank" rel="noopener noreferrer">
              {t('nav.follow')}
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
