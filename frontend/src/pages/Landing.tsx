import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Autoplay, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import { offersApi, boardApi, hiwApi } from '../api'
import { useLang } from '../contexts/LangContext'
import { useAuth } from '../contexts/AuthContext'
import ProductCard from '../components/ProductCard'
import OrderModal from '../components/OrderModal'
import type { Offer, Product, AdvertisingBoard, HowItWorksItem } from '../types'

export default function Landing() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { user } = useAuth()

  const [offers, setOffers] = useState<Offer[]>([])
  const [boards, setBoards] = useState<AdvertisingBoard[]>([])
  const [hiwItems, setHiwItems] = useState<HowItWorksItem[]>([])
  const [selectedOffer, setSelectedOffer] = useState<number | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null)
  const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  const storageBase = import.meta.env.VITE_STORAGE_URL || import.meta.env.VITE_API_URL?.replace('/api', '/storage') || ''

  useEffect(() => {
    Promise.all([offersApi.list(), boardApi.list(), hiwApi.list()])
      .then(([offersRes, boardsRes, hiwRes]) => {
        setOffers(offersRes.data)
        setBoards(boardsRes.data)
        setHiwItems(hiwRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const allProducts = offers.flatMap((o) => (o.products || []).map((p) => ({ ...p, offer: o })))

  const filteredProducts = allProducts.filter((p) => {
    const matchOffer = selectedOffer === 'all' || p.offer_id === selectedOffer
    const matchSearch = !search || p.name_ar.includes(search) || p.name_en.toLowerCase().includes(search.toLowerCase())
    return matchOffer && matchSearch
  })

  const handleOrderSuccess = (orderNumber: string) => {
    setSelectedProduct(null)
    setOrderSuccess(orderNumber)
    setTimeout(() => setOrderSuccess(null), 5000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Success toast */}
      {orderSuccess && (
        <div className="fixed top-20 start-1/2 -translate-x-1/2 z-50 bg-forest-600 text-white px-6 py-3 rounded-xl shadow-xl animate-slide-up">
          {t('order.success')} — {t('order.order_number')}: <strong>{orderSuccess}</strong>
        </div>
      )}

      {/* Hero / Advertising Board */}
      {boards.length > 0 ? (
        <section className="relative">
          <Swiper
            modules={[Pagination, Autoplay, Navigation]}
            pagination={{ clickable: true }}
            navigation
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop
            className="h-64 sm:h-80 lg:h-96"
          >
            {boards.map((board) => (
              <SwiperSlide key={board.id}>
                <div className="relative h-full w-full flex items-center justify-center overflow-hidden bg-tobacco-800">
                  {board.image_path && (
                    <img
                      src={`${storageBase}/${board.image_path}`}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-40"
                    />
                  )}
                  <div className="relative z-10 text-center px-6 max-w-2xl">
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-cream-100 leading-relaxed">
                      {lang === 'ar' ? board.content_ar : board.content_en}
                    </p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-tobacco-950/80 via-transparent to-tobacco-950/40" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      ) : (
        <section className="relative bg-gradient-to-br from-tobacco-800 via-tobacco-900 to-tobacco-950 py-20 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 start-10 w-64 h-64 rounded-full bg-gold-500 blur-3xl" />
            <div className="absolute bottom-10 end-10 w-48 h-48 rounded-full bg-gold-600 blur-3xl" />
          </div>
          <div className="relative max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-cream-100 mb-4">
              <span className="text-gold-400">{lang === 'ar' ? 'سوق' : 'Tobacco'}</span>{' '}
              {lang === 'ar' ? 'التبغ الإلكتروني' : 'Market'}
            </h1>
            <p className="text-lg text-tobacco-400 mb-8">{t('landing.hero_subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="#offers" className="btn-primary text-base px-8 py-3">{t('landing.browse_offers')}</a>
              {!user && (
                <Link to="/register" className="btn-secondary text-base px-8 py-3">{t('landing.create_account')}</Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      {hiwItems.length > 0 && (
        <section className="py-16 px-4 bg-tobacco-900/50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="section-title text-3xl">{t('landing.how_it_works')}</h2>
              <hr className="gold-divider w-24 mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {hiwItems.map((item, index) => (
                <div key={item.id} className="card p-6 text-center hover:border-gold-600 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-gold-500 text-tobacco-950 font-black text-xl flex items-center justify-center mx-auto mb-4">
                    {index + 1}
                  </div>
                  <h3 className="font-bold text-gold-400 mb-2 text-lg">
                    {lang === 'ar' ? item.title_ar : item.title_en}
                  </h3>
                  <p className="text-tobacco-400 text-sm leading-relaxed">
                    {lang === 'ar' ? item.body_ar : item.body_en}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Offers & Products */}
      <section id="offers" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="section-title text-3xl">{t('landing.offers_section')}</h2>
            <hr className="gold-divider w-24 mx-auto mt-4" />
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <svg className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tobacco-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('landing.search_placeholder')}
                className="input-field ps-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedOffer('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedOffer === 'all' ? 'bg-gold-500 text-tobacco-950' : 'bg-tobacco-800 text-cream-200 hover:bg-tobacco-700'}`}
              >
                {t('landing.all_offers')}
              </button>
              {offers.map((offer) => (
                <button
                  key={offer.id}
                  onClick={() => setSelectedOffer(offer.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedOffer === offer.id ? 'bg-gold-500 text-tobacco-950' : 'bg-tobacco-800 text-cream-200 hover:bg-tobacco-700'}`}
                >
                  {lang === 'ar' ? offer.name_ar : offer.name_en}
                </button>
              ))}
            </div>
          </div>

          {/* Products grid or per-offer view */}
          {offers.length === 0 ? (
            <div className="text-center py-20 text-tobacco-500">{t('landing.no_offers')}</div>
          ) : selectedOffer === 'all' ? (
            <div className="space-y-12">
              {offers.map((offer) => {
                const products = (offer.products || []).filter((p) =>
                  !search || p.name_ar.includes(search) || p.name_en.toLowerCase().includes(search.toLowerCase())
                )
                if (products.length === 0 && search) return null
                return (
                  <div key={offer.id}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-8 bg-gold-500 rounded-full" />
                      <h3 className="text-xl font-bold text-cream-100">
                        {lang === 'ar' ? offer.name_ar : offer.name_en}
                      </h3>
                      <span className="text-tobacco-500 text-sm px-2 py-0.5 bg-tobacco-800 rounded-md">
                        {offer.code}
                      </span>
                    </div>
                    {products.length === 0 ? (
                      <p className="text-tobacco-500 text-sm py-4">{t('landing.no_products')}</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={{ ...product, offer }}
                            isFavorited={favoritedIds.has(product.id)}
                            onFavoriteChange={(id, fav) => {
                              setFavoritedIds((prev) => {
                                const next = new Set(prev)
                                fav ? next.add(id) : next.delete(id)
                                return next
                              })
                            }}
                            onOrder={(p) => setSelectedProduct({ ...p, offer })}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20 text-tobacco-500">{t('landing.no_products')}</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isFavorited={favoritedIds.has(product.id)}
                      onFavoriteChange={(id, fav) => {
                        setFavoritedIds((prev) => {
                          const next = new Set(prev)
                          fav ? next.add(id) : next.delete(id)
                          return next
                        })
                      }}
                      onOrder={(p) => setSelectedProduct(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Order Modal */}
      <OrderModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onSuccess={handleOrderSuccess}
      />
    </div>
  )
}
