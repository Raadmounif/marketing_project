import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '../../contexts/LangContext'
import { hiwApi } from '../../api'
import type { HowItWorksItem } from '../../types'

export default function HowItWorksEditor() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const [items, setItems] = useState<HowItWorksItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<HowItWorksItem | null>(null)
  const [form, setForm] = useState({ title_ar: '', title_en: '', body_ar: '', body_en: '', sort_order: 0 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    hiwApi.list().then((res) => setItems(res.data)).finally(() => setLoading(false))
  }, [])

  const openCreate = () => {
    setEditingItem(null)
    setForm({ title_ar: '', title_en: '', body_ar: '', body_en: '', sort_order: items.length })
    setShowForm(true)
    setError('')
  }

  const openEdit = (item: HowItWorksItem) => {
    setEditingItem(item)
    setForm({ title_ar: item.title_ar, title_en: item.title_en, body_ar: item.body_ar, body_en: item.body_en, sort_order: item.sort_order })
    setShowForm(true)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingItem) {
        const res = await hiwApi.update(editingItem.id, form)
        setItems((prev) => prev.map((i) => i.id === editingItem.id ? res.data : i))
      } else {
        const res = await hiwApi.create(form)
        setItems((prev) => [...prev, res.data])
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
    await hiwApi.delete(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/staff" className="text-tobacco-400 hover:text-gold-400 text-sm mb-2 block">← {t('staff.dashboard')}</Link>
          <h1 className="section-title text-2xl">{t('staff.hiw_editor')}</h1>
        </div>
        <button onClick={openCreate} className="btn-primary">{t('staff.add_hiw_item')}</button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowForm(false)} />
          <div className="relative bg-tobacco-900 rounded-2xl border border-tobacco-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-tobacco-700">
              <h2 className="text-lg font-bold text-gold-400">{editingItem ? t('common.edit') : t('staff.add_hiw_item')}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-tobacco-800 text-tobacco-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-text">{t('staff.title_ar')}</label>
                  <input value={form.title_ar} onChange={(e) => setForm((p) => ({ ...p, title_ar: e.target.value }))} required className="input-field" dir="rtl" />
                </div>
                <div>
                  <label className="label-text">{t('staff.title_en')}</label>
                  <input value={form.title_en} onChange={(e) => setForm((p) => ({ ...p, title_en: e.target.value }))} required className="input-field" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="label-text">{t('staff.body_ar')}</label>
                <textarea value={form.body_ar} onChange={(e) => setForm((p) => ({ ...p, body_ar: e.target.value }))} required rows={3} className="input-field resize-none" dir="rtl" />
              </div>
              <div>
                <label className="label-text">{t('staff.body_en')}</label>
                <textarea value={form.body_en} onChange={(e) => setForm((p) => ({ ...p, body_en: e.target.value }))} required rows={3} className="input-field resize-none" dir="ltr" />
              </div>
              <div>
                <label className="label-text">{t('staff.sort_order')}</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className="input-field" />
              </div>
              {error && <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-300 text-sm">{error}</div>}
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? t('common.loading') : t('staff.save')}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('staff.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center text-tobacco-500">{t('common.no_data')}</div>
      ) : (
        <div className="space-y-3">
          {items.sort((a, b) => a.sort_order - b.sort_order).map((item, index) => (
            <div key={item.id} className="card p-4 flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-gold-500 text-tobacco-950 font-black flex items-center justify-center flex-shrink-0 text-sm">{index + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-cream-100">{lang === 'ar' ? item.title_ar : item.title_en}</p>
                <p className="text-tobacco-400 text-sm mt-1 leading-relaxed">{lang === 'ar' ? item.body_ar : item.body_en}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(item)} className="btn-secondary text-xs py-1.5 px-3">{t('common.edit')}</button>
                <button onClick={() => handleDelete(item.id)} className="btn-danger text-xs py-1.5 px-3">{t('common.delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
