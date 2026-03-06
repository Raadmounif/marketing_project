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
            <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center">
              <span className="text-tobacco-950 font-black">T</span>
            </div>
            <span className="font-black text-gold-400">
              {lang === 'ar' ? 'سوق التبغ الإلكتروني' : 'Tobacco Electronic Market'}
            </span>
          </div>
          <p className="text-tobacco-500 text-sm text-center">
            {lang === 'ar'
              ? '© 2025 سوق التبغ الإلكتروني. جميع الحقوق محفوظة.'
              : '© 2025 Tobacco Electronic Market. All rights reserved.'}
          </p>
          <div className="text-tobacco-600 text-xs">
            {lang === 'ar' ? 'الأسعار بالدرهم الإماراتي' : 'Prices in AED'}
          </div>
        </div>
      </div>
    </footer>
  )
}
