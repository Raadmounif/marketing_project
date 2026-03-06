import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'

export default function Navbar() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { lang, toggleLang } = useLang()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    setMenuOpen(false)
  }

  const isActive = (path: string) => location.pathname === path

  const navLinkClass = (path: string) =>
    `nav-link px-3 py-2 rounded-lg transition-colors ${isActive(path) ? 'nav-link-active bg-tobacco-800' : 'hover:bg-tobacco-800'}`

  return (
    <nav className="bg-tobacco-900 border-b border-tobacco-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-gold-500 rounded-lg flex items-center justify-center">
              <span className="text-tobacco-950 font-black text-lg">T</span>
            </div>
            <span className="font-black text-gold-400 text-lg tracking-wide hidden sm:block">
              {lang === 'ar' ? 'سوق التبغ' : 'Tobacco Market'}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className={navLinkClass('/')}>{t('nav.home')}</Link>

            {user && user.role === 'customer' && (
              <>
                <Link to="/orders" className={navLinkClass('/orders')}>{t('nav.orders')}</Link>
                <Link to="/favorites" className={navLinkClass('/favorites')}>{t('nav.favorites')}</Link>
                <Link to="/profile" className={navLinkClass('/profile')}>{t('nav.profile')}</Link>
              </>
            )}

            {user && (user.role === 'staff' || user.role === 'admin') && (
              <>
                <Link to="/staff" className={navLinkClass('/staff')}>{t('nav.staff')}</Link>
                <Link to="/profile" className={navLinkClass('/profile')}>{t('nav.profile')}</Link>
              </>
            )}

            {user && user.role === 'admin' && (
              <Link to="/admin/settings" className={navLinkClass('/admin/settings')}>{t('nav.admin')}</Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="px-3 py-1.5 rounded-lg bg-tobacco-800 hover:bg-tobacco-700 text-gold-400 text-sm font-bold transition-colors border border-tobacco-600"
            >
              {lang === 'ar' ? 'EN' : 'ع'}
            </button>

            {/* Auth buttons */}
            {!user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">{t('nav.login')}</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">{t('nav.register')}</Link>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-cream-200 text-sm hidden lg:block truncate max-w-32">{user.name}</span>
                <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-4">{t('nav.logout')}</button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg bg-tobacco-800 hover:bg-tobacco-700 text-cream-200 transition-colors"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-tobacco-900 border-t border-tobacco-700 px-4 py-3 space-y-1 animate-fade-in">
          <Link to="/" className="block px-3 py-2 rounded-lg hover:bg-tobacco-800 text-cream-200" onClick={() => setMenuOpen(false)}>{t('nav.home')}</Link>

          {user && user.role === 'customer' && (
            <>
              <Link to="/orders" className="block px-3 py-2 rounded-lg hover:bg-tobacco-800 text-cream-200" onClick={() => setMenuOpen(false)}>{t('nav.orders')}</Link>
              <Link to="/favorites" className="block px-3 py-2 rounded-lg hover:bg-tobacco-800 text-cream-200" onClick={() => setMenuOpen(false)}>{t('nav.favorites')}</Link>
              <Link to="/profile" className="block px-3 py-2 rounded-lg hover:bg-tobacco-800 text-cream-200" onClick={() => setMenuOpen(false)}>{t('nav.profile')}</Link>
            </>
          )}

          {user && (user.role === 'staff' || user.role === 'admin') && (
            <>
              <Link to="/staff" className="block px-3 py-2 rounded-lg hover:bg-tobacco-800 text-cream-200" onClick={() => setMenuOpen(false)}>{t('nav.staff')}</Link>
              <Link to="/profile" className="block px-3 py-2 rounded-lg hover:bg-tobacco-800 text-cream-200" onClick={() => setMenuOpen(false)}>{t('nav.profile')}</Link>
            </>
          )}

          {user && user.role === 'admin' && (
            <Link to="/admin/settings" className="block px-3 py-2 rounded-lg hover:bg-tobacco-800 text-cream-200" onClick={() => setMenuOpen(false)}>{t('nav.admin')}</Link>
          )}

          <div className="pt-2 border-t border-tobacco-700 space-y-1">
            {!user ? (
              <>
                <Link to="/login" className="block px-3 py-2 rounded-lg bg-tobacco-800 text-cream-200 text-center" onClick={() => setMenuOpen(false)}>{t('nav.login')}</Link>
                <Link to="/register" className="block px-3 py-2 rounded-lg bg-gold-500 text-tobacco-950 font-bold text-center" onClick={() => setMenuOpen(false)}>{t('nav.register')}</Link>
              </>
            ) : (
              <>
                <p className="px-3 py-1 text-sm text-tobacco-500">{user.name}</p>
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg hover:bg-tobacco-800 text-red-400">{t('nav.logout')}</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
