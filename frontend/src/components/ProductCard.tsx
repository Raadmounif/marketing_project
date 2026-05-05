import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { useAuth } from '../contexts/AuthContext'
import { favoritesApi } from '../api'
import { getStorageBase } from '../utils/storage'
import { hasActivePromoOnOffer, hasActivePromoOnProduct } from '../utils/promo'
import type { Product } from '../types'

interface Props {
  product: Product
  isFavorited?: boolean
  onFavoriteChange?: (productId: number, isFav: boolean) => void
  onOrder?: (product: Product) => void
}

export default function ProductCard({ product, isFavorited = false, onFavoriteChange, onOrder }: Props) {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [faved, setFaved] = useState(isFavorited)
  const [favLoading, setFavLoading] = useState(false)
  const [imgError, setImgError] = useState(false)

  const name = lang === 'ar' ? product.name_ar : product.name_en
  const storageBase = getStorageBase()
  const rawPhotoPath = product.photos?.[0]?.trim()
  const firstPhoto = rawPhotoPath ? `${storageBase}/${rawPhotoPath}` : null
  const showPhoto = Boolean(firstPhoto && !imgError)

  useEffect(() => {
    setImgError(false)
  }, [product.id])

  const handleFavorite = async () => {
    if (!user) { navigate('/login'); return }
    setFavLoading(true)
    try {
      if (faved) {
        await favoritesApi.remove(product.id)
        setFaved(false)
        onFavoriteChange?.(product.id, false)
      } else {
        await favoritesApi.add(product.id)
        setFaved(true)
        onFavoriteChange?.(product.id, true)
      }
    } catch {
      // ignore
    } finally {
      setFavLoading(false)
    }
  }

  const handleOrder = () => {
    if (!user) { navigate('/login'); return }
    onOrder?.(product)
  }

  const favoriteBtn = (
    <button
      type="button"
      onClick={handleFavorite}
      disabled={favLoading}
      className={`p-2 rounded-full bg-tobacco-900/80 hover:bg-tobacco-800 backdrop-blur-sm transition-colors shrink-0 ${showPhoto ? 'absolute top-2 end-2' : ''}`}
      title={faved ? t('product.remove_favorite') : t('product.add_favorite')}
    >
      <svg
        className={`w-5 h-5 transition-colors ${faved ? 'text-red-400 fill-red-400' : 'text-cream-200'}`}
        fill={faved ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  )

  const promoBadge =
    (hasActivePromoOnProduct(product) || hasActivePromoOnOffer(product.offer)) && (
      <div
        className={`px-2 py-1 bg-forest-600 text-white text-xs font-bold rounded-md shrink-0 ${showPhoto ? 'absolute top-2 start-2' : ''}`}
      >
        {t('product.promo_available')}
      </div>
    )

  return (
    <div className="card group hover:border-gold-600 transition-all duration-200 hover:shadow-lg hover:shadow-tobacco-950/50 flex flex-col">
      {showPhoto ? (
        <div className="relative h-44 bg-tobacco-800 overflow-hidden">
          <img
            src={firstPhoto as string}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
          {favoriteBtn}
          {promoBadge}
          {!product.is_active && (
            <div className="absolute inset-0 bg-tobacco-950/80 flex items-center justify-center">
              <span className="text-amber-400 font-bold text-sm text-center px-2">{t('product.out_of_stock')}</span>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`relative flex items-center justify-between gap-2 px-4 pt-3 border-b border-tobacco-800 ${product.is_active ? 'pb-2' : 'pb-7'}`}
        >
          <div className="min-h-[2rem] flex items-center">{promoBadge}</div>
          {favoriteBtn}
          {!product.is_active && (
            <span className="absolute inset-x-4 bottom-2 text-amber-400 font-bold text-xs text-center">
              {t('product.out_of_stock')}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <h3 className="font-bold text-cream-100 text-base leading-snug line-clamp-2">{name}</h3>

        <div className="flex items-center gap-1 mt-auto">
          <span className="text-xl font-black text-gold-400">{product.unit_total_price.toFixed(2)}</span>
          <span className="text-sm text-gold-600">{t('common.aed')}</span>
          <span className="text-xs text-tobacco-500 ms-1">/ {t('product.per_unit')}</span>
        </div>

        <button
          onClick={handleOrder}
          disabled={!product.is_active}
          className="btn-primary w-full text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('product.order_now')}
        </button>
      </div>
    </div>
  )
}
