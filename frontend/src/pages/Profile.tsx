import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../api'
import { UAE_STATES } from '../types'

export default function Profile() {
  const { t } = useTranslation()
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    state: user?.state || '',
    address: user?.address || '',
    password: '',
    password_confirmation: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload: Record<string, string> = {
        name: form.name, phone: form.phone,
        state: form.state, address: form.address,
      }
      if (form.password) {
        payload.password = form.password
        payload.password_confirmation = form.password_confirmation
      }
      const res = await authApi.updateProfile(payload)
      updateUser(res.data)
      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">
      <h1 className="section-title text-3xl mb-8">{t('profile.title')}</h1>

      {success && (
        <div className="mb-4 p-3 bg-forest-600/30 border border-forest-600 rounded-lg text-forest-600 text-sm">
          {t('profile.updated')}
        </div>
      )}

      <div className="card p-6">
        {!editing ? (
          <div className="space-y-4">
            {[
              ['auth.name', user.name],
              ['auth.phone', user.phone],
              ['auth.email', user.email],
              ['auth.state', user.state ? t(`states.${user.state}`) : '—'],
              ['auth.address', user.address || '—'],
            ].map(([labelKey, value]) => (
              <div key={labelKey} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3 border-b border-tobacco-700 last:border-0">
                <span className="text-tobacco-400 text-sm min-w-32">{t(labelKey as any)}</span>
                <span className="text-cream-100 font-medium">{value}</span>
              </div>
            ))}
            <button onClick={() => setEditing(true)} className="btn-primary mt-4">{t('profile.edit')}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">{t('auth.name')}</label>
                <input name="name" value={form.name} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="label-text">{t('auth.phone')}</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="input-field" />
              </div>
            </div>

            <div>
              <label className="label-text">{t('auth.state')}</label>
              <select name="state" value={form.state} onChange={handleChange} className="input-field">
                <option value="">— {t('auth.state')} —</option>
                {UAE_STATES.map((s) => (
                  <option key={s} value={s}>{t(`states.${s}`)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text">{t('auth.address')}</label>
              <textarea name="address" value={form.address} onChange={handleChange} rows={2} className="input-field resize-none" />
            </div>

            <div className="border-t border-tobacco-700 pt-4">
              <p className="text-sm text-tobacco-400 mb-3">تغيير كلمة المرور (اختياري)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-text">{t('auth.password')}</label>
                  <input name="password" value={form.password} onChange={handleChange} type="password" className="input-field" />
                </div>
                <div>
                  <label className="label-text">{t('auth.password_confirm')}</label>
                  <input name="password_confirmation" value={form.password_confirmation} onChange={handleChange} type="password" className="input-field" />
                </div>
              </div>
            </div>

            {error && <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-300 text-sm">{error}</div>}

            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
                {loading ? t('common.loading') : t('profile.save')}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">{t('profile.cancel')}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
