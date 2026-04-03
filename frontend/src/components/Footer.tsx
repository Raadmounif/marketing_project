import { useTranslation } from 'react-i18next'
import { useLang } from '../contexts/LangContext'

export default function Footer() {
  const { t } = useTranslation()
  const { lang } = useLang()

  return (
    <footer className="bg-tobacco-950 border-t border-tobacco-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/puff-plaza-logo.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg shrink-0 object-contain"
              decoding="async"
            />
            <span className="font-black text-gold-400">{t('common.site_name')}</span>
          </div>
          <p className="text-tobacco-500 text-sm text-center">{t('common.site_copyright')}</p>
          <div className="text-tobacco-600 text-xs">
            {lang === 'ar' ? 'الأسعار بالدرهم الإماراتي' : 'Prices in AED'}
          </div>
        </div>
      </div>
    </footer>
  )
}
