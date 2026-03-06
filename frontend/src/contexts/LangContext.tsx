import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface LangContextType {
  lang: 'ar' | 'en'
  isRTL: boolean
  toggleLang: () => void
}

const LangContext = createContext<LangContextType | null>(null)

export function LangProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  const [lang, setLang] = useState<'ar' | 'en'>(
    () => (localStorage.getItem('i18nextLng') as 'ar' | 'en') || 'ar'
  )

  useEffect(() => {
    const htmlEl = document.documentElement
    if (lang === 'ar') {
      htmlEl.setAttribute('dir', 'rtl')
      htmlEl.setAttribute('lang', 'ar')
    } else {
      htmlEl.setAttribute('dir', 'ltr')
      htmlEl.setAttribute('lang', 'en')
    }
  }, [lang])

  const toggleLang = useCallback(() => {
    const next = lang === 'ar' ? 'en' : 'ar'
    setLang(next)
    i18n.changeLanguage(next)
    localStorage.setItem('i18nextLng', next)
  }, [lang, i18n])

  return (
    <LangContext.Provider value={{ lang, isRTL: lang === 'ar', toggleLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside LangProvider')
  return ctx
}
