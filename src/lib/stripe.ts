import Stripe from 'stripe'

// サーバーサイド用Stripeクライアント
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

// クライアントサイド用Stripe設定
export const getStripePublicKey = () => {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
}

// 価格設定（日本円）
export const PRICES = {
  BASIC_MONTHLY: 5000, // 月額5,000円
}

// 無料トライアル期間（日数）
export const FREE_TRIAL_DAYS = 14

// Stripeの製品・価格ID（実際のStripeダッシュボードで設定後に更新）
export const STRIPE_PRODUCT_IDS = {
  BASIC_PLAN: 'prod_SZJwAexyi9FVQg',
}

export const STRIPE_PRICE_IDS = {
  BASIC_MONTHLY: 'price_1ReBIuFaHkt2FbdwJgctzXU1',
}

// Webhookエンドポイントシークレット
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

// サブスクリプション作成
export async function createSubscription(
  customerId: string,
  priceId: string,
  trialPeriodDays?: number
) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: priceId,
      }],
      trial_period_days: trialPeriodDays,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    return subscription
  } catch (error) {
    console.error('サブスクリプション作成エラー:', error)
    throw error
  }
}

// 顧客作成
export async function createCustomer(email: string, name: string, storeCode: string) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        store_code: storeCode,
      },
    })

    return customer
  } catch (error) {
    console.error('顧客作成エラー:', error)
    throw error
  }
}

// サブスクリプション取得
export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'customer'],
    })

    return subscription
  } catch (error) {
    console.error('サブスクリプション取得エラー:', error)
    throw error
  }
}

// サブスクリプションキャンセル
export async function cancelSubscription(subscriptionId: string, atPeriodEnd = true) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: atPeriodEnd,
    })

    return subscription
  } catch (error) {
    console.error('サブスクリプションキャンセルエラー:', error)
    throw error
  }
}

// 支払い方法の設定URL取得
export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return session
  } catch (error) {
    console.error('請求ポータルセッション作成エラー:', error)
    throw error
  }
} 