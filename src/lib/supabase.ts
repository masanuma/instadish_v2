import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 一般ユーザー用クライアント（匿名キー）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 管理者用クライアント（サービスロールキー）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

// 店舗情報の型定義
export interface Store {
  id: string
  store_code: string
  name: string
  address: string
  phone: string
  fixed_caption: string
  fixed_hashtags: string
  store_description: string
  password_hash: string
  email?: string
  stripe_customer_id?: string
  created_at: string
  updated_at: string
}

// 認証セッションの型定義
export interface AuthSession {
  id: string
  store_id: string
  token: string
  expires_at: string
  created_at: string
}

// サブスクリプションプランの型定義
export interface SubscriptionPlan {
  id: string
  name: string
  price_monthly: number
  stripe_price_id: string
  features: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

// サブスクリプション状況の型定義
export interface Subscription {
  id: string
  store_id: string
  plan_id: string
  stripe_subscription_id?: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'
  trial_start?: string
  trial_end?: string
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

// 支払い履歴の型定義
export interface PaymentHistory {
  id: string
  subscription_id: string
  stripe_invoice_id?: string
  amount: number
  status: 'paid' | 'failed' | 'pending'
  paid_at?: string
  created_at: string
}

// 管理者ユーザーの型定義
export interface AdminUser {
  id: string
  username: string
  email: string
  password_hash: string
  role: 'admin' | 'super_admin'
  is_active: boolean
  created_at: string
  updated_at: string
}

// 拡張されたStore型（サブスクリプション情報付き）
export interface StoreWithSubscription extends Store {
  subscription?: Subscription & {
    plan?: SubscriptionPlan
  }
} 