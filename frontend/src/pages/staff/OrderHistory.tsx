import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '../../contexts/LangContext'
import { useAuth } from '../../contexts/AuthContext'
import { ordersApi } from '../../api'
import { getStorageBase } from '../../utils/storage'
import type { Order } from '../../types'

const storageBase = getStorageBase()

// Date as YYYY-MM-DD HH:mm (matches email format)
const dateFmtForCopy = (date: string) => {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

// Is this the user's first order (by created_at)?
function isFirstOrderForUser(order: Order, allOrders: Order[]): boolean {
  const userOrders = allOrders
    .filter((o) => o.user_id === order.user_id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  return userOrders[0]?.id === order.id
}

function buildOrderText(order: Order, allOrders: Order[], lang: string): string {
  const customerStatus = isFirstOrderForUser(order, allOrders)
    ? (lang === 'ar' ? 'جديد' : 'New')
    : (lang === 'ar' ? 'قديم' : 'Returning')
  const dateStr = dateFmtForCopy(order.created_at)
  if (lang === 'ar') {
    const lines = [
      `رقم الطلب: ${order.order_number}`,
      `الرمز: ${order.product?.offer?.code ?? '—'}`,
      `التاريخ: ${dateStr}`,
      '',
      '--- معلومات الزبون ---',
      `الاسم: ${order.user?.name ?? '—'}`,
      `الهاتف: ${order.user?.phone ?? '—'}`,
      `الإمارة: ${order.user?.state ?? '—'}`,
      `العنوان: ${order.user?.address ?? '—'}`,
      `وضع الزبون: ${customerStatus}`,
      '',
      '--- تفاصيل الطلب ---',
      `المنتج: ${order.product?.name_ar ?? '—'} × ${order.quantity}`,
    ]
    if (order.promo_code && (order.promo_discount ?? 0) > 0) {
      lines.push(
        `كود الخصم: ${order.promo_code}`,
        `مبلغ الخصم على البضاعة: ${Number(order.promo_discount).toFixed(2)} د.إ`
      )
    }
    lines.push(
      `القيمة الكلية: ${order.total.toFixed(2)} د.إ`,
      `عمولة المسوق: ${order.marketer_fee_total.toFixed(2)} د.إ`
    )
    if (order.notes) lines.push('', '--- ملاحظات ---', order.notes)
    return lines.join('\n')
  }
  const lines = [
    `Order #: ${order.order_number}`,
    `Code: ${order.product?.offer?.code ?? '—'}`,
    `Date: ${dateStr}`,
    '',
    '--- Customer ---',
    `Name: ${order.user?.name ?? '—'}`,
    `Phone: ${order.user?.phone ?? '—'}`,
    `State: ${order.user?.state ?? '—'}`,
    `Address: ${order.user?.address ?? '—'}`,
    `Customer status: ${customerStatus}`,
    '',
    '--- Order details ---',
    `Product: ${order.product?.name_en ?? order.product?.name_ar ?? '—'} × ${order.quantity}`,
  ]
  if (order.promo_code && (order.promo_discount ?? 0) > 0) {
    lines.push(
      `Discount code: ${order.promo_code}`,
      `Line discount: ${Number(order.promo_discount).toFixed(2)} AED`
    )
  }
  lines.push(`Total: ${order.total.toFixed(2)} AED`, `Marketer fee: ${order.marketer_fee_total.toFixed(2)} AED`)
  if (order.notes) lines.push('', '--- Notes ---', order.notes)
  return lines.join('\n')
}

export default function OrderHistory() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const receiptFileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const fetchOrders = () => ordersApi.all().then((res) => setOrders(res.data))

  useEffect(() => {
    fetchOrders().finally(() => setLoading(false))
  }, [])

  const dateFmt = (date: string) =>
    new Date(date).toLocaleString(lang === 'ar' ? 'ar-AE' : 'en-AE', {
      dateStyle: 'short',
      timeStyle: 'short',
    })

  const handleUploadReceipt = async (orderId: number, file: File) => {
    setUploadingId(orderId)
    try {
      const formData = new FormData()
      formData.append('receipt', file)
      const res = await ordersApi.uploadReceipt(orderId, formData)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data : o)))
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      alert(msg || t('common.error'))
    } finally {
      setUploadingId(null)
      const input = receiptFileInputRefs.current[orderId]
      if (input) input.value = ''
    }
  }

  const handleCopy = async (order: Order) => {
    const text = buildOrderText(order, orders, lang)
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(order.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopiedId(order.id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handleDeleteOrder = async (order: Order) => {
    if (!user?.role || user.role !== 'admin') return
    if (!confirm(t('staff.confirm_delete_order'))) return
    setDeletingId(order.id)
    try {
      await ordersApi.deleteOrder(order.id)
      setOrders((prev) => prev.filter((o) => o.id !== order.id))
    } catch {
      alert(t('common.error'))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
      <h1 className="section-title text-3xl mb-2">{t('staff.order_history')}</h1>
      <p className="text-tobacco-400 mb-8">{t('staff.order_history_hint')}</p>

      {orders.length === 0 ? (
        <div className="card p-12 text-center text-tobacco-500">
          <p>{t('common.no_data')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => (
            <article
              key={order.id}
              className="card p-6 border-tobacco-700 hover:border-gold-700/50 transition-colors"
              aria-label={`Order ${order.order_number}`}
            >
              {/* Header: order number + status */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-tobacco-700">
                <span className="text-gold-400 font-black text-xl">#{order.order_number}</span>
                <span
                  className={
                    order.status === 'delivered'
                      ? 'badge-status-delivered'
                      : order.status === 'ordered'
                        ? 'badge-status-ordered'
                        : 'badge-status-pending'
                  }
                >
                  {order.status === 'delivered'
                    ? t('tracking.status_delivered')
                    : order.status === 'ordered'
                      ? t('tracking.status_ordered')
                      : t('tracking.status_pending')}
                </span>
              </div>

              {/* Order text (same format as email) + Copy */}
              <section className="mb-6" aria-label={t('staff.order_text_section')}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h2 className="text-cream-200 font-bold text-sm">
                    <span className="text-gold-400">{t('staff.order_text_section')}</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleCopy(order)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-tobacco-700 hover:bg-gold-600 hover:text-tobacco-950 text-gold-400 text-sm font-medium transition-colors"
                  >
                    {copiedId === order.id ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {t('staff.copied')}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {t('staff.copy_order_text')}
                      </>
                    )}
                  </button>
                </div>
                <div
                  className="bg-tobacco-800/80 rounded-xl p-4 font-mono text-sm text-cream-200 whitespace-pre-wrap border border-tobacco-600"
                  dir="auto"
                >
                  {buildOrderText(order, orders, lang)}
                </div>
              </section>

              {/* Admin only: delete order (removes order + receipt + stats adjustment) */}
              {user?.role === 'admin' && (
                <div className="mb-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(order)}
                    disabled={deletingId === order.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-300 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {deletingId === order.id ? (
                      t('common.loading')
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {t('staff.delete_order')}
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Receipt for this order (linked explicitly) */}
              <section aria-label={t('staff.receipt_for_order')}>
                <h2 className="text-cream-200 font-bold text-sm mb-3 flex items-center gap-2">
                  <span className="text-gold-400">{t('staff.receipt_for_order')}</span>
                  <span className="text-tobacco-500 font-normal">#{order.order_number}</span>
                </h2>
                {order.receipt_path ? (
                  <div className="rounded-xl overflow-hidden border border-tobacco-600 bg-tobacco-900 max-w-md">
                    {!order.receipt_path.toLowerCase().endsWith('.pdf') && (
                      <a href={`${storageBase}/${order.receipt_path}`} target="_blank" rel="noreferrer" className="block">
                        <img
                          src={`${storageBase}/${order.receipt_path}`}
                          alt="Receipt"
                          className="w-full max-h-64 object-cover border-b border-tobacco-700"
                        />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const blob = await ordersApi.getReceiptBlob(order.id)
                          const u = URL.createObjectURL(blob)
                          window.open(u)
                        } catch {
                          alert(t('common.error'))
                        }
                      }}
                      className="w-full p-6 flex flex-col items-center justify-center gap-2 text-gold-400 hover:bg-tobacco-800 transition-colors focus:ring-2 ring-gold-500 rounded-xl"
                    >
                      {order.receipt_path.toLowerCase().match(/\.(pdf)$/) ? (
                        <>
                          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span>{t('staff.view_receipt_pdf')}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                          </svg>
                          <span>{lang === 'ar' ? 'عرض الإيصال' : 'View Receipt'}</span>
                        </>
                      )}
                    </button>
                    {order.receipt_uploaded_at && (
                      <p className="p-2 text-xs text-tobacco-500 text-center border-t border-tobacco-700">
                        {t('tracking.receipt_uploaded')} — {dateFmt(order.receipt_uploaded_at)}
                      </p>
                    )}
                  </div>
                ) : order.status === 'ordered' ? (
                  <div className="bg-tobacco-800/50 rounded-xl p-6 border border-tobacco-700 border-dashed space-y-3">
                    <p className="text-sm text-tobacco-400 text-center">{t('tracking.upload_hint')}</p>
                    <input
                      ref={(el) => {
                        receiptFileInputRefs.current[order.id] = el
                      }}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void handleUploadReceipt(order.id, file)
                      }}
                    />
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => receiptFileInputRefs.current[order.id]?.click()}
                        disabled={uploadingId === order.id}
                        className="btn-primary text-sm disabled:opacity-60"
                      >
                        {uploadingId === order.id ? t('common.loading') : t('tracking.upload_receipt')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-tobacco-800/50 rounded-xl p-6 border border-tobacco-700 border-dashed text-center text-tobacco-500 text-sm">
                    {t('staff.receipt_not_uploaded')}
                  </div>
                )}
              </section>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
