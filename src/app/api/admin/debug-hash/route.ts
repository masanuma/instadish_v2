import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
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
      const { data: admin, error } = await supabase
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

      const { data, error } = await supabase
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