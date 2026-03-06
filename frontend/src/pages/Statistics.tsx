import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { statisticsApi } from '../api'
import type { Statistic } from '../types'

export default function StatisticsPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Statistic | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statisticsApi.get().then((res) => setStats(res.data)).finally(() => setLoading(false))
  }, [])

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
          <div key={card.label} className="card p-6 text-center hover:border-gold-600 transition-colors">
            <div className="text-gold-500 flex justify-center mb-3">{card.icon}</div>
            <div className="text-3xl font-black text-cream-100">
              {card.value}
              {card.unit && <span className="text-lg text-gold-500 ms-1">{card.unit}</span>}
            </div>
            <p className="text-tobacco-400 text-sm mt-2">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
