import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('=== 管理者ログインデバッグ開始 ===')
    
    // 環境変数チェック
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      jwtSecret: !!process.env.JWT_SECRET,
      supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    }
    console.log('環境変数チェック:', envCheck)

    // Supabase接続テスト
    try {
      const { data: connectionTest, error: connectionError } = await supabaseAdmin
        .from('admin_users')
        .select('count', { count: 'exact' })
      
      console.log('Supabase接続テスト:', { 
        success: !connectionError, 
        error: connectionError?.message,
        count: connectionTest 
      })
    } catch (connErr) {
      console.log('Supabase接続エラー:', connErr)
    }

    // admin_usersテーブルの全データ取得
    const { data: allAdmins, error: listError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
    
    console.log('全管理者ユーザー:', { 
      count: allAdmins?.length || 0, 
      error: listError?.message,
      users: allAdmins?.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        is_active: u.is_active,
        hash_length: u.password_hash?.length
      }))
    })

    // テストパスワード検証
    if (allAdmins && allAdmins.length > 0) {
      const admin = allAdmins[0]
      const testPassword = 'admin123'
      const isValid = await bcrypt.compare(testPassword, admin.password_hash)
      
      console.log('パスワード検証テスト:', {
        username: admin.username,
        testPassword,
        hashLength: admin.password_hash?.length,
        isValid,
        hashStart: admin.password_hash?.substring(0, 10) + '...'
      })
    }

    return NextResponse.json({
      success: true,
      envCheck,
      admins: allAdmins?.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        is_active: u.is_active,
        hash_length: u.password_hash?.length
      })),
      supabaseError: listError?.message
    })

  } catch (error) {
    console.error('デバッグエラー:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    console.log('=== POST デバッグログイン試行 ===')
    console.log('リクエスト:', { username, passwordLength: password?.length })

    // 管理者ユーザー検索
    const { data: admin, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single()

    console.log('ユーザー検索結果:', { 
      found: !!admin, 
      error: error?.message,
      adminInfo: admin ? {
        id: admin.id,
        username: admin.username,
        is_active: admin.is_active,
        hash_length: admin.password_hash?.length
      } : null
    })

    if (error || !admin) {
      return NextResponse.json({
        success: false,
        error: '管理者ユーザーが見つかりません',
        details: error?.message
      }, { status: 401 })
    }

    // パスワード検証
    const isValid = await bcrypt.compare(password, admin.password_hash)
    console.log('パスワード検証:', { isValid, passwordLength: password.length })

    return NextResponse.json({
      success: isValid,
      passwordValid: isValid,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    })

  } catch (error) {
    console.error('POSTデバッグエラー:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 