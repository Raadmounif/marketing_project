import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '../../contexts/LangContext'
import { offersApi, productsApi, sectionsApi } from '../../api'
import { getStorageBase } from '../../utils/storage'
import CalculatorField from '../../components/CalculatorField'
import type { Offer, OfferSection, Product } from '../../types'

export default function ManageProducts() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { offerId, sectionId } = useParams<{ offerId: string; sectionId: string }>()
  const [offer, setOffer] = useState<Offer | null>(null)
  const [section, setSection] = useState<OfferSection | null>(null)
  const [sections, setSections] = useState<OfferSection[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showBulk, setShowBulk] = useState(false)
  const [bulk, setBulk] = useState({ field: 'unit_total_price', percentage: 0 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name_ar: '',
    name_en: '',
    promo_code: '',
    promo_expiry: '',
    promo_discount_percent: 0,
    unit_total_price: 0,
    marketer_fee_per_unit: 0,
    photos: [] as File[],
    section_id: 0,
  })

  useEffect(() => {
    if (!offerId || !sectionId) return
    const oid = parseInt(offerId, 10)
    const sid = parseInt(sectionId, 10)
    setLoading(true)
    Promise.all([
      offersApi.getStaff(oid),
      sectionsApi.list(oid),
      productsApi.list(oid, sid),
    ])
      .then(([offerRes, sectionsRes, productsRes]) => {
        setOffer(offerRes.data)
        setSections(sectionsRes.data)
        const sec = sectionsRes.data.find((s: OfferSection) => s.id === sid) || null
        setSection(sec)
        setProducts(productsRes.data)
      })
      .finally(() => setLoading(false))
  }, [offerId, sectionId])

  const openCreate = () => {
    setEditingProduct(null)
    setForm({
      name_ar: '',
      name_en: '',
      promo_code: '',
      promo_expiry: '',
      promo_discount_percent: 0,
      unit_total_price: 0,
      marketer_fee_per_unit: section?.marketer_fee_per_unit ?? 0,
      photos: [],
      section_id: section?.id ?? parseInt(sectionId ?? '0', 10),
    })
    setShowForm(true)
    setError('')
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setForm({
      name_ar: product.name_ar,
      name_en: product.name_en,
      promo_code: product.promo_code || '',
      promo_expiry: product.promo_expiry ? String(product.promo_expiry).slice(0, 10) : '',
      promo_discount_percent: product.promo_discount_percent ?? 0,
      unit_total_price: product.unit_total_price,
      marketer_fee_per_unit: product.marketer_fee_per_unit,
      photos: [],
      section_id: product.section_id,
    })
    setShowForm(true)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offerId || !sectionId) return
    setSaving(true)
    setError('')
    const oid = parseInt(offerId, 10)
    const sid = parseInt(sectionId, 10)
    try {
      const fd = new FormData()
      fd.append('name_ar', form.name_ar)
      fd.append('name_en', form.name_en)
      fd.append('unit_total_price', String(form.unit_total_price))
      fd.append('marketer_fee_per_unit', String(form.marketer_fee_per_unit))
      fd.append('promo_code', form.promo_code.trim())
      fd.append('promo_expiry', form.promo_expiry || '')
      fd.append(
        'promo_discount_percent',
        form.promo_discount_percent ? String(form.promo_discount_percent) : ''
      )
      form.photos.forEach((f) => fd.append('photos[]', f))

      let res
      if (editingProduct) {
        fd.append('_method', 'PUT')
        if (form.section_id !== editingProduct.section_id) {
          fd.append('section_id', String(form.section_id))
        }
        res = await productsApi.update(editingProduct.id, fd)
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? res.data : p)))
        if (form.section_id !== sid) {
          setProducts((prev) => prev.filter((p) => p.id !== editingProduct.id))
        }
      } else {
        res = await productsApi.create(oid, sid, fd)
        setProducts((prev) => [res.data, ...prev])
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

  const handleToggle = async (product: Product) => {
    const res = await productsApi.toggle(product.id)
    setProducts((prev) => prev.map((p) => (p.id === product.id ? res.data : p)))
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('staff.confirm_delete'))) return
    await productsApi.delete(id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const handleBulkUpdate = async () => {
    if (!offerId || !sectionId) return
    setSaving(true)
    try {
      const res = await productsApi.bulkUpdateSection(
        parseInt(offerId, 10),
        parseInt(sectionId, 10),
        bulk
      )
      setProducts(res.data.products)
      setShowBulk(false)
    } catch {
      alert(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const storageBase = getStorageBase()

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <Link
            to={`/staff/offers/${offerId}/sections`}
            className="text-tobacco-400 hover:text-gold-400 text-sm mb-2 block"
          >
            ← {t('staff.manage_sections')}
          </Link>
          <h1 className="section-title text-2xl">
            {offer ? (lang === 'ar' ? offer.name_ar : offer.name_en) : '...'}
          </h1>
          {offer && <span className="text-sm font-mono text-gold-600">{offer.code}</span>}
          {section && (
            <p className="text-tobacco-400 text-sm mt-1">
              {lang === 'ar' ? section.name_ar : section.name_en}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => setShowBulk(true)} className="btn-secondary text-sm">
            {t('staff.bulk_update')}
          </button>
          <button type="button" onClick={openCreate} className="btn-primary">
            {t('staff.add_product')}
          </button>
        </div>
      </div>

      {showBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowBulk(false)} />
          <div className="relative bg-tobacco-900 rounded-xl border border-tobacco-700 p-6 w-full max-w-sm animate-slide-up">
            <h3 className="text-gold-400 font-bold text-lg mb-4">{t('staff.bulk_update')}</h3>
            <p className="text-xs text-tobacco-500 mb-3">{t('staff.bulk_section_hint')}</p>
            <div className="space-y-4">
              <div>
                <label className="label-text">{t('staff.bulk_field')}</label>
                <select
                  value={bulk.field}
                  onChange={(e) => setBulk((p) => ({ ...p, field: e.target.value }))}
                  className="input-field"
                >
                  <option value="unit_total_price">{t('staff.unit_total_price')}</option>
                  <option value="marketer_fee_per_unit">{t('staff.marketer_fee')}</option>
                </select>
              </div>
              <div>
                <label className="label-text">{t('staff.bulk_percentage')} (%)</label>
                <input
                  type="number"
                  value={bulk.percentage}
                  onChange={(e) =>
                    setBulk((p) => ({ ...p, percentage: parseFloat(e.target.value) || 0 }))
                  }
                  className="input-field"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={handleBulkUpdate} disabled={saving} className="btn-primary disabled:opacity-60">
                  {t('staff.apply_bulk')}
                </button>
                <button type="button" onClick={() => setShowBulk(false)} className="btn-secondary">
                  {t('staff.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowForm(false)} />
          <div className="relative bg-tobacco-900 rounded-2xl border border-tobacco-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-tobacco-700">
              <h2 className="text-lg font-bold text-gold-400">
                {editingProduct ? t('staff.edit_product') : t('staff.add_product')}
              </h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-tobacco-800 text-tobacco-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {editingProduct && sections.length > 1 && (
                <div>
                  <label className="label-text">{t('staff.product_section')}</label>
                  <select
                    value={form.section_id}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, section_id: parseInt(e.target.value, 10) }))
                    }
                    className="input-field"
                  >
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {lang === 'ar' ? s.name_ar : s.name_en}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-text">{t('staff.product_name_ar')}</label>
                  <input
                    value={form.name_ar}
                    onChange={(e) => setForm((p) => ({ ...p, name_ar: e.target.value }))}
                    required
                    className="input-field"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="label-text">{t('staff.product_name_en')}</label>
                  <input
                    value={form.name_en}
                    onChange={(e) => setForm((p) => ({ ...p, name_en: e.target.value }))}
                    required
                    className="input-field"
                    dir="ltr"
                  />
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
                {t('staff.price_per_unit')}:{' '}
                <span className="text-gold-400 font-bold">
                  {Math.max(0, form.unit_total_price - form.marketer_fee_per_unit).toFixed(2)}{' '}
                  {t('common.aed')}
                </span>
              </div>

              <div className="border-t border-tobacco-700 pt-4">
                <p className="text-sm font-medium text-tobacco-300 mb-3">
                  {t('staff.promo_code')} ({lang === 'ar' ? 'اختياري' : 'optional'})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="label-text text-xs">{t('staff.promo_code')}</label>
                    <input
                      value={form.promo_code}
                      onChange={(e) => setForm((p) => ({ ...p, promo_code: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text text-xs">{t('staff.promo_expiry')}</label>
                    <input
                      type="date"
                      value={form.promo_expiry}
                      onChange={(e) => setForm((p) => ({ ...p, promo_expiry: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text text-xs">{t('staff.promo_discount_percent')}</label>
                    <input
                      type="number"
                      value={form.promo_discount_percent || ''}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          promo_discount_percent: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="input-field"
                      min="0"
                      max="100"
                      step="0.5"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label-text">{t('staff.photos')}</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, photos: Array.from(e.target.files || []) }))
                  }
                  className="w-full text-sm text-tobacco-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-tobacco-700 file:text-cream-100 hover:file:bg-tobacco-600 cursor-pointer"
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
      ) : products.length === 0 ? (
        <div className="card p-12 text-center text-tobacco-500">{t('common.no_data')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className={`card p-4 flex flex-col gap-3 relative ${!product.is_active ? 'border-amber-800/60' : ''}`}
            >
              {!product.is_active && (
                <div className="absolute top-0 inset-x-0 bg-amber-800/80 text-amber-200 text-xs font-bold text-center py-1 rounded-t-xl">
                  {lang === 'ar' ? '⛔ مؤقتاً غير متوفر' : '⛔ Out of Stock'}
                </div>
              )}

              {product.photos?.[0] && (
                <img
                  src={`${storageBase}/${product.photos[0]}`}
                  alt=""
                  className={`w-full h-36 object-cover rounded-lg ${!product.is_active ? 'mt-5 opacity-60' : ''}`}
                />
              )}
              {!product.photos?.[0] && !product.is_active && <div className="mt-5" />}

              <div>
                <p className={`font-bold ${product.is_active ? 'text-cream-100' : 'text-tobacco-400'}`}>
                  {lang === 'ar' ? product.name_ar : product.name_en}
                </p>
                <p className="text-xs text-tobacco-500">
                  {lang === 'ar' ? product.name_en : product.name_ar}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-tobacco-500">{t('staff.unit_total_price')}</p>
                  <p className="text-cream-200 font-medium">
                    {product.unit_total_price.toFixed(2)} {t('common.aed')}
                  </p>
                </div>
                <div>
                  <p className="text-tobacco-500">{t('staff.price_per_unit')}</p>
                  <p className="text-gold-400 font-bold">
                    {product.price_per_unit.toFixed(2)} {t('common.aed')}
                  </p>
                </div>
                <div>
                  <p className="text-tobacco-500">{t('staff.marketer_fee')}</p>
                  <p className="text-cream-200 font-medium">
                    {product.marketer_fee_per_unit.toFixed(2)} {t('common.aed')}
                  </p>
                </div>
                {product.promo_code && (
                  <div>
                    <p className="text-tobacco-500">{t('staff.promo_code')}</p>
                    <p className="text-forest-600 font-mono">
                      {product.promo_code}
                      {product.promo_discount_percent != null && product.promo_discount_percent > 0 && (
                        <span className="text-tobacco-400 ms-1">
                          ({product.promo_discount_percent}%)
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleToggle(product)}
                  className={`text-xs py-1.5 px-3 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                    product.is_active
                      ? 'bg-tobacco-700 hover:bg-tobacco-600 text-tobacco-300'
                      : 'bg-forest-600 hover:bg-forest-500 text-white ring-2 ring-forest-500/50'
                  }`}
                >
                  {product.is_active ? (
                    <>{t('staff.disable')}</>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {lang === 'ar' ? 'تفعيل المنتج' : 'Activate'}
                    </>
                  )}
                </button>
                <button type="button" onClick={() => openEdit(product)} className="btn-secondary text-xs py-1.5 px-3">
                  {t('common.edit')}
                </button>
                <button type="button" onClick={() => handleDelete(product.id)} className="btn-danger text-xs py-1.5 px-3">
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
