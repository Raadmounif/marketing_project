export type UserRole = 'customer' | 'staff' | 'admin'

export type UAE_State =
  | 'Abu Dhabi'
  | 'Dubai'
  | 'Sharjah'
  | 'Ajman'
  | 'Umm Al Quwain'
  | 'Ras Al Khaimah'
  | 'Fujairah'

export const UAE_STATES: UAE_State[] = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
]

export interface User {
  id: number
  name: string
  phone: string
  email: string
  role: UserRole
  state: UAE_State | null
  address: string | null
  created_at: string
}

export interface MarketerFeeSchedule {
  qty_fees: Record<string, number>
  state_extras: Record<string, number>
}

export interface Offer {
  id: number
  name_ar: string
  name_en: string
  code: string
  delivery_costs: Record<string, number>
  marketer_fee_schedule: MarketerFeeSchedule | null
  is_active: boolean
  products?: Product[]
  active_products?: Product[]
  created_at: string
}

export interface Product {
  id: number
  offer_id: number
  name_ar: string
  name_en: string
  photos: string[] | null
  promo_code: string | null
  promo_expiry: string | null
  promo_discount: number | null
  unit_total_price: number
  marketer_fee_per_unit: number
  price_per_unit: number
  is_active: boolean
  offer?: Offer
  created_at: string
}

export type OrderStatus = 'pending' | 'ordered' | 'delivered'

export interface Order {
  id: number
  order_number: string
  user_id: number
  product_id: number
  quantity: number
  notes: string | null
  total: number
  marketer_fee_total: number
  delivery_date: string
  status: OrderStatus
  receipt_path: string | null
  receipt_uploaded_at: string | null
  feedback: string | null
  commission_collected: boolean
  product?: Product
  user?: User
  created_at: string
}

export interface Favorite {
  id: number
  user_id: number
  product_id: number
  product?: Product
}

export interface AdvertisingBoard {
  id: number
  content_ar: string
  content_en: string
  image_path: string | null
  is_active: boolean
  sort_order: number
}

export interface HowItWorksItem {
  id: number
  title_ar: string
  title_en: string
  body_ar: string
  body_en: string
  sort_order: number
}

export interface Statistic {
  successful_orders_count: number
  cumulative_total: number
  cumulative_marketer_fee: number
  commission_collected: number
  commission_uncollected: number
  orders: Order[]
}
