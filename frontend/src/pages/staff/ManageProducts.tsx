import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '../../contexts/LangContext'
import { offersApi, productsApi } from '../../api'
import CalculatorField from '../../components/CalculatorField'
import type { Offer, Product } from '../../types'

export default function ManageProducts() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { offerId } = useParams<{ offerId: string }>()
  const [offer, setOffer] = useState<Offer | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showBulk, setShowBulk] = useState(false)
  const [bulk, setBulk] = useState({ field: 'unit_total_price', percentage: 0 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const emptyForm = {
    name_ar: '', name_en: '', promo_code: '', promo_expiry: '',
    promo_discount: 0, unit_total_price: 0, marketer_fee_per_unit: 0, photos: [] as File[],
  }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!offerId) return
    const id = parseInt(offerId)
    Promise.all([
      offersApi.get(id),
      productsApi.list(id),
    ]).then(([offerRes, productsRes]) => {
      setOffer(offerRes.data)
      setProducts(productsRes.data)
    }).finally(() => setLoading(false))
  }, [offerId])

  const openCreate = () => {
    setEditingProduct(null)
    setForm(emptyForm)
    setShowForm(true)
    setError('')
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setForm({
      name_ar: product.name_ar, name_en: product.name_en,
      promo_code: product.promo_code || '', promo_expiry: product.promo_expiry || '',
      promo_discount: product.promo_discount || 0,
      unit_total_price: product.unit_total_price,
      marketer_fee_per_unit: product.marketer_fee_per_unit,
      photos: [],
    })
    setShowForm(true)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('name_ar', form.name_ar)
      fd.append('name_en', form.name_en)
      fd.append('unit_total_price', String(form.unit_total_price))
      fd.append('marketer_fee_per_unit', String(form.marketer_fee_per_unit))
      if (form.promo_code) fd.append('promo_code', form.promo_code)
      if (form.promo_expiry) fd.append('promo_expiry', form.promo_expiry)
      if (form.promo_discount) fd.append('promo_discount', String(form.promo_discount))
      form.photos.forEach((f) => fd.append('photos[]', f))

      let res
      if (editingProduct) {
        fd.append('_method', 'PUT')
        res = await productsApi.update(editingProduct.id, fd)
        setProducts((prev) => prev.map((p) => p.id === editingProduct.id ? res.data : p))
      } else {
        res = await productsApi.create(parseInt(offerId!), fd)
        setProducts((prev) => [res.data, ...prev])
      }
      setShowForm(false)
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (product: Product) => {
    const res = await productsApi.toggle(product.id)
    setProducts((prev) => prev.map((p) => p.id === product.id ? res.data : p))
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('staff.confirm_delete'))) return
    await productsApi.delete(id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const handleBulkUpdate = async () => {
    if (!offerId) return
    setSaving(true)
    try {
      const res = await productsApi.bulkUpdate(parseInt(offerId), bulk)
      setProducts(res.data.products)
      setShowBulk(false)
    } catch {
      alert(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const storageBase = import.meta.env.VITE_STORAGE_URL || import.meta.env.VITE_API_URL?.replace('/api', '/storage') || ''

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <Link to="/staff/offers" className="text-tobacco-400 hover:text-gold-400 text-sm mb-2 block">← {t('staff.manage_offers')}</Link>
          <h1 className="section-title text-2xl">
            {offer ? (lang === 'ar' ? offer.name_ar : offer.name_en) : '...'}
          </h1>
          {offer && <span className="text-sm font-mono text-gold-600">{offer.code}</span>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowBulk(true)} className="btn-secondary text-sm">{t('staff.bulk_update')}</button>
          <button onClick={openCreate} className="btn-primary">{t('staff.add_product')}</button>
        </div>
      </div>

      {/* Bulk Update Modal */}
      {showBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowBulk(false)} />
          <div className="relative bg-tobacco-900 rounded-xl border border-tobacco-700 p-6 w-full max-w-sm animate-slide-up">
            <h3 className="text-gold-400 font-bold text-lg mb-4">{t('staff.bulk_update')}</h3>
            <div className="space-y-4">
              <div>
                <label className="label-text">{t('staff.bulk_field')}</label>
                <select value={bulk.field} onChange={(e) => setBulk((p) => ({ ...p, field: e.target.value }))} className="input-field">
                  <option value="unit_total_price">{t('staff.unit_total_price')}</option>
                  <option value="marketer_fee_per_unit">{t('staff.marketer_fee')}</option>
                </select>
              </div>
              <div>
                <label className="label-text">{t('staff.bulk_percentage')} (%)</label>
                <input type="number" value={bulk.percentage} onChange={(e) => setBulk((p) => ({ ...p, percentage: parseFloat(e.target.value) || 0 }))} className="input-field" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleBulkUpdate} disabled={saving} className="btn-primary disabled:opacity-60">{t('staff.apply_bulk')}</button>
                <button onClick={() => setShowBulk(false)} className="btn-secondary">{t('staff.cancel')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowForm(false)} />
          <div className="relative bg-tobacco-900 rounded-2xl border border-tobacco-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-tobacco-700">
              <h2 className="text-lg font-bold text-gold-400">{editingProduct ? t('staff.edit_product') : t('staff.add_product')}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-tobacco-800 text-tobacco-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-text">{t('staff.product_name_ar')}</label>
                  <input value={form.name_ar} onChange={(e) => setForm((p) => ({ ...p, name_ar: e.target.value }))} required className="input-field" dir="rtl" />
                </div>
                <div>
                  <label className="label-text">{t('staff.product_name_en')}</label>
                  <input value={form.name_en} onChange={(e) => setForm((p) => ({ ...p, name_en: e.target.value }))} required className="input-field" dir="ltr" />
                </div>
              </div>

              <CalculatorField
                label={t('staff.unit_total_price')}
                value={form.unit_total_price}
                onChange={(v) => setForm((p) => ({ ...p, unit_total_price: v }))}
              />

              <CalculatorField
                label={t('staff.marketer_fee')}
                value={form.marketer_fee_per_unit}
                onChange={(v) => setForm((p) => ({ ...p, marketer_fee_per_unit: v }))}
              />

              <div className="p-3 bg-tobacco-800 rounded-lg border border-tobacco-600 text-sm text-tobacco-400">
                {t('staff.price_per_unit')}: <span className="text-gold-400 font-bold">
                  {Math.max(0, form.unit_total_price - form.marketer_fee_per_unit).toFixed(2)} {t('common.aed')}
                </span>
              </div>

              <div className="border-t border-tobacco-700 pt-4">
                <p className="text-sm font-medium text-tobacco-300 mb-3">{t('staff.promo_code')} ({lang === 'ar' ? 'اختياري' : 'optional'})</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="label-text text-xs">{t('staff.promo_code')}</label>
                    <input value={form.promo_code} onChange={(e) => setForm((p) => ({ ...p, promo_code: e.target.value }))} className="input-field" />
                  </div>
                  <div>
                    <label className="label-text text-xs">{t('staff.promo_expiry')}</label>
                    <input type="date" value={form.promo_expiry} onChange={(e) => setForm((p) => ({ ...p, promo_expiry: e.target.value }))} className="input-field" />
                  </div>
                  <div>
                    <label className="label-text text-xs">{t('staff.promo_discount')}</label>
                    <input type="number" value={form.promo_discount || ''} onChange={(e) => setForm((p) => ({ ...p, promo_discount: parseFloat(e.target.value) || 0 }))} className="input-field" min="0" step="0.5" />
                  </div>
                </div>
              </div>

              <div>
                <label className="label-text">{t('staff.photos')}</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setForm((p) => ({ ...p, photos: Array.from(e.target.files || []) }))}
                  className="w-full text-sm text-tobacco-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-tobacco-700 file:text-cream-100 hover:file:bg-tobacco-600 cursor-pointer"
                />
              </div>

              {error && <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-300 text-sm">{error}</div>}

              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                  {saving ? t('common.loading') : t('staff.save')}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('staff.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center text-tobacco-500">{t('common.no_data')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className={`card p-4 flex flex-col gap-3 ${!product.is_active ? 'opacity-60' : ''}`}>
              {product.photos?.[0] && (
                <img src={`${storageBase}/${product.photos[0]}`} alt="" className="w-full h-36 object-cover rounded-lg" />
              )}
              <div>
                <p className="font-bold text-cream-100">{lang === 'ar' ? product.name_ar : product.name_en}</p>
                <p className="text-xs text-tobacco-500">{lang === 'ar' ? product.name_en : product.name_ar}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-tobacco-500">{t('staff.unit_total_price')}</p>
                  <p className="text-cream-200 font-medium">{product.unit_total_price.toFixed(2)} {t('common.aed')}</p>
                </div>
                <div>
                  <p className="text-tobacco-500">{t('staff.price_per_unit')}</p>
                  <p className="text-gold-400 font-bold">{product.price_per_unit.toFixed(2)} {t('common.aed')}</p>
                </div>
                <div>
                  <p className="text-tobacco-500">{t('staff.marketer_fee')}</p>
                  <p className="text-cream-200 font-medium">{product.marketer_fee_per_unit.toFixed(2)} {t('common.aed')}</p>
                </div>
                {product.promo_code && (
                  <div>
                    <p className="text-tobacco-500">{t('staff.promo_code')}</p>
                    <p className="text-forest-600 font-mono">{product.promo_code}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleToggle(product)}
                  className={`text-xs py-1.5 px-3 rounded-lg font-medium transition-colors ${product.is_active ? 'bg-forest-700 hover:bg-forest-600 text-white' : 'bg-tobacco-700 hover:bg-tobacco-600 text-cream-200'}`}
                >
                  {product.is_active ? t('staff.disable') : t('staff.enable')}
                </button>
                <button onClick={() => openEdit(product)} className="btn-secondary text-xs py-1.5 px-3">{t('common.edit')}</button>
                <button onClick={() => handleDelete(product.id)} className="btn-danger text-xs py-1.5 px-3">{t('common.delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
