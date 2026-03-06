import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '../../contexts/LangContext'
import { boardApi } from '../../api'
import type { AdvertisingBoard } from '../../types'

export default function BoardEditor() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const [items, setItems] = useState<AdvertisingBoard[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<AdvertisingBoard | null>(null)
  const [form, setForm] = useState({ content_ar: '', content_en: '', sort_order: 0, image: null as File | null })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || ''

  useEffect(() => {
    boardApi.list().then((res) => setItems(res.data)).finally(() => setLoading(false))
  }, [])

  const openCreate = () => {
    setEditingItem(null)
    setForm({ content_ar: '', content_en: '', sort_order: 0, image: null })
    setShowForm(true)
    setError('')
  }

  const openEdit = (item: AdvertisingBoard) => {
    setEditingItem(item)
    setForm({ content_ar: item.content_ar, content_en: item.content_en, sort_order: item.sort_order, image: null })
    setShowForm(true)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('content_ar', form.content_ar)
      fd.append('content_en', form.content_en)
      fd.append('sort_order', String(form.sort_order))
      if (form.image) fd.append('image', form.image)

      let res
      if (editingItem) {
        res = await boardApi.update(editingItem.id, fd)
        setItems((prev) => prev.map((i) => i.id === editingItem.id ? res.data : i))
      } else {
        res = await boardApi.create(fd)
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
    await boardApi.delete(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/staff" className="text-tobacco-400 hover:text-gold-400 text-sm mb-2 block">← {t('staff.dashboard')}</Link>
          <h1 className="section-title text-2xl">{t('staff.board_editor')}</h1>
        </div>
        <button onClick={openCreate} className="btn-primary">{t('staff.add_board_item')}</button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowForm(false)} />
          <div className="relative bg-tobacco-900 rounded-2xl border border-tobacco-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-tobacco-700">
              <h2 className="text-lg font-bold text-gold-400">{editingItem ? t('common.edit') : t('staff.add_board_item')}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-tobacco-800 text-tobacco-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label-text">{t('staff.content_ar')}</label>
                <textarea value={form.content_ar} onChange={(e) => setForm((p) => ({ ...p, content_ar: e.target.value }))} required rows={3} className="input-field resize-none" dir="rtl" />
              </div>
              <div>
                <label className="label-text">{t('staff.content_en')}</label>
                <textarea value={form.content_en} onChange={(e) => setForm((p) => ({ ...p, content_en: e.target.value }))} required rows={3} className="input-field resize-none" dir="ltr" />
              </div>
              <div>
                <label className="label-text">{t('staff.sort_order')}</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className="input-field" />
              </div>
              <div>
                <label className="label-text">{t('staff.image')}</label>
                <input type="file" accept="image/*" onChange={(e) => setForm((p) => ({ ...p, image: e.target.files?.[0] || null }))}
                  className="w-full text-sm text-tobacco-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-tobacco-700 file:text-cream-100 hover:file:bg-tobacco-600 cursor-pointer"
                />
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
          {items.sort((a, b) => a.sort_order - b.sort_order).map((item) => (
            <div key={item.id} className="card p-4 flex gap-4">
              {item.image_path && (
                <img src={`${apiBase}/storage/${item.image_path}`} alt="" className="w-20 h-16 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-cream-100 font-medium truncate">{lang === 'ar' ? item.content_ar : item.content_en}</p>
                <p className="text-tobacco-500 text-sm truncate mt-0.5">{lang === 'ar' ? item.content_en : item.content_ar}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0 items-start">
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
