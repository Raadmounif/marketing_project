import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { settingsApi } from '../../api'

export default function AdminSettings() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    settingsApi.get().then((res) => {
      setEmail(res.data.notification_email || '')
    }).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await settingsApi.update({ notification_email: email })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 animate-fade-in">
      <div className="mb-8">
        <Link to="/staff" className="text-tobacco-400 hover:text-gold-400 text-sm mb-2 block">← {t('staff.dashboard')}</Link>
        <h1 className="section-title text-2xl">{t('admin.settings')}</h1>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-forest-600/30 border border-forest-600 rounded-lg text-forest-600 text-sm">
          {t('admin.settings_saved')}
        </div>
      )}

      <div className="card p-6">
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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
              <p className="text-tobacco-500 text-xs mt-1">
                {t('order.title')} — {t('tracking.upload_receipt')}
              </p>
            </div>

            {error && <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-300 text-sm">{error}</div>}

            <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60">
              {saving ? t('common.loading') : t('admin.save_settings')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
