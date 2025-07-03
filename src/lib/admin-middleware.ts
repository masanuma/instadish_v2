import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

export async function validateAdminToken(request: NextRequest): Promise<{ isValid: boolean; admin?: any; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isValid: false, error: '認証トークンがありません' }
    }

    const token = authHeader.substring(7)

    // JWTトークンを検証
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (jwtError) {
      return { isValid: false, error: '無効なトークンです' }
    }

    if (decoded.type !== 'admin') {
      return { isValid: false, error: '管理者トークンではありません' }
    }

    // データベースでセッションを確認
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !session) {
      return { isValid: false, error: 'セッションが無効です' }
    }

    // 管理者情報を取得
    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', session.admin_id)
      .eq('is_active', true)
      .single()

    if (adminError || !admin) {
      return { isValid: false, error: '管理者が見つかりません' }
    }

    return { isValid: true, admin }

  } catch (error) {
    console.error('管理者トークン検証エラー:', error)
    return { isValid: false, error: '認証エラーが発生しました' }
  }
}

export function createAdminMiddleware(handler: Function) {
  return async (request: NextRequest) => {
    const validation = await validateAdminToken(request)
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || '認証が必要です' },
        { status: 401 }
      )
    }

    // リクエストに管理者情報を追加
    const requestWithAdmin = request.clone()
    ;(requestWithAdmin as any).admin = validation.admin

    return handler(requestWithAdmin)
  }
} 