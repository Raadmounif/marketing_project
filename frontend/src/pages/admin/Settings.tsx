import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { settingsApi } from '../../api'

const HEADER_URL_FIELDS = [
  { key: 'contact_url', labelKey: 'admin.contact_url' },
  { key: 'social_instagram_url', labelKey: 'admin.social_instagram' },
  { key: 'social_facebook_url', labelKey: 'admin.social_facebook' },
  { key: 'social_tiktok_url', labelKey: 'admin.social_tiktok' },
  { key: 'social_youtube_url', labelKey: 'admin.social_youtube' },
  { key: 'social_x_url', labelKey: 'admin.social_x' },
  { key: 'social_snapchat_url', labelKey: 'admin.social_snapchat' },
  { key: 'social_whatsapp_url', labelKey: 'admin.social_whatsapp' },
] as const

type HeaderKey = (typeof HEADER_URL_FIELDS)[number]['key']

const emptyHeader: Record<HeaderKey, string> = {
  contact_url: '',
  social_instagram_url: '',
  social_facebook_url: '',
  social_tiktok_url: '',
  social_youtube_url: '',
  social_x_url: '',
  social_snapchat_url: '',
  social_whatsapp_url: '',
}

export default function AdminSettings() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [headerLinks, setHeaderLinks] = useState(emptyHeader)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    settingsApi
      .get()
      .then((res) => {
        setEmail(res.data.notification_email || '')
        setHeaderLinks({
          contact_url: (res.data.contact_url as string) || '',
          social_instagram_url: (res.data.social_instagram_url as string) || '',
          social_facebook_url: (res.data.social_facebook_url as string) || '',
          social_tiktok_url: (res.data.social_tiktok_url as string) || '',
          social_youtube_url: (res.data.social_youtube_url as string) || '',
          social_x_url: (res.data.social_x_url as string) || '',
          social_snapchat_url: (res.data.social_snapchat_url as string) || '',
          social_whatsapp_url: (res.data.social_whatsapp_url as string) || '',
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload: Record<string, string | null> = {
        notification_email: email,
      }
      for (const { key } of HEADER_URL_FIELDS) {
        const v = headerLinks[key].trim()
        payload[key] = v === '' ? null : v
      }
      await settingsApi.update(payload)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      let message = t('common.error')
      if (err && typeof err === 'object' && 'response' in err) {
        const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
          .response?.data
        if (data?.errors) {
          const first = Object.values(data.errors)[0]?.[0]
          if (first) message = first
        } else if (typeof data?.message === 'string') {
          message = data.message
        }
      }
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 animate-fade-in">
      <div className="mb-8">
        <Link to="/staff" className="text-tobacco-400 hover:text-gold-400 text-sm mb-2 block">
          ← {t('staff.dashboard')}
        </Link>
        <h1 className="section-title text-2xl">{t('admin.settings')}</h1>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-forest-600/30 border border-forest-600 rounded-lg text-forest-600 text-sm">
          {t('admin.settings_saved')}
        </div>
      )}

      <div className="card p-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="text-cream-200 font-bold text-sm mb-3">{t('admin.header_section')}</h2>
              <p className="text-tobacco-500 text-xs mb-4">{t('admin.header_section_hint')}</p>
              <div className="space-y-4">
                {HEADER_URL_FIELDS.map(({ key, labelKey }) => (
                  <div key={key}>
                    <label className="label-text">{t(labelKey)}</label>
                    <input
                      type="url"
                      inputMode="url"
                      value={headerLinks[key]}
                      onChange={(e) => setHeaderLinks((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="input-field"
                      placeholder={
                        key === 'contact_url' ? 'https://… or mailto:…' : 'https://…'
                      }
                      dir="ltr"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-tobacco-700 pt-6">
              <h2 className="text-cream-200 font-bold text-sm mb-3">{t('admin.notifications_section')}</h2>
              <div>
                <label className="label-text">{t('admin.notification_email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                  placeholder="notifications@example.com"
                  dir="ltr"
                />
                <p className="text-tobacco-500 text-xs mt-1">{t('admin.notification_email_hint')}</p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-300 text-sm">{error}</div>
            )}

            <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60">
              {saving ? t('common.loading') : t('admin.save_settings')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
