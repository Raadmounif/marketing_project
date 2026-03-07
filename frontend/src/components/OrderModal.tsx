import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '../contexts/LangContext'
import { useAuth } from '../contexts/AuthContext'
import { ordersApi } from '../api'
import type { Product } from '../types'

interface Props {
  product: Product | null
  onClose: () => void
  onSuccess: (orderNumber: string) => void
}

export default function OrderModal({ product, onClose, onSuccess }: Props) {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { user } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (product) {
      setQuantity(1)
      setNotes('')
      setPromoCode('')
      setError('')
    }
  }, [product])

  if (!product || !user) return null

  const isPromoValid =
    promoCode &&
    product.promo_code === promoCode &&
    product.promo_expiry &&
    new Date(product.promo_expiry) > new Date()

  const promoDiscount = isPromoValid ? (product.promo_discount || 0) : 0

  // Delivery fee = qty_fee + state_extra (for 5+ units: qty_fee=0, state_extra still applies)
  const schedule = product.offer?.marketer_fee_schedule
  const stateExtra = Number(schedule?.state_extras?.[user.state ?? ''] ?? 0)
  const qtyFee =
    quantity >= 5 ? 0 : Number(schedule?.qty_fees?.[String(quantity)] ?? 0)
  const deliveryCost = qtyFee + stateExtra

  const total = Math.max(0, quantity * product.unit_total_price + deliveryCost - promoDiscount)
  const deliveryDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleDateString(
    lang === 'ar' ? 'ar-AE' : 'en-AE'
  )
  const productName = lang === 'ar' ? product.name_ar : product.name_en

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user.state || !user.address) {
      setError(t('order.complete_profile'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await ordersApi.create({
        product_id: product.id,
        quantity,
        notes: notes || undefined,
      })
      onSuccess(res.data.order_number)
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-tobacco-900 rounded-2xl border border-tobacco-700 shadow-2xl w-full max-w-md animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-tobacco-700">
          <h2 className="text-lg font-bold text-gold-400">{t('order.title')}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-tobacco-800 text-tobacco-400 hover:text-cream-200 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Product name (read-only) */}
          <div>
            <label className="label-text">{t('order.product_name')}</label>
            <div className="input-field bg-tobacco-800 cursor-default select-none">{productName}</div>
          </div>

          {/* Quantity */}
          <div>
            <label className="label-text">{t('order.quantity')}</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              className="input-field"
            />
          </div>

          {/* Promo code */}
          {product.promo_code && (
            <div>
              <label className="label-text">{t('order.promo_code')}</label>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="input-field"
                placeholder={t('order.promo_code')}
              />
              {promoCode && !isPromoValid && (
                <p className="text-red-400 text-xs mt-1">{t('order.promo_invalid')}</p>
              )}
              {isPromoValid && (
                <p className="text-forest-600 text-xs mt-1">-{promoDiscount} {t('common.aed')}</p>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label-text">{t('order.notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input-field resize-none"
              placeholder={t('order.notes_placeholder')}
            />
          </div>

          {/* Delivery date (read-only) */}
          <div>
            <label className="label-text">{t('order.delivery_date')}</label>
            <div className="input-field bg-tobacco-800 cursor-default text-tobacco-400">
              {deliveryDate} — {t('order.delivery_hint')}
            </div>
          </div>

          {/* Total breakdown */}
          <div className="bg-tobacco-800 rounded-xl p-4 space-y-2 border border-tobacco-600">
            <div className="flex justify-between text-sm text-tobacco-400">
              <span>{quantity} × {product.unit_total_price.toFixed(2)} {t('common.aed')}</span>
              <span>{(quantity * product.unit_total_price).toFixed(2)} {t('common.aed')}</span>
            </div>
            {deliveryCost > 0 && (
              <div className="flex justify-between text-sm text-tobacco-400">
                <span>{t('product.delivery_cost')}</span>
                <span>+{deliveryCost.toFixed(2)} {t('common.aed')}</span>
              </div>
            )}
            {promoDiscount > 0 && (
              <div className="flex justify-between text-sm text-forest-600">
                <span>{t('order.promo_code')}</span>
                <span>-{promoDiscount.toFixed(2)} {t('common.aed')}</span>
              </div>
            )}
            <div className="border-t border-tobacco-600 pt-2 flex justify-between font-bold">
              <span className="text-cream-100">{t('order.total')}</span>
              <span className="text-gold-400 text-lg">{total.toFixed(2)} {t('common.aed')}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-60"
          >
            {loading ? t('common.loading') : t('order.place_order')}
          </button>
        </form>
      </div>
    </div>
  )
}
