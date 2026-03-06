import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '../../contexts/LangContext'
import { offersApi } from '../../api'
import { UAE_STATES } from '../../types'
import type { Offer } from '../../types'

const EMPTY_COSTS = UAE_STATES.reduce((acc, s) => ({ ...acc, [s]: 0 }), { other: 0 } as Record<string, number>)

export default function ManageOffers() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [form, setForm] = useState({ name_ar: '', name_en: '', code: '', delivery_costs: { ...EMPTY_COSTS } })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    offersApi.list().then((res) => setOffers(res.data)).finally(() => setLoading(false))
  }, [])

  const openCreate = () => {
    setEditingOffer(null)
    setForm({ name_ar: '', name_en: '', code: '', delivery_costs: { ...EMPTY_COSTS } })
    setShowForm(true)
    setError('')
  }

  const openEdit = (offer: Offer) => {
    setEditingOffer(offer)
    setForm({
      name_ar: offer.name_ar,
      name_en: offer.name_en,
      code: offer.code,
      delivery_costs: { ...EMPTY_COSTS, ...offer.delivery_costs },
    })
    setShowForm(true)
    setError('')
  }

  const handleCostChange = (key: string, val: string) => {
    setForm((prev) => ({
      ...prev,
      delivery_costs: { ...prev.delivery_costs, [key]: parseFloat(val) || 0 },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingOffer) {
        const res = await offersApi.update(editingOffer.id, form)
        setOffers((prev) => prev.map((o) => o.id === editingOffer.id ? res.data : o))
      } else {
        const res = await offersApi.create(form)
        setOffers((prev) => [res.data, ...prev])
      }
      setShowForm(false)
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('staff.confirm_delete'))) return
    await offersApi.delete(id)
    setOffers((prev) => prev.filter((o) => o.id !== id))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/staff" className="text-tobacco-400 hover:text-gold-400 text-sm mb-2 block">← {t('staff.dashboard')}</Link>
          <h1 className="section-title text-2xl">{t('staff.manage_offers')}</h1>
        </div>
        <button onClick={openCreate} className="btn-primary">{t('staff.add_offer')}</button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-tobacco-900 rounded-2xl border border-tobacco-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-tobacco-700">
              <h2 className="text-lg font-bold text-gold-400">
                {editingOffer ? t('staff.edit_offer') : t('staff.add_offer')}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-tobacco-800 text-tobacco-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-text">{t('staff.offer_name_ar')}</label>
                  <input value={form.name_ar} onChange={(e) => setForm((p) => ({ ...p, name_ar: e.target.value }))} required className="input-field" dir="rtl" />
                </div>
                <div>
                  <label className="label-text">{t('staff.offer_name_en')}</label>
                  <input value={form.name_en} onChange={(e) => setForm((p) => ({ ...p, name_en: e.target.value }))} required className="input-field" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="label-text">{t('staff.offer_code')}</label>
                <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} required className="input-field font-mono" />
              </div>

              <div>
                <p className="label-text mb-3">{t('staff.delivery_costs')} ({t('common.aed')})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {UAE_STATES.map((state) => (
                    <div key={state}>
                      <label className="text-xs text-tobacco-400 mb-1 block">{t(`states.${state}`)}</label>
                      <input
                        type="number"
                        value={form.delivery_costs[state] ?? 0}
                        onChange={(e) => handleCostChange(state, e.target.value)}
                        min="0"
                        step="0.5"
                        className="input-field text-sm py-2"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-tobacco-400 mb-1 block">{t('staff.delivery_other')}</label>
                    <input
                      type="number"
                      value={form.delivery_costs['other'] ?? 0}
                      onChange={(e) => handleCostChange('other', e.target.value)}
                      min="0"
                      step="0.5"
                      className="input-field text-sm py-2"
                    />
                  </div>
                </div>
              </div>

              {error && <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-300 text-sm">{error}</div>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                  {saving ? t('common.loading') : t('staff.save')}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('staff.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offers List */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : offers.length === 0 ? (
        <div className="card p-12 text-center text-tobacco-500">{t('common.no_data')}</div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <div key={offer.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gold-700 transition-colors">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-tobacco-800 rounded font-mono text-gold-400 text-sm">{offer.code}</span>
                <div>
                  <p className="font-medium text-cream-100">{lang === 'ar' ? offer.name_ar : offer.name_en}</p>
                  <p className="text-xs text-tobacco-500">{lang === 'ar' ? offer.name_en : offer.name_ar}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={`/staff/offers/${offer.id}/products`}
                  className="btn-secondary text-sm py-1.5 px-3"
                >
                  {t('staff.manage_products')}
                </Link>
                <button onClick={() => openEdit(offer)} className="btn-secondary text-sm py-1.5 px-3">{t('common.edit')}</button>
                <button onClick={() => handleDelete(offer.id)} className="btn-danger text-sm py-1.5 px-3">{t('common.delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
