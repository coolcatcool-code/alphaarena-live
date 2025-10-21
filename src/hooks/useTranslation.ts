'use client'

import { useLocale } from './useLocale'
import enMessages from '../../messages/en.json'
import zhMessages from '../../messages/zh.json'

const messages = {
  en: enMessages,
  zh: zhMessages
}

export function useTranslation() {
  const locale = useLocale()

  const t = (key: string): string => {
    const keys = key.split('.')
    const msgs = messages[locale] || messages.en
    let value: any = msgs

    for (const k of keys) {
      value = value?.[k]
      if (!value) break
    }

    return typeof value === 'string' ? value : key
  }

  return { t, locale }
}
