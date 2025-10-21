'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Locale = 'en' | 'zh'

interface LocaleStore {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'locale-storage',
    }
  )
)

export function useLocale() {
  return useLocaleStore((state) => state.locale)
}

export function useSetLocale() {
  return useLocaleStore((state) => state.setLocale)
}
