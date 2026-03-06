import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { UAE_STATES } from '../types'

export default function Register() {
  const { t } = useTranslation()
  const { register, isLoading } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '',
    password_confirmation: '', state: '', address: '',
  })
  const [error, setError] = useState<string | Record<string, string[]>>('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await register(form)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.errors || err.response?.data?.message || t('common.error'))
    }
  }

  const getFieldError = (field: string) => {
    if (typeof error === 'object' && error !== null) {
      return (error as Record<string, string[]>)[field]?.[0]
    }
    return ''
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-tobacco-950 font-black text-3xl">T</span>
          </div>
          <h1 className="text-2xl font-black text-cream-100">{t('auth.register_title')}</h1>
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">{t('auth.name')}</label>
                <input name="name" value={form.name} onChange={handleChange} required className="input-field" />
                {getFieldError('name') && <p className="text-red-400 text-xs mt-1">{getFieldError('name')}</p>}
              </div>
              <div>
                <label className="label-text">{t('auth.phone')}</label>
                <input name="phone" value={form.phone} onChange={handleChange} required type="tel" className="input-field" />
                <p className="text-tobacco-500 text-xs mt-1">{t('auth.phone_hint')}</p>
                {getFieldError('phone') && <p className="text-red-400 text-xs mt-1">{getFieldError('phone')}</p>}
              </div>
            </div>

            <div>
              <label className="label-text">{t('auth.email')}</label>
              <input name="email" value={form.email} onChange={handleChange} required type="email" className="input-field" />
              {getFieldError('email') && <p className="text-red-400 text-xs mt-1">{getFieldError('email')}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">{t('auth.password')}</label>
                <input name="password" value={form.password} onChange={handleChange} required type="password" className="input-field" />
                {getFieldError('password') && <p className="text-red-400 text-xs mt-1">{getFieldError('password')}</p>}
              </div>
              <div>
                <label className="label-text">{t('auth.password_confirm')}</label>
                <input name="password_confirmation" value={form.password_confirmation} onChange={handleChange} required type="password" className="input-field" />
              </div>
            </div>

            <div>
              <label className="label-text">{t('auth.state')}</label>
              <select name="state" value={form.state} onChange={handleChange} required className="input-field">
                <option value="">— {t('auth.state')} —</option>
                {UAE_STATES.map((s) => (
                  <option key={s} value={s}>{t(`states.${s}`)}</option>
                ))}
              </select>
              {getFieldError('state') && <p className="text-red-400 text-xs mt-1">{getFieldError('state')}</p>}
            </div>

            <div>
              <label className="label-text">{t('auth.address')}</label>
              <textarea name="address" value={form.address} onChange={handleChange} required rows={2} className="input-field resize-none" />
              {getFieldError('address') && <p className="text-red-400 text-xs mt-1">{getFieldError('address')}</p>}
            </div>

            {typeof error === 'string' && error && (
              <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-300 text-sm">{error}</div>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary w-full text-base py-3 disabled:opacity-60">
              {isLoading ? t('common.loading') : t('auth.register_btn')}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-tobacco-400">
            {t('auth.has_account')}{' '}
            <Link to="/login" className="text-gold-400 hover:text-gold-300 font-medium">{t('auth.login_link')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
