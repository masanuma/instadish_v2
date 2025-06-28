import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe'
import { updateSubscriptionFromWebhook } from '@/lib/subscription'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Webhook署名がありません' }, { status: 400 })
    }

    // Webhookイベントを検証
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error('Webhook署名検証エラー:', err)
      return NextResponse.json({ error: 'Webhook署名が無効です' }, { status: 400 })
    }

    // イベント処理
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as any)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as any)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as any)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as any)
        break

      default:
        console.log(`未処理のイベントタイプ: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook処理エラー:', error)
    return NextResponse.json(
      { error: 'Webhook処理に失敗しました' },
      { status: 500 }
    )
  }
}

// サブスクリプション更新処理
async function handleSubscriptionUpdate(subscription: any) {
  try {
    const status = subscription.status
    const currentPeriodStart = new Date(subscription.current_period_start * 1000)
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
    
    let trialStart, trialEnd
    if (subscription.trial_start && subscription.trial_end) {
      trialStart = new Date(subscription.trial_start * 1000)
      trialEnd = new Date(subscription.trial_end * 1000)
    }

    await updateSubscriptionFromWebhook(
      subscription.id,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      trialStart,
      trialEnd
    )

    console.log(`サブスクリプション更新: ${subscription.id} - ${status}`)
  } catch (error) {
    console.error('サブスクリプション更新処理エラー:', error)
  }
}

// サブスクリプションキャンセル処理
async function handleSubscriptionCanceled(subscription: any) {
  try {
    await supabase
      .from('subscriptions')
      .update({ 
        status: 'canceled',
        cancel_at_period_end: true
      })
      .eq('stripe_subscription_id', subscription.id)

    console.log(`サブスクリプションキャンセル: ${subscription.id}`)
  } catch (error) {
    console.error('サブスクリプションキャンセル処理エラー:', error)
  }
}

// 支払い成功処理
async function handlePaymentSucceeded(invoice: any) {
  try {
    const subscriptionId = invoice.subscription
    
    // サブスクリプション情報を取得
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (subscription) {
      // 支払い履歴に記録
      await supabase
        .from('payment_history')
        .insert({
          subscription_id: subscription.id,
          stripe_invoice_id: invoice.id,
          amount: invoice.amount_paid,
          status: 'paid',
          paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        })
    }

    console.log(`支払い成功: ${invoice.id}`)
  } catch (error) {
    console.error('支払い成功処理エラー:', error)
  }
}

// 支払い失敗処理
async function handlePaymentFailed(invoice: any) {
  try {
    const subscriptionId = invoice.subscription
    
    // サブスクリプション情報を取得
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (subscription) {
      // 支払い履歴に記録
      await supabase
        .from('payment_history')
        .insert({
          subscription_id: subscription.id,
          stripe_invoice_id: invoice.id,
          amount: invoice.amount_due,
          status: 'failed'
        })

      // サブスクリプションステータスを更新
      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_subscription_id', subscriptionId)
    }

    console.log(`支払い失敗: ${invoice.id}`)
  } catch (error) {
    console.error('支払い失敗処理エラー:', error)
  }
} 