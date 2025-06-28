import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { createNewSubscription, getAvailablePlans } from '@/lib/subscription'

export async function POST(request: NextRequest) {
  try {
    // 認証確認
    const authHeader = request.headers.get('authorization')
    console.log('認証ヘッダー:', authHeader)
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('認証ヘッダーが不正:', authHeader)
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    console.log('トークン:', token ? 'あり' : 'なし')
    
    const store = await validateSession(token)
    console.log('店舗情報:', store ? store.name : 'なし')
    
    if (!store) {
      console.log('セッション検証失敗')
      return NextResponse.json({ error: '無効なセッションです' }, { status: 401 })
    }

    // リクエストボディ取得
    const body = await request.json()
    const { email, planId } = body

    if (!email || !planId) {
      return NextResponse.json({ 
        error: 'メールアドレスとプランIDが必要です' 
      }, { status: 400 })
    }

    // メール形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: '有効なメールアドレスを入力してください' 
      }, { status: 400 })
    }

    // サブスクリプション作成
    const result = await createNewSubscription(
      store.id,
      email,
      store.name,
      store.store_code,
      planId
    )

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'サブスクリプション作成に失敗しました' 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      subscriptionId: result.subscriptionId,
      clientSecret: result.clientSecret,
      message: '2週間の無料トライアルが開始されました！'
    })

  } catch (error) {
    console.error('サブスクリプション作成エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 利用可能なプラン一覧取得
export async function GET(request: NextRequest) {
  try {
    const plans = await getAvailablePlans()
    
    return NextResponse.json({
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price_monthly,
        features: plan.features
      }))
    })

  } catch (error) {
    console.error('プラン一覧取得エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
} 