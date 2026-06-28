export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type PaymentStatus = 'none' | 'deposit_pending' | 'deposit_paid' | 'fully_paid'
export type ServiceCategory = 'hair' | 'color' | 'nails' | 'skin' | 'other'
export type StaffRole = 'stylist' | 'colorist' | 'nail_tech' | 'esthetician' | 'other'
export type CampaignStatus = 'draft' | 'approved' | 'sent'
export type CampaignChannel = 'telegram' | 'whatsapp' | 'imessage' | 'email' | 'all'
export type CampaignSegment = 'all' | 'inactive_30_days' | 'inactive_60_days' | 'custom'
export type PreferredChannel = 'telegram' | 'whatsapp' | 'imessage' | 'email'
export type MembershipSlug = 'royal_beauty_society' | 'inner_glow' | 'content_creator' | 'influencer' | 'vip_creator'
export type BillingInterval = 'monthly' | 'quarterly'
export type MembershipStatus = 'active' | 'cancelled' | 'past_due'
export type ProductCategory = 'retail' | 'supply' | 'equipment'
export type ShopCategory = 'kit' | 'ebook' | 'digital' | 'retail'
export type PayrollStatus = 'pending' | 'paid'

export interface Client {
  id: string
  full_name: string
  email: string
  phone: string | null
  preferred_staff_id: string | null
  intake_notes: string | null
  admin_notes: string | null
  stripe_customer_id: string | null
  telegram_chat_id: string | null
  whatsapp_phone: string | null
  imessage_address: string | null
  preferred_channel: PreferredChannel
  created_at: string
  updated_at: string
}

export interface Staff {
  id: string
  name: string
  role: StaffRole
  bio: string | null
  avatar_url: string | null
  commission_rate: number
  is_active: boolean
  created_at: string
}

export interface Service {
  id: string
  name: string
  category: ServiceCategory
  description: string | null
  duration_minutes: number
  price_cents: number
  deposit_cents: number
  image_urls: string[]
  is_active: boolean
  created_at: string
}

export interface StaffService {
  staff_id: string
  service_id: string
}

export interface Appointment {
  id: string
  client_id: string
  staff_id: string
  service_id: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  intake_notes: string | null
  admin_notes: string | null
  payment_status: PaymentStatus
  stripe_session_id: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
  // Joined fields
  client?: Pick<Client, 'id' | 'full_name' | 'email' | 'phone'>
  staff?: Pick<Staff, 'id' | 'name' | 'avatar_url'>
  service?: Pick<Service, 'id' | 'name' | 'duration_minutes' | 'price_cents' | 'deposit_cents'>
}

export interface Review {
  id: string
  appointment_id: string
  client_id: string
  staff_id: string
  service_id: string
  rating: number
  comment: string | null
  is_public: boolean
  created_at: string
}

export interface Settings {
  id: string
  salon_name: string
  phone: string
  email: string
  address: string
  open_time: string
  close_time: string
  slot_interval_minutes: number
  cancellation_policy_hours: number
  no_show_fee_cents: number
  reminder_hours_before: number
  google_calendar_id: string | null
  google_refresh_token: string | null
  telegram_bot_token: string | null
  telegram_chat_id: string | null
  whatsapp_phone_id: string | null
  whatsapp_token: string | null
  obsidian_rest_url: string | null
  obsidian_api_key: string | null
  hermes_reminders_enabled: boolean
  hermes_marketing_enabled: boolean
  hermes_reengagement_enabled: boolean
  updated_at: string
}

export interface Product {
  id: string
  name: string
  category: ProductCategory
  sku: string | null
  description: string | null
  quantity_on_hand: number
  reorder_level: number
  cost_cents: number
  price_cents: number
  supplier_name: string | null
  supplier_contact: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PayrollRecord {
  id: string
  staff_id: string
  period_start: string
  period_end: string
  total_services: number
  gross_revenue_cents: number
  commission_rate: number
  commission_cents: number
  booth_rent_cents: number
  net_payout_cents: number
  status: PayrollStatus
  created_at: string
  staff?: Pick<Staff, 'id' | 'name' | 'role'>
}

export interface BoothRenter {
  id: string
  staff_id: string
  monthly_rent_cents: number
  billing_day: number
  stripe_subscription_id: string | null
  is_active: boolean
  created_at: string
}

export interface Campaign {
  id: string
  name: string
  subject: string
  body_template: string
  segment: CampaignSegment
  channel: CampaignChannel
  status: CampaignStatus
  sent_at: string | null
  sent_count: number
  created_by: string
  created_at: string
}

export interface CampaignSend {
  id: string
  campaign_id: string
  client_id: string
  channel_used: Exclude<CampaignChannel, 'all'>
  sent_at: string
  status: 'sent' | 'delivered' | 'failed'
}

export interface Membership {
  id: string
  name: string
  slug: MembershipSlug
  description: string
  price_cents: number
  billing_interval: BillingInterval
  features: string[]
  stripe_price_id: string | null
  is_active: boolean
  created_at: string
}

export interface ClientMembership {
  id: string
  client_id: string
  membership_id: string
  stripe_subscription_id: string | null
  status: MembershipStatus
  started_at: string
  next_billing_date: string | null
  membership?: Membership
}

export interface IntakeForm {
  id: string
  client_id: string
  appointment_id: string
  hair_type: string | null
  hair_density: string | null
  hair_texture: string | null
  concerns: string[]
  goals: string[]
  current_products: string | null
  health_conditions: string | null
  allergies: string | null
  last_chemical_service: string | null
  signature: string | null
  signed_at: string | null
}

export interface GiftCard {
  id: string
  code: string
  amount_cents: number
  balance_cents: number
  purchased_by: string | null
  recipient_email: string | null
  message: string | null
  expires_at: string | null
  created_at: string
}

export interface ShopProduct {
  id: string
  name: string
  description: string | null
  price_cents: number
  category: ShopCategory
  image_url: string | null
  stripe_price_id: string | null
  inventory: number
  is_active: boolean
  created_at: string
}

export interface GoogleCalendarSync {
  id: string
  appointment_id: string
  google_event_id: string
  synced_at: string
  last_updated: string
}

// Utility types
export interface TimeSlot {
  start: string
  end: string
  available: boolean
}

export interface DashboardStats {
  todayAppointments: number
  todayRevenueCents: number
  totalClients: number
  avgRating: number
}
