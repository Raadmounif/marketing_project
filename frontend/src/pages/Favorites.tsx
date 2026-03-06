import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '../contexts/LangContext'
import { favoritesApi } from '../api'
import ProductCard from '../components/ProductCard'
import OrderModal from '../components/OrderModal'
import type { Favorite, Product } from '../types'

export default function Favorites() {
  const { t } = useTranslation()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null)

  useEffect(() => {
    favoritesApi.list().then((res) => setFavorites(res.data)).finally(() => setLoading(false))
  }, [])

  const handleFavoriteChange = (productId: number, isFav: boolean) => {
    if (!isFav) {
      setFavorites((prev) => prev.filter((f) => f.product_id !== productId))
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
      <h1 className="section-title text-3xl mb-8">{t('favorites.title')}</h1>

      {favorites.length === 0 ? (
        <div className="card p-12 text-center text-tobacco-500">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p>{t('favorites.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites.map((fav) =>
            fav.product ? (
              <ProductCard
                key={fav.id}
                product={fav.product}
                isFavorited={true}
                onFavoriteChange={handleFavoriteChange}
                onOrder={(p) => setSelectedProduct(p)}
              />
            ) : null
          )}
        </div>
      )}

      {orderSuccess && (
        <div className="fixed top-20 start-1/2 -translate-x-1/2 z-50 bg-forest-600 text-white px-6 py-3 rounded-xl shadow-xl animate-slide-up">
          {t('order.success')} — {t('order.order_number')}: <strong>{orderSuccess}</strong>
        </div>
      )}

      <OrderModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onSuccess={(num) => {
          setSelectedProduct(null)
          setOrderSuccess(num)
          setTimeout(() => setOrderSuccess(null), 5000)
        }}
      />
    </div>
  )
}
