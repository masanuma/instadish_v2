import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '認証トークンがありません' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // セッションを削除
    const { error } = await supabase
      .from('admin_sessions')
      .delete()
      .eq('token', token)

    if (error) {
      console.error('セッション削除エラー:', error)
      return NextResponse.json(
        { error: 'ログアウトに失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'ログアウトしました'
    })

  } catch (error) {
    console.error('管理者ログアウトエラー:', error)
    return NextResponse.json(
      { error: 'ログアウトに失敗しました' },
      { status: 500 }
    )
  }
} 