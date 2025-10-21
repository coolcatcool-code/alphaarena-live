// 简化的国际化方案
import enMessages from '../../../messages/en.json'
import zhMessages from '../../../messages/zh.json'

export type Locale = 'en' | 'zh'

const messages = {
  en: enMessages,
  zh: zhMessages
}

export function getMessages(locale: Locale = 'en') {
  return messages[locale] || messages.en
}

export function useTranslations(locale: Locale = 'en') {
  const msgs = getMessages(locale)

  return function t(key: string): string {
    const keys = key.split('.')
    let value: any = msgs

    for (const k of keys) {
      value = value?.[k]
    }

    return value || key
  }
}
