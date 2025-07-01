import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// Supabaseクライアントのimport（必要に応じてパスを調整）
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'ユーザー名とパスワードを入力してください' },
        { status: 400 }
      )
    }

    // 管理者ユーザーを取得
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single()
    if (error || !admin) {
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // パスワード検証
    const isValid = await bcrypt.compare(password, admin.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // JWTトークン生成（簡易例）
    // 本番ではセキュアな方法でトークンを生成・管理してください
    const token = 'dummy-admin-token'
    return NextResponse.json({ success: true, token })
  } catch (e) {
    return NextResponse.json({ error: 'ログインに失敗しました' }, { status: 500 })
  }
} 