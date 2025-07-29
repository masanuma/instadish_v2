import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { checkSubscriptionStatus } from '@/lib/subscription'

export async function GET(request: NextRequest) {
  try {
    // 認証確認
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const store = await validateSession(token)
    
    if (!store) {
      return NextResponse.json({ error: '無効なセッションです' }, { status: 401 })
    }

    // サブスクリプション状況チェック
    const subscriptionStatus = await checkSubscriptionStatus(store.id)

    return NextResponse.json({
      store: {
        id: store.id,
        name: store.name,
        store_code: store.store_code
      },
      subscription: subscriptionStatus
    })

  } catch (error) {
    console.error('サブスクリプション状況確認エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
} 