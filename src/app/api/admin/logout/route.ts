import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 環境変数チェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function POST(request: NextRequest) {
  try {
    // 環境変数チェック
    if (!supabase) {
      return NextResponse.json(
        { error: '環境変数が設定されていません' },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '認証トークンがありません' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // セッションを削除
    const { error } = await supabase!
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