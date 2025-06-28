import { supabase, Store, Subscription, SubscriptionPlan, StoreWithSubscription } from './supabase'
import { createCustomer, createSubscription, getSubscription, STRIPE_PRICE_IDS, FREE_TRIAL_DAYS } from './stripe'

// サブスクリプションステータスチェック
export async function checkSubscriptionStatus(storeId: string): Promise<{
  isActive: boolean
  isTrialing: boolean
  daysLeft?: number
  subscription?: Subscription
}> {
  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('store_id', storeId)
      .single()

    if (error || !subscription) {
      return { isActive: false, isTrialing: false }
    }

    const now = new Date()
    const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null

    // トライアル中かチェック
    const isTrialing = Boolean(subscription.status === 'trialing' && trialEnd && trialEnd > now)

    // アクティブかチェック
    const isActive = ['active', 'trialing'].includes(subscription.status) && 
                    Boolean(currentPeriodEnd && currentPeriodEnd > now)

    // 残り日数計算
    let daysLeft: number | undefined
    if (isTrialing && trialEnd) {
      daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    } else if (isActive && currentPeriodEnd) {
      daysLeft = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    return {
      isActive,
      isTrialing,
      daysLeft,
      subscription
    }
  } catch (error) {
    console.error('サブスクリプション状況チェックエラー:', error)
    return { isActive: false, isTrialing: false }
  }
}

// 新規サブスクリプション作成
export async function createNewSubscription(
  storeId: string,
  email: string,
  storeName: string,
  storeCode: string,
  planId: string
): Promise<{ success: boolean; subscriptionId?: string; clientSecret?: string; error?: string }> {
  try {
    // プラン情報取得
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return { success: false, error: 'プランが見つかりません' }
    }

    // Stripe顧客作成
    const customer = await createCustomer(email, storeName, storeCode)

    // 店舗にStripe顧客IDを保存
    await supabase
      .from('stores')
      .update({ 
        stripe_customer_id: customer.id,
        email: email 
      })
      .eq('id', storeId)

    // Stripeサブスクリプション作成（2週間無料トライアル付き）
    const stripeSubscription = await createSubscription(
      customer.id,
      plan.stripe_price_id,
      FREE_TRIAL_DAYS
    )

    // データベースにサブスクリプション情報保存
    const trialStart = new Date()
    const trialEnd = new Date(trialStart.getTime() + (FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000))

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        store_id: storeId,
        plan_id: planId,
        stripe_subscription_id: stripeSubscription.id,
        status: 'trialing',
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
        current_period_start: trialStart.toISOString(),
        current_period_end: trialEnd.toISOString()
      })
      .select()
      .single()

    if (subError) {
      return { success: false, error: 'サブスクリプション保存エラー' }
    }

    // Payment Intentのclient_secretを取得
    const latestInvoice = stripeSubscription.latest_invoice as any
    const clientSecret = latestInvoice?.payment_intent?.client_secret

    return {
      success: true,
      subscriptionId: subscription.id,
      clientSecret
    }

  } catch (error) {
    console.error('サブスクリプション作成エラー:', error)
    return { success: false, error: 'サブスクリプション作成に失敗しました' }
  }
}

// サブスクリプション情報付きの店舗情報取得
export async function getStoreWithSubscription(storeId: string): Promise<StoreWithSubscription | null> {
  try {
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single()

    if (storeError || !store) {
      return null
    }

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('store_id', storeId)
      .single()

    if (subError) {
      // サブスクリプションがない場合も正常とする
      return store as StoreWithSubscription
    }

    return {
      ...store,
      subscription: {
        ...subscription,
        plan: subscription.subscription_plans
      }
    } as StoreWithSubscription

  } catch (error) {
    console.error('店舗・サブスクリプション情報取得エラー:', error)
    return null
  }
}

// 利用可能なプラン一覧取得
export async function getAvailablePlans(): Promise<SubscriptionPlan[]> {
  try {
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true })

    if (error) {
      console.error('プラン取得エラー:', error)
      return []
    }

    return plans || []
  } catch (error) {
    console.error('プラン取得エラー:', error)
    return []
  }
}

// サブスクリプション更新（Webhookから呼び出し）
export async function updateSubscriptionFromWebhook(
  stripeSubscriptionId: string,
  status: string,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  trialStart?: Date,
  trialEnd?: Date
): Promise<void> {
  try {
    const updateData: any = {
      status,
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString()
    }

    if (trialStart && trialEnd) {
      updateData.trial_start = trialStart.toISOString()
      updateData.trial_end = trialEnd.toISOString()
    }

    await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('stripe_subscription_id', stripeSubscriptionId)

  } catch (error) {
    console.error('サブスクリプション更新エラー:', error)
    throw error
  }
} 