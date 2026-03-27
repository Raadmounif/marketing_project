import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '../../contexts/LangContext'
import { offersApi, sectionsApi } from '../../api'
import type { Offer, OfferSection } from '../../types'

export default function ManageSections() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { offerId } = useParams<{ offerId: string }>()
  const [offer, setOffer] = useState<Offer | null>(null)
  const [sections, setSections] = useState<OfferSection[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<OfferSection | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name_ar: '',
    name_en: '',
    sort_order: 0,
    marketer_fee_per_unit: '' as number | '',
  })

  useEffect(() => {
    if (!offerId) return
    setLoading(true)
    const id = parseInt(offerId, 10)
    Promise.all([offersApi.get(id), sectionsApi.list(id)])
      .then(([offerRes, secRes]) => {
        setOffer(offerRes.data)
        setSections(secRes.data)
      })
      .finally(() => setLoading(false))
  }, [offerId])

  const openCreate = () => {
    setEditing(null)
    setForm({ name_ar: '', name_en: '', sort_order: sections.length, marketer_fee_per_unit: '' })
    setShowForm(true)
    setError('')
  }

  const openEdit = (section: OfferSection) => {
    setEditing(section)
    setForm({
      name_ar: section.name_ar,
      name_en: section.name_en,
      sort_order: section.sort_order,
      marketer_fee_per_unit: section.marketer_fee_per_unit ?? '',
    })
    setShowForm(true)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offerId) return
    setSaving(true)
    setError('')
    const id = parseInt(offerId, 10)
    const payload = {
      name_ar: form.name_ar,
      name_en: form.name_en,
      sort_order: form.sort_order,
      marketer_fee_per_unit:
        form.marketer_fee_per_unit === '' ? null : Number(form.marketer_fee_per_unit),
    }
    try {
      if (editing) {
        const res = await sectionsApi.update(id, editing.id, payload)
        setSections((prev) => prev.map((s) => (s.id === editing.id ? res.data : s)))
      } else {
        const res = await sectionsApi.create(id, payload)
        setSections((prev) => [...prev, res.data].sort((a, b) => a.sort_order - b.sort_order))
      }
      setShowForm(false)
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      setError(msg || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (section: OfferSection) => {
    if (!offerId) return
    if (!confirm(t('staff.confirm_delete'))) return
    try {
      await sectionsApi.delete(parseInt(offerId, 10), section.id)
      setSections((prev) => prev.filter((s) => s.id !== section.id))
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      alert(msg || t('common.error'))
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <Link to="/staff/offers" className="text-tobacco-400 hover:text-gold-400 text-sm mb-2 block">
            ← {t('staff.manage_offers')}
          </Link>
          <h1 className="section-title text-2xl">
            {offer ? (lang === 'ar' ? offer.name_ar : offer.name_en) : '...'}
          </h1>
          {offer && <span className="text-sm font-mono text-gold-600">{offer.code}</span>}
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          {t('staff.add_section')}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowForm(false)} />
          <div className="relative bg-tobacco-900 rounded-2xl border border-tobacco-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up p-6">
            <h2 className="text-lg font-bold text-gold-400 mb-4">
              {editing ? t('staff.edit_section') : t('staff.add_section')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text">{t('staff.section_name_ar')}</label>
                <input
                  value={form.name_ar}
                  onChange={(e) => setForm((p) => ({ ...p, name_ar: e.target.value }))}
                  required
                  className="input-field"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="label-text">{t('staff.section_name_en')}</label>
                <input
                  value={form.name_en}
                  onChange={(e) => setForm((p) => ({ ...p, name_en: e.target.value }))}
                  required
                  className="input-field"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="label-text">{t('staff.sort_order')}</label>
                <input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, sort_order: parseInt(e.target.value, 10) || 0 }))
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text">{t('staff.section_marketer_fee')}</label>
                <p className="text-xs text-tobacco-500 mb-1">{t('staff.section_marketer_fee_hint')}</p>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.marketer_fee_per_unit === '' ? '' : form.marketer_fee_per_unit}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      marketer_fee_per_unit: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="input-field"
                  placeholder={lang === 'ar' ? 'اختياري' : 'Optional'}
                />
              </div>
              {error && (
                <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                  {saving ? t('common.loading') : t('staff.save')}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  {t('staff.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sections.length === 0 ? (
        <div className="card p-12 text-center text-tobacco-500">{t('common.no_data')}</div>
      ) : (
        <div className="space-y-3">
          {sections.map((section) => (
            <div
              key={section.id}
              className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gold-700 transition-colors"
            >
              <div>
                <p className="font-medium text-cream-100">
                  {lang === 'ar' ? section.name_ar : section.name_en}
                </p>
                <p className="text-xs text-tobacco-500">
                  {lang === 'ar' ? section.name_en : section.name_ar}
                </p>
                <p className="text-xs text-tobacco-400 mt-1">
                  {t('staff.sort_order')}: {section.sort_order}
                  {section.marketer_fee_per_unit != null && (
                    <>
                      {' · '}
                      {t('staff.marketer_fee')}: {section.marketer_fee_per_unit.toFixed(2)}{' '}
                      {t('common.aed')}
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={`/staff/offers/${offerId}/sections/${section.id}/products`}
                  className="btn-secondary text-sm py-1.5 px-3"
                >
                  {t('staff.manage_products')}
                </Link>
                <button
                  type="button"
                  onClick={() => openEdit(section)}
                  className="btn-secondary text-sm py-1.5 px-3"
                >
                  {t('common.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(section)}
                  className="btn-danger text-sm py-1.5 px-3"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
