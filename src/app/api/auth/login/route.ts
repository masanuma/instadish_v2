import { NextRequest, NextResponse } from 'next/server'
import { authenticateStore, createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { storeCode, password } = await request.json()

    if (!storeCode || !password) {
      return NextResponse.json(
        { error: '店舗コードとパスワードを入力してください' },
        { status: 400 }
      )
    }

    // 店舗認証
    const store = await authenticateStore(storeCode, password)
    if (!store) {
      return NextResponse.json(
        { error: '店舗コードまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // セッション作成
    const token = await createSession(store.id)
    if (!token) {
      return NextResponse.json(
        { error: 'セッションの作成に失敗しました' },
        { status: 500 }
      )
    }

    // レスポンスでCookieとトークンを設定
    const response = NextResponse.json({
      success: true,
      token: token, // フロントエンド用にトークンを追加
      store: {
        id: store.id,
        name: store.name,
        storeCode: store.store_code
      }
    })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24時間
    })

    return response
  } catch (error) {
    console.error('ログインエラー:', error)
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    )
  }
} 