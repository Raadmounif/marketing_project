import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { t } = useTranslation()
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/'

  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(loginId, password)
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex justify-center">
            <img
              src="/puff-plaza-logo.png"
              alt=""
              width={128}
              height={128}
              className="h-28 w-28 sm:h-32 sm:w-32 rounded-xl object-contain mx-auto"
              decoding="async"
            />
          </div>
          <h1 className="text-2xl font-black text-cream-100">{t('auth.login_title')}</h1>
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-text">{t('auth.login_id')}</label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                autoComplete="username"
                className="input-field"
                placeholder={t('auth.login_id_placeholder')}
              />
            </div>

            <div>
              <label className="label-text">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full text-base py-3 disabled:opacity-60"
            >
              {isLoading ? t('common.loading') : t('auth.login_btn')}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-tobacco-400">
            {t('auth.no_account')}{' '}
            <Link to="/register" className="text-gold-400 hover:text-gold-300 font-medium transition-colors">
              {t('auth.register_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
