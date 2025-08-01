import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
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

    const { action, password, hash } = await request.json()

    if (action === 'generate') {
      // ハッシュ生成
      const saltRounds = 10
      const generatedHash = await bcrypt.hash(password, saltRounds)
      
      return NextResponse.json({
        success: true,
        password,
        generatedHash,
        saltRounds
      })
    }

    if (action === 'verify') {
      // ハッシュ検証
      const isValid = await bcrypt.compare(password, hash)
      
      return NextResponse.json({
        success: true,
        password,
        hash,
        isValid
      })
    }

    if (action === 'check-db') {
      // DBのハッシュ値を確認
      const { data: admin, error } = await supabase!
        .from('admin_users')
        .select('username, password_hash, is_active')
        .eq('username', 'admin')
        .single()

      if (error) {
        return NextResponse.json({
          success: false,
          error: error.message
        })
      }

      // パスワード検証テスト
      const testPassword = 'admin123'
      const isValid = await bcrypt.compare(testPassword, admin.password_hash)

      return NextResponse.json({
        success: true,
        admin,
        testPassword,
        isValid
      })
    }

    if (action === 'update-db') {
      // DBのハッシュ値を更新
      const newPassword = 'admin123'
      const saltRounds = 10
      const newHash = await bcrypt.hash(newPassword, saltRounds)

      const { data, error } = await supabase!
        .from('admin_users')
        .update({ password_hash: newHash })
        .eq('username', 'admin')
        .select()

      if (error) {
        return NextResponse.json({
          success: false,
          error: error.message
        })
      }

      return NextResponse.json({
        success: true,
        message: 'パスワードハッシュを更新しました',
        newHash,
        data
      })
    }

    return NextResponse.json(
      { error: '無効なアクションです' },
      { status: 400 }
    )

  } catch (error) {
    console.error('デバッグハッシュAPIエラー:', error)
    return NextResponse.json(
      { error: '内部エラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const jwtSecret = process.env.JWT_SECRET
  const adminJwtSecret = process.env.ADMIN_JWT_SECRET
  
  return NextResponse.json({
    jwtSecret: jwtSecret ? `存在 (長さ: ${jwtSecret.length})` : '未設定',
    adminJwtSecret: adminJwtSecret ? `存在 (長さ: ${adminJwtSecret.length})` : '未設定',
    jwtSecretStart: jwtSecret ? jwtSecret.substring(0, 10) + '...' : 'なし',
    adminJwtSecretStart: adminJwtSecret ? adminJwtSecret.substring(0, 10) + '...' : 'なし'
  })
} 