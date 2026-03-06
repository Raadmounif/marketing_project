import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '../contexts/LangContext'
import { statisticsApi, ordersApi } from '../api'
import type { Order, Statistic } from '../types'

export default function StatisticsPage() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const [stats, setStats] = useState<Statistic | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOrders, setShowOrders] = useState(false)

  const fetchStats = () => {
    statisticsApi.get().then((res) => setStats(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchStats() }, [])

  const handleToggleCommission = async (order: Order) => {
    await ordersApi.toggleCommission(order.id)
    fetchStats()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const cards = [
    {
      label: t('statistics.successful_orders'),
      value: stats?.successful_orders_count ?? 0,
      unit: '',
      clickable: false,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: t('statistics.cumulative_total'),
      value: (stats?.cumulative_total ?? 0).toFixed(2),
      unit: t('common.aed'),
      clickable: false,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: t('statistics.cumulative_marketer_fee'),
      value: (stats?.cumulative_marketer_fee ?? 0).toFixed(2),
      unit: t('common.aed'),
      clickable: true,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
      <h1 className="section-title text-3xl mb-8">{t('statistics.title')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            onClick={card.clickable ? () => setShowOrders(true) : undefined}
            className={`card p-6 text-center transition-colors ${card.clickable ? 'hover:border-gold-500 cursor-pointer' : 'hover:border-gold-600'}`}
          >
            <div className="text-gold-500 flex justify-center mb-3">{card.icon}</div>
            <div className="text-3xl font-black text-cream-100">
              {card.value}
              {card.unit && <span className="text-lg text-gold-500 ms-1">{card.unit}</span>}
            </div>
            <p className="text-tobacco-400 text-sm mt-2">{card.label}</p>
            {card.clickable && (
              <p className="text-xs text-gold-600 mt-1">{lang === 'ar' ? '← انقر للتفاصيل' : 'Click for details →'}</p>
            )}
          </div>
        ))}
      </div>

      {/* Commission split summary */}
      {stats && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-forest-700/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-forest-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-tobacco-400 text-xs">{t('statistics.commission_collected')}</p>
              <p className="text-xl font-black text-forest-500">
                {(stats.commission_collected ?? 0).toFixed(2)} <span className="text-sm">{t('common.aed')}</span>
              </p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-900/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-tobacco-400 text-xs">{t('statistics.commission_uncollected')}</p>
              <p className="text-xl font-black text-amber-400">
                {(stats.commission_uncollected ?? 0).toFixed(2)} <span className="text-sm">{t('common.aed')}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Orders detail modal */}
      {showOrders && stats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowOrders(false)} />
          <div className="relative bg-tobacco-900 rounded-2xl border border-tobacco-700 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-tobacco-700 flex-shrink-0">
              <h2 className="text-lg font-bold text-gold-400">{t('statistics.fee_detail_title')}</h2>
              <button onClick={() => setShowOrders(false)} className="p-2 rounded-lg hover:bg-tobacco-800 text-tobacco-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-2">
              {(stats.orders || []).length === 0 ? (
                <p className="text-tobacco-500 text-center py-10">{t('common.no_data')}</p>
              ) : (
                <>
                  {/* Header */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-2 text-xs text-tobacco-500 font-medium">
                    <div className="col-span-2">{t('statistics.order_number')}</div>
                    <div className="col-span-3">{t('statistics.customer')}</div>
                    <div className="col-span-2">{t('statistics.product')}</div>
                    <div className="col-span-1 text-center">{t('statistics.qty')}</div>
                    <div className="col-span-2 text-center">{t('statistics.fee_amount')}</div>
                    <div className="col-span-2 text-center">{t('statistics.commission_status')}</div>
                  </div>

                  {(stats.orders as Order[]).map((order) => (
                    <div key={order.id} className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg border transition-colors ${order.commission_collected ? 'bg-forest-900/20 border-forest-800/50' : 'bg-tobacco-800/30 border-tobacco-700'}`}>
                      <div className="col-span-12 sm:col-span-2">
                        <span className="font-mono text-gold-400 text-xs">{order.order_number}</span>
                      </div>
                      <div className="col-span-12 sm:col-span-3">
                        <p className="text-cream-200 text-xs truncate">{order.user?.name || '—'}</p>
                        <p className="text-tobacco-500 text-xs">{order.user?.phone}</p>
                      </div>
                      <div className="col-span-8 sm:col-span-2">
                        <p className="text-cream-200 text-xs truncate">
                          {lang === 'ar' ? order.product?.name_ar : order.product?.name_en}
                        </p>
                      </div>
                      <div className="col-span-4 sm:col-span-1 text-center">
                        <span className="text-cream-300 text-xs">×{order.quantity}</span>
                      </div>
                      <div className="col-span-6 sm:col-span-2 text-center">
                        <span className="font-bold text-amber-400 text-sm">{Number(order.marketer_fee_total).toFixed(2)}</span>
                        <span className="text-xs text-tobacco-500 ms-1">{t('common.aed')}</span>
                      </div>
                      <div className="col-span-6 sm:col-span-2 flex justify-center">
                        <button
                          onClick={() => handleToggleCommission(order)}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                            order.commission_collected
                              ? 'bg-forest-700 hover:bg-forest-600 text-white'
                              : 'bg-amber-900/50 hover:bg-amber-800/50 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {order.commission_collected ? (
                            <>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              {lang === 'ar' ? 'محصّلة' : 'Collected'}
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {lang === 'ar' ? 'لم تُحصَّل' : 'Pending'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Footer totals */}
            <div className="border-t border-tobacco-700 p-4 flex flex-wrap gap-4 justify-end flex-shrink-0">
              <div className="text-sm">
                <span className="text-tobacco-400">{t('statistics.commission_collected')}: </span>
                <span className="font-bold text-forest-500">{(stats.commission_collected ?? 0).toFixed(2)} {t('common.aed')}</span>
              </div>
              <div className="text-sm">
                <span className="text-tobacco-400">{t('statistics.commission_uncollected')}: </span>
                <span className="font-bold text-amber-400">{(stats.commission_uncollected ?? 0).toFixed(2)} {t('common.aed')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
