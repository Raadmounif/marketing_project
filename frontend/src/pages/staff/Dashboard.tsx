import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'

const staffLinks = [
  { to: '/staff/offers', key: 'staff.manage_offers', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { to: '/staff/order-history', key: 'staff.order_history', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { to: '/staff/board', key: 'staff.board_editor', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { to: '/staff/how-it-works', key: 'staff.hiw_editor', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/staff/notifications', key: 'staff.notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { to: '/staff/statistics', key: 'statistics.title', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
]

export default function StaffDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="section-title text-3xl">{t('staff.dashboard')}</h1>
        <p className="text-tobacco-400 mt-1">
          {t('nav.staff')} — <span className="text-gold-500">{user?.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="card p-6 hover:border-gold-600 transition-all duration-200 hover:shadow-lg hover:shadow-tobacco-950/50 group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-tobacco-800 group-hover:bg-gold-500 flex items-center justify-center transition-colors flex-shrink-0">
              <svg className="w-6 h-6 text-gold-400 group-hover:text-tobacco-950 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={link.icon} />
              </svg>
            </div>
            <span className="font-medium text-cream-100 group-hover:text-gold-400 transition-colors">{t(link.key as any)}</span>
          </Link>
        ))}

        {/* Manage Users — available to both staff and admin */}
        <Link
          to="/admin/users"
          className="card p-6 hover:border-gold-600 transition-all duration-200 group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-tobacco-800 group-hover:bg-gold-500 flex items-center justify-center transition-colors flex-shrink-0">
            <svg className="w-6 h-6 text-gold-400 group-hover:text-tobacco-950 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span className="font-medium text-cream-100 group-hover:text-gold-400 transition-colors">{t('admin.manage_users')}</span>
        </Link>

        {user?.role === 'admin' && (
          <Link
            to="/admin/settings"
            className="card p-6 hover:border-gold-600 transition-all duration-200 group flex items-center gap-4 border-gold-700/40"
          >
            <div className="w-12 h-12 rounded-xl bg-tobacco-800 group-hover:bg-gold-500 flex items-center justify-center transition-colors flex-shrink-0">
              <svg className="w-6 h-6 text-gold-400 group-hover:text-tobacco-950 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="font-medium text-cream-100 group-hover:text-gold-400 transition-colors">{t('admin.settings')}</span>
          </Link>
        )}
      </div>
    </div>
  )
}
