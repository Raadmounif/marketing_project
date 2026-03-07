import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '../contexts/LangContext'
import { ordersApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import type { Order } from '../types'

export default function Orders() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const [feedbackText, setFeedbackText] = useState<Record<number, string>>({})
  const [submittingFeedback, setSubmittingFeedback] = useState<number | null>(null)
  const [feedbackDone, setFeedbackDone] = useState<Record<number, boolean>>({})
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || ''
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    ordersApi.myOrders().then((res) => setOrders(res.data)).finally(() => setLoading(false))
  }, [])

  const handleUploadReceipt = async (orderId: number, file: File) => {
    setUploadingId(orderId)
    try {
      const formData = new FormData()
      formData.append('receipt', file)
      const res = await ordersApi.uploadReceipt(orderId, formData)
      setOrders((prev) => prev.map((o) => o.id === orderId ? res.data : o))
    } catch {
      alert(t('common.error'))
    } finally {
      setUploadingId(null)
    }
  }

  const handleFeedback = async (orderId: number) => {
    const text = feedbackText[orderId]?.trim()
    if (!text) return
    setSubmittingFeedback(orderId)
    try {
      const res = await ordersApi.submitFeedback(orderId, text)
      setOrders((prev) => prev.map((o) => o.id === orderId ? res.data : o))
      setFeedbackDone((prev) => ({ ...prev, [orderId]: true }))
    } catch {
      alert(t('common.error'))
    } finally {
      setSubmittingFeedback(null)
    }
  }

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm(t('tracking.confirm_delete_order'))) return
    setDeletingId(orderId)
    try {
      await ordersApi.deleteOrder(orderId)
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
    } catch {
      alert(t('common.error'))
    } finally {
      setDeletingId(null)
    }
  }

  const statusBadge = (status: string) => {
    if (status === 'pending') return <span className="badge-status-pending">{t('tracking.status_pending')}</span>
    if (status === 'ordered') return <span className="badge-status-ordered">{t('tracking.status_ordered')}</span>
    return <span className="badge-status-delivered">{t('tracking.status_delivered')}</span>
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-fade-in">
      <h1 className="section-title text-3xl mb-8">{t('tracking.title')}</h1>

      {orders.length === 0 ? (
        <div className="card p-12 text-center text-tobacco-500">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>{t('tracking.no_orders')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-5 hover:border-gold-700 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gold-400 font-black text-lg">#{order.order_number}</span>
                    {statusBadge(order.status)}
                  </div>
                  <p className="text-cream-100 font-medium mt-1">
                    {lang === 'ar' ? order.product?.name_ar : order.product?.name_en}
                  </p>
                </div>
                <div className="text-end">
                  <div className="text-xl font-black text-gold-400">{order.total.toFixed(2)} {t('common.aed')}</div>
                  <div className="text-xs text-tobacco-500">{t('tracking.total')}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-4">
                <div>
                  <p className="text-tobacco-400 text-xs">{t('tracking.ordered_at')}</p>
                  <p className="text-cream-200">{new Date(order.created_at).toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-AE')}</p>
                </div>
                <div>
                  <p className="text-tobacco-400 text-xs">{t('tracking.delivery_date')}</p>
                  <p className="text-cream-200">{new Date(order.delivery_date).toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-AE')}</p>
                </div>
                <div>
                  <p className="text-tobacco-400 text-xs">{t('order.quantity')}</p>
                  <p className="text-cream-200">× {order.quantity}</p>
                </div>
              </div>

              {order.notes && (
                <div className="bg-tobacco-800 rounded-lg p-3 mb-4 text-sm text-tobacco-300 border-s-2 border-gold-600">
                  {order.notes}
                </div>
              )}

              {/* Receipt upload (ordered status) */}
              {order.status === 'ordered' && (
                <div className="border-t border-tobacco-700 pt-4">
                  <p className="text-sm text-tobacco-400 mb-2">{t('tracking.upload_hint')}</p>
                  <input
                    ref={(el) => { fileInputRefs.current[order.id] = el }}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUploadReceipt(order.id, file)
                    }}
                  />
                  <button
                    onClick={() => fileInputRefs.current[order.id]?.click()}
                    disabled={uploadingId === order.id}
                    className="btn-primary text-sm disabled:opacity-60"
                  >
                    {uploadingId === order.id ? t('common.loading') : t('tracking.upload_receipt')}
                  </button>
                </div>
              )}

              {/* Delivered: show receipt link + feedback form */}
              {order.status === 'delivered' && (
                <div className="border-t border-tobacco-700 pt-4 space-y-4">
                  <div className="flex items-center gap-2 text-forest-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">{t('tracking.receipt_uploaded')}</span>
                    {order.receipt_path && (
                      <a
                        href={`${apiBase}/storage/${order.receipt_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gold-400 text-sm hover:underline ms-2"
                      >
                        {lang === 'ar' ? 'عرض الإيصال' : 'View Receipt'}
                      </a>
                    )}
                  </div>

                  {/* Feedback section */}
                  {order.feedback ? (
                    <div className="bg-tobacco-800 rounded-lg p-3 border-s-2 border-forest-600">
                      <p className="text-xs text-tobacco-400 mb-1">{t('tracking.feedback')}</p>
                      <p className="text-sm text-cream-200">{order.feedback}</p>
                    </div>
                  ) : feedbackDone[order.id] ? (
                    <p className="text-sm text-forest-600">{t('tracking.feedback_submitted')}</p>
                  ) : (
                    <div className="space-y-2">
                      <label className="label-text text-xs">{t('tracking.feedback')}</label>
                      <textarea
                        value={feedbackText[order.id] || ''}
                        onChange={(e) => setFeedbackText((prev) => ({ ...prev, [order.id]: e.target.value }))}
                        rows={2}
                        className="input-field resize-none text-sm"
                        placeholder={t('tracking.feedback_placeholder')}
                      />
                      <button
                        onClick={() => handleFeedback(order.id)}
                        disabled={submittingFeedback === order.id || !feedbackText[order.id]?.trim()}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        {submittingFeedback === order.id ? t('common.loading') : t('tracking.feedback_submit')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Admin: delete order button */}
              {isAdmin && (
                <div className="border-t border-tobacco-700 pt-3 mt-3 flex justify-end">
                  <button
                    onClick={() => handleDeleteOrder(order.id)}
                    disabled={deletingId === order.id}
                    className="text-xs px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === order.id ? t('common.loading') : t('tracking.delete_order')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
