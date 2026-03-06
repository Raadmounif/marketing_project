import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { usersApi } from '../../api'
import { UAE_STATES } from '../../types'
import type { User } from '../../types'

type Tab = 'staff' | 'customer'

const emptyForm = {
  name: '', phone: '', email: '', password: '', password_confirmation: '',
  role: 'customer' as 'staff' | 'customer', state: '', address: '',
}

const emptyReset = { password: '', password_confirmation: '' }

export default function ManageUsers() {
  const { t } = useTranslation()
  const { user: me } = useAuth()
  const isAdmin = me?.role === 'admin'

  const [tab, setTab] = useState<Tab>('customer')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)

  const [resetTarget, setResetTarget] = useState<User | null>(null)
  const [resetForm, setResetForm] = useState(emptyReset)
  const [resetErrors, setResetErrors] = useState<Record<string, string[]>>({})
  const [resetting, setResetting] = useState(false)

  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const loadUsers = () => {
    setLoading(true)
    usersApi.list().then((res) => setUsers(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { loadUsers() }, [])

  const displayed = users.filter((u) => u.role === tab)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormErrors({})
    try {
      await usersApi.create(form)
      setShowCreate(false)
      setForm(emptyForm)
      loadUsers()
      showToast(t('users.created'))
    } catch (err: any) {
      if (err.response?.data?.errors) setFormErrors(err.response.data.errors)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (!confirm(t('users.confirm_delete'))) return
    try {
      await usersApi.delete(user.id)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      showToast(t('users.deleted'))
    } catch (err: any) {
      alert(err.response?.data?.message || t('common.error'))
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetTarget) return
    setResetting(true)
    setResetErrors({})
    try {
      await usersApi.resetPassword(resetTarget.id, resetForm)
      setResetTarget(null)
      setResetForm(emptyReset)
      showToast(t('users.password_reset'))
    } catch (err: any) {
      if (err.response?.data?.errors) setResetErrors(err.response.data.errors)
      else alert(err.response?.data?.message || t('common.error'))
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
      <h1 className="section-title text-3xl mb-6">{t('users.title')}</h1>

      {/* Tabs — admin sees both, staff only customers */}
      {isAdmin && (
        <div className="flex gap-2 mb-6">
          {(['customer', 'staff'] as Tab[]).map((t2) => (
            <button
              key={t2}
              onClick={() => setTab(t2)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                tab === t2
                  ? 'bg-gold-500 text-tobacco-950'
                  : 'bg-tobacco-800 text-tobacco-300 hover:bg-tobacco-700'
              }`}
            >
              {t2 === 'staff' ? t('users.tab_staff') : t('users.tab_customers')}
            </button>
          ))}
        </div>
      )}

      {/* Add button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setForm({ ...emptyForm, role: tab === 'staff' ? 'staff' : 'customer' })
            setFormErrors({})
            setShowCreate(true)
          }}
          className="btn-primary text-sm"
        >
          + {t('users.add_user')}
        </button>
      </div>

      {/* User list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="card p-12 text-center text-tobacco-500">{t('users.no_users')}</div>
      ) : (
        <div className="space-y-3">
          {displayed.map((user) => (
            <div key={user.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-cream-100">{user.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.role === 'admin' ? 'bg-red-900 text-red-300'
                    : user.role === 'staff' ? 'bg-blue-900 text-blue-300'
                    : 'bg-tobacco-700 text-tobacco-300'
                  }`}>
                    {user.role === 'staff' ? t('users.role_staff') : t('users.role_customer')}
                  </span>
                </div>
                <p className="text-tobacco-400 text-sm mt-0.5">{user.email}</p>
                <p className="text-tobacco-500 text-xs">{user.phone} · {t('users.joined')}: {new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => { setResetTarget(user); setResetForm(emptyReset); setResetErrors({}) }}
                  className="px-3 py-1.5 text-xs bg-tobacco-700 hover:bg-tobacco-600 text-cream-200 rounded-lg transition-colors"
                >
                  {t('users.reset_password')}
                </button>
                <button
                  onClick={() => handleDelete(user)}
                  className="px-3 py-1.5 text-xs bg-red-900/60 hover:bg-red-800 text-red-300 rounded-lg transition-colors"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-tobacco-900 rounded-2xl border border-tobacco-700 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-tobacco-700">
              <h2 className="text-lg font-bold text-gold-400">{t('users.add_user')}</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-tobacco-800 text-tobacco-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-3">
              <div>
                <label className="label-text">{t('users.name')}</label>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className="input-field" />
                {formErrors.name && <p className="text-red-400 text-xs mt-1">{formErrors.name[0]}</p>}
              </div>
              <div>
                <label className="label-text">{t('users.phone')}</label>
                <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required className="input-field" />
                {formErrors.phone && <p className="text-red-400 text-xs mt-1">{formErrors.phone[0]}</p>}
              </div>
              <div>
                <label className="label-text">{t('users.email')}</label>
                <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required className="input-field" />
                {formErrors.email && <p className="text-red-400 text-xs mt-1">{formErrors.email[0]}</p>}
              </div>
              {isAdmin && (
                <div>
                  <label className="label-text">{t('users.role')}</label>
                  <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as 'staff' | 'customer' }))} className="input-field">
                    <option value="customer">{t('users.role_customer')}</option>
                    <option value="staff">{t('users.role_staff')}</option>
                  </select>
                </div>
              )}
              <div>
                <label className="label-text">{t('users.password')}</label>
                <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required className="input-field" />
                {formErrors.password && <p className="text-red-400 text-xs mt-1">{formErrors.password[0]}</p>}
              </div>
              <div>
                <label className="label-text">{t('users.password_confirm')}</label>
                <input type="password" value={form.password_confirmation} onChange={(e) => setForm((p) => ({ ...p, password_confirmation: e.target.value }))} required className="input-field" />
              </div>
              {form.role === 'customer' && (
                <>
                  <div>
                    <label className="label-text">{t('auth.state')} ({t('common.no')} {t('common.confirm')})</label>
                    <select value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} className="input-field">
                      <option value="">—</option>
                      {UAE_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-text">{t('auth.address')}</label>
                    <textarea value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} rows={2} className="input-field resize-none" />
                  </div>
                </>
              )}
              <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60">
                {saving ? t('common.loading') : t('users.add_user')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setResetTarget(null)} />
          <div className="relative bg-tobacco-900 rounded-2xl border border-tobacco-700 shadow-2xl w-full max-w-sm animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-tobacco-700">
              <h2 className="text-base font-bold text-gold-400">{t('users.reset_password')} — {resetTarget.name}</h2>
              <button onClick={() => setResetTarget(null)} className="p-2 rounded-lg hover:bg-tobacco-800 text-tobacco-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-4 space-y-3">
              <div>
                <label className="label-text">{t('users.password_new')}</label>
                <input type="password" value={resetForm.password} onChange={(e) => setResetForm((p) => ({ ...p, password: e.target.value }))} required className="input-field" />
                {resetErrors.password && <p className="text-red-400 text-xs mt-1">{resetErrors.password[0]}</p>}
              </div>
              <div>
                <label className="label-text">{t('users.password_confirm')}</label>
                <input type="password" value={resetForm.password_confirmation} onChange={(e) => setResetForm((p) => ({ ...p, password_confirmation: e.target.value }))} required className="input-field" />
              </div>
              <button type="submit" disabled={resetting} className="btn-primary w-full disabled:opacity-60">
                {resetting ? t('common.loading') : t('users.reset_password')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 inset-x-0 flex justify-center z-50 pointer-events-none">
          <div className="bg-forest-600 text-white px-6 py-3 rounded-full shadow-lg font-medium animate-slide-up">
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}
