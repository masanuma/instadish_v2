import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 管理者パスワードリセットAPI実行開始')
    
    // セキュリティ：特別なリセットトークンを確認
    const { resetToken } = await request.json()
    const RESET_TOKEN = 'InstaDish_Admin_Reset_2025'
    
    if (resetToken !== RESET_TOKEN) {
      return NextResponse.json(
        { error: '無効なリセットトークンです' },
        { status: 401 }
      )
    }
    
    // 新しいパスワード
    const newPassword = 'admin123'
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    console.log('🔐 パスワードハッシュ生成完了')
    
    // 管理者ユーザーを確認
    const { data: existingAdmins, error: listError } = await supabaseAdmin
      .from('admin_users')
      .select('id, username, is_active')
    
    console.log('👥 既存の管理者ユーザー確認:', existingAdmins)
    
    if (listError) {
      console.error('❌ 管理者ユーザー取得エラー:', listError)
      return NextResponse.json(
        { error: '管理者ユーザー取得に失敗しました', details: listError },
        { status: 500 }
      )
    }
    
    // admin ユーザーが存在するかチェック
    const adminUser = existingAdmins?.find(user => user.username === 'admin')
    
    if (adminUser) {
      // 既存のadminユーザーのパスワードを更新
      console.log('🔄 既存のadminユーザーのパスワードを更新中...')
      
      const { data, error } = await supabaseAdmin
        .from('admin_users')
        .update({ 
          password_hash: hashedPassword,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('username', 'admin')
        .select()
      
      if (error) {
        console.error('❌ パスワード更新エラー:', error)
        return NextResponse.json(
          { error: 'パスワード更新に失敗しました', details: error },
          { status: 500 }
        )
      }
      
      console.log('✅ 管理者パスワード更新完了:', data)
      
    } else {
      // adminユーザーが存在しない場合は新規作成
      console.log('🆕 新規adminユーザーを作成中...')
      
      const { data, error } = await supabaseAdmin
        .from('admin_users')
        .insert({
          username: 'admin',
          email: 'admin@instadish.com',
          password_hash: hashedPassword,
          role: 'super_admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (error) {
        console.error('❌ 管理者ユーザー作成エラー:', error)
        return NextResponse.json(
          { error: '管理者ユーザー作成に失敗しました', details: error },
          { status: 500 }
        )
      }
      
      console.log('✅ 新規管理者ユーザー作成完了:', data)
    }
    
    // 既存のセッションを全てクリア
    console.log('🧹 既存セッションをクリア中...')
    const { error: sessionError } = await supabaseAdmin
      .from('admin_sessions')
      .delete()
      .neq('id', 'dummy') // 全削除用のダミー条件
    
    if (sessionError) {
      console.warn('⚠️ セッションクリアエラー（継続可能）:', sessionError)
    } else {
      console.log('✅ 既存セッションをクリアしました')
    }
    
    return NextResponse.json({
      success: true,
      message: '管理者パスワードがリセットされました',
      credentials: {
        username: 'admin',
        password: 'admin123',
        loginUrl: '/admin/login'
      }
    })
    
  } catch (error) {
    console.error('❌ 管理者パスワードリセットエラー:', error)
    return NextResponse.json(
      { error: 'リセット処理に失敗しました', details: error },
      { status: 500 }
    )
  }
} 