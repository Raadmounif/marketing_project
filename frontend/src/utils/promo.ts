import type { Offer, Product } from '../types'

function expiryIsFuture(iso: string | null | undefined): boolean {
  return !!(iso && new Date(iso) > new Date())
}

/**
 * Product-level promo takes precedence when the code matches; otherwise offer-level promo is used.
 */
export function resolvePromoPercent(
  product: Product,
  code: string
): { percent: number; source: 'product' | 'offer' } | null {
  const t = code.trim()
  if (!t) return null

  if (
    product.promo_code &&
    t.toLowerCase() === product.promo_code.toLowerCase() &&
    expiryIsFuture(product.promo_expiry) &&
    (product.promo_discount_percent ?? 0) > 0
  ) {
    return { percent: product.promo_discount_percent as number, source: 'product' }
  }

  const offer = product.offer as Offer | undefined
  if (
    offer?.promo_code &&
    t.toLowerCase() === offer.promo_code.toLowerCase() &&
    expiryIsFuture(offer.promo_expiry) &&
    (offer.promo_discount_percent ?? 0) > 0
  ) {
    return { percent: offer.promo_discount_percent as number, source: 'offer' }
  }

  return null
}

export function hasActivePromoOnProduct(product: Product): boolean {
  return (
    !!product.promo_code &&
    expiryIsFuture(product.promo_expiry) &&
    (product.promo_discount_percent ?? 0) > 0
  )
}

export function hasActivePromoOnOffer(offer: Offer | undefined): boolean {
  if (!offer) return false
  return (
    !!offer.promo_code &&
    expiryIsFuture(offer.promo_expiry) &&
    (offer.promo_discount_percent ?? 0) > 0
  )
}

export function lineSubtotalPromoDiscount(lineSubtotal: number, percent: number): number {
  if (percent <= 0) return 0
  return Math.min(lineSubtotal, Math.round((lineSubtotal * percent) / 100 * 100) / 100)
}
