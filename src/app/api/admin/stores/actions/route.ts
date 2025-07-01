import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { supabase } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    // 管理者認証確認
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const admin = await validateAdminSession(token)
    
    if (!admin) {
      return NextResponse.json({ error: '無効なセッションです' }, { status: 401 })
    }

    const { storeId, action, value } = await request.json()

    if (!storeId || !action) {
      return NextResponse.json({ error: '店舗IDとアクションが必要です' }, { status: 400 })
    }

    switch (action) {
      case 'extend_trial':
        return await extendTrial(storeId, value)
      
      case 'cancel_subscription':
        return await cancelSubscription(storeId)
      
      case 'activate_subscription':
        return await activateSubscription(storeId)
      
      case 'update_store':
        return await updateStore(storeId, value)
      
      default:
        return NextResponse.json({ error: '無効なアクションです' }, { status: 400 })
    }

  } catch (error) {
    console.error('管理者店舗操作エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 無料期間延長
async function extendTrial(storeId: string, days: number) {
  try {
    // 現在のサブスクリプションを取得
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('store_id', storeId)
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: 'サブスクリプションが見つかりません' }, { status: 404 })
    }

    // 新しい終了日を計算
    const currentEnd = subscription.trial_end ? new Date(subscription.trial_end) : new Date()
    const newEnd = new Date(currentEnd.getTime() + (days * 24 * 60 * 60 * 1000))

    // データベースを更新
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        trial_end: newEnd.toISOString(),
        current_period_end: newEnd.toISOString()
      })
      .eq('id', subscription.id)

    if (updateError) {
      return NextResponse.json({ error: '無料期間延長に失敗しました' }, { status: 500 })
    }

    // Stripeのサブスクリプションも更新（存在する場合）
    if (subscription.stripe_subscription_id) {
      try {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          trial_end: Math.floor(newEnd.getTime() / 1000)
        })
      } catch (stripeError) {
        console.error('Stripe更新エラー:', stripeError)
        // Stripeエラーは無視して続行
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${days}日間の無料期間を延長しました` 
    })

  } catch (error) {
    console.error('無料期間延長エラー:', error)
    return NextResponse.json({ error: '無料期間延長に失敗しました' }, { status: 500 })
  }
}

// サブスクリプション停止
async function cancelSubscription(storeId: string) {
  try {
    // 現在のサブスクリプションを取得
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('store_id', storeId)
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: 'サブスクリプションが見つかりません' }, { status: 404 })
    }

    // データベースを更新
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: true
      })
      .eq('id', subscription.id)

    if (updateError) {
      return NextResponse.json({ error: 'サブスクリプション停止に失敗しました' }, { status: 500 })
    }

    // Stripeのサブスクリプションも停止（存在する場合）
    if (subscription.stripe_subscription_id) {
      try {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true
        })
      } catch (stripeError) {
        console.error('Stripe停止エラー:', stripeError)
        // Stripeエラーは無視して続行
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'サブスクリプションを停止しました' 
    })

  } catch (error) {
    console.error('サブスクリプション停止エラー:', error)
    return NextResponse.json({ error: 'サブスクリプション停止に失敗しました' }, { status: 500 })
  }
}

// サブスクリプション再開
async function activateSubscription(storeId: string) {
  try {
    // 現在のサブスクリプションを取得
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('store_id', storeId)
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: 'サブスクリプションが見つかりません' }, { status: 404 })
    }

    // データベースを更新
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        cancel_at_period_end: false
      })
      .eq('id', subscription.id)

    if (updateError) {
      return NextResponse.json({ error: 'サブスクリプション再開に失敗しました' }, { status: 500 })
    }

    // Stripeのサブスクリプションも再開（存在する場合）
    if (subscription.stripe_subscription_id) {
      try {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: false
        })
      } catch (stripeError) {
        console.error('Stripe再開エラー:', stripeError)
        // Stripeエラーは無視して続行
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'サブスクリプションを再開しました' 
    })

  } catch (error) {
    console.error('サブスクリプション再開エラー:', error)
    return NextResponse.json({ error: 'サブスクリプション再開に失敗しました' }, { status: 500 })
  }
}

// 店舗情報更新
async function updateStore(storeId: string, updateData: any) {
  try {
    // パスワードハッシュは除外
    const { password_hash, ...safeUpdateData } = updateData

    const { error: updateError } = await supabase
      .from('stores')
      .update(safeUpdateData)
      .eq('id', storeId)

    if (updateError) {
      return NextResponse.json({ error: '店舗情報更新に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: '店舗情報を更新しました' 
    })

  } catch (error) {
    console.error('店舗情報更新エラー:', error)
    return NextResponse.json({ error: '店舗情報更新に失敗しました' }, { status: 500 })
  }
} 