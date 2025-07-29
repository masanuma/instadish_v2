import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // 管理者認証確認
    const authHeader = request.headers.get('authorization')
    console.log('管理者stores認証開始:', { authHeader: authHeader ? authHeader.substring(0, 30) + '...' : 'なし' })
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('認証ヘッダーが無効:', { authHeader })
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    console.log('トークン抽出:', { tokenStart: token.substring(0, 50) + '...' })
    
    const admin = await validateAdminSession(token)
    console.log('管理者検証結果:', { admin: admin ? admin.username : 'なし' })
    
    if (!admin) {
      return NextResponse.json({ error: '無効なセッションです' }, { status: 401 })
    }

    // 店舗一覧を取得（サブスクリプション情報も含む）
    // is_deletedカラムが存在しない場合に備えて条件を除去
    const { data: stores, error: storesError } = await supabaseAdmin
      .from('stores')
      .select(`
        *,
        subscriptions (
          id,
          status,
          trial_start,
          trial_end,
          current_period_start,
          current_period_end,
          cancel_at_period_end
        )
      `)
      .order('created_at', { ascending: false })

    if (storesError) {
      console.error('店舗取得エラー:', storesError)
      return NextResponse.json(
        { error: '店舗情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // 統計情報を計算
    const stats = {
      totalStores: stores.length,
      activeSubscriptions: 0,
      trialingStores: 0,
      canceledSubscriptions: 0
    }

    stores.forEach((store: any) => {
      const subscription = store.subscriptions?.[0]
      if (subscription) {
        if (subscription.status === 'active') {
          stats.activeSubscriptions++
        } else if (subscription.status === 'trialing') {
          stats.trialingStores++
        } else if (subscription.status === 'canceled') {
          stats.canceledSubscriptions++
        }
      }
    })

    // パスワードハッシュを除外して返す
    const storesWithoutPassword = stores.map((store: any) => {
      const { password_hash, ...storeData } = store
      return storeData
    })

    return NextResponse.json({
      stores: storesWithoutPassword,
      stats
    })

  } catch (error) {
    console.error('管理者店舗一覧取得エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
} 