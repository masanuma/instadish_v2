import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 管理者システムデバッグ開始')
    
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      tables: {},
      errors: []
    }
    
    // admin_usersテーブルの存在確認
    try {
      const { data: adminUsers, error: adminError } = await supabaseAdmin
        .from('admin_users')
        .select('id, username, email, is_active, created_at')
        .limit(10)
      
      debugInfo.tables.admin_users = {
        exists: !adminError,
        count: adminUsers?.length || 0,
        data: adminUsers,
        error: adminError
      }
    } catch (error) {
      debugInfo.errors.push({ table: 'admin_users', error: String(error) })
    }
    
    // admin_sessionsテーブルの存在確認
    try {
      const { data: sessions, error: sessionError } = await supabaseAdmin
        .from('admin_sessions')
        .select('id, admin_id, expires_at, created_at')
        .limit(10)
      
      debugInfo.tables.admin_sessions = {
        exists: !sessionError,
        count: sessions?.length || 0,
        data: sessions,
        error: sessionError
      }
    } catch (error) {
      debugInfo.errors.push({ table: 'admin_sessions', error: String(error) })
    }
    
    // usersテーブル（通常店舗用）の確認
    try {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, name, email, created_at')
        .limit(5)
      
      debugInfo.tables.users = {
        exists: !usersError,
        count: users?.length || 0,
        data: users,
        error: usersError
      }
    } catch (error) {
      debugInfo.errors.push({ table: 'users', error: String(error) })
    }
    
    // storesテーブルの確認
    try {
      const { data: stores, error: storesError } = await supabaseAdmin
        .from('stores')
        .select('id, name, store_code, email, created_at')
        .limit(5)
      
      debugInfo.tables.stores = {
        exists: !storesError,
        count: stores?.length || 0,
        data: stores,
        error: storesError
      }
    } catch (error) {
      debugInfo.errors.push({ table: 'stores', error: String(error) })
    }
    
    // 環境変数チェック
    debugInfo.environment = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV
    }
    
    return NextResponse.json({
      success: true,
      debug: debugInfo
    })
    
  } catch (error) {
    console.error('❌ デバッグAPI実行エラー:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'デバッグ実行に失敗しました', 
        details: String(error) 
      },
      { status: 500 }
    )
  }
} 