import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '../../contexts/LangContext'
import { notificationsApi } from '../../api'
import type { Order } from '../../types'

export default function StaffNotifications() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    notificationsApi.overdue().then((res) => setOrders(res.data)).finally(() => setLoading(false))
  }, [])

  const hoursAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    return Math.floor(diff / (1000 * 60 * 60))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
      <div className="mb-8">
        <Link to="/staff" className="text-tobacco-400 hover:text-gold-400 text-sm mb-2 block">← {t('staff.dashboard')}</Link>
        <div className="flex items-center gap-3">
          <h1 className="section-title text-2xl">{t('staff.notifications')}</h1>
          {orders.length > 0 && (
            <span className="px-2.5 py-1 bg-red-900 text-red-300 text-sm font-bold rounded-full border border-red-800">
              {orders.length}
            </span>
          )}
        </div>
        <p className="text-tobacco-400 text-sm mt-1">{t('staff.overdue_title')}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-forest-600 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-tobacco-500">{t('staff.no_overdue')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-5 border-red-900/50 bg-red-950/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-gold-400 font-bold">#{order.order_number}</span>
                    <span className="px-2 py-0.5 bg-red-900/50 text-red-300 text-xs rounded-full border border-red-800">
                      {hoursAgo(order.created_at)}h {lang === 'ar' ? 'مضت' : 'ago'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-tobacco-500 mb-0.5">{t('staff.customer_info')}</p>
                      <p className="text-cream-100 font-medium">{order.user?.name}</p>
                      <p className="text-gold-400 text-sm font-mono">{order.user?.phone}</p>
                      <p className="text-tobacco-400 text-sm">{order.user?.state} — {order.user?.address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-tobacco-500 mb-0.5">{t('order.title')}</p>
                      <p className="text-cream-100">{lang === 'ar' ? order.product?.name_ar : order.product?.name_en}</p>
                      <p className="text-tobacco-400 text-sm">×{order.quantity} — {order.total.toFixed(2)} {t('common.aed')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href={`tel:${order.user?.phone}`}
                    className="flex items-center gap-2 btn-primary text-sm py-2 px-4"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {lang === 'ar' ? 'اتصال' : 'Call'}
                  </a>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-tobacco-800 text-xs text-tobacco-500">
                {t('staff.order_date')}: {new Date(order.created_at).toLocaleString(lang === 'ar' ? 'ar-AE' : 'en-AE')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
