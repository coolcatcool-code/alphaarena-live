'use client'

import { useLocale, useSetLocale } from '@/hooks/useLocale'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const locale = useLocale()
  const setLocale = useSetLocale()

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'zh' : 'en')
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2"
      title={locale === 'en' ? 'Switch to Chinese' : '切换到英文'}
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">
        {locale === 'en' ? '中文' : 'EN'}
      </span>
    </Button>
  )
}
