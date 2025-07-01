import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin, createAdminSession } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'ユーザー名とパスワードを入力してください' },
        { status: 400 }
      )
    }

    // 管理者認証
    const admin = await authenticateAdmin(username, password)
    if (!admin) {
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // セッション作成
    const token = await createAdminSession(admin.id)
    if (!token) {
      return NextResponse.json(
        { error: 'セッションの作成に失敗しました' },
        { status: 500 }
      )
    }

    // レスポンスでCookieとトークンを設定
    const response = NextResponse.json({
      success: true,
      token: token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    })

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24時間
    })

    return response
  } catch (error) {
    console.error('管理者ログインエラー:', error)
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    )
  }
} 