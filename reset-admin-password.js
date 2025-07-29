const bcrypt = require('bcryptjs')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// 環境変数の確認
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '設定済み' : '未設定')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetAdminPassword() {
  try {
    console.log('🔑 管理者パスワードリセット開始...')
    
    // 新しいパスワード
    const newPassword = 'admin123'
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    console.log('🔐 パスワードハッシュ生成完了')
    
    // 管理者ユーザーを確認
    const { data: existingAdmins, error: listError } = await supabase
      .from('admin_users')
      .select('id, username, is_active')
    
    console.log('👥 既存の管理者ユーザー:', existingAdmins)
    
    if (listError) {
      console.error('❌ 管理者ユーザー取得エラー:', listError)
      return
    }
    
    // admin ユーザーが存在するかチェック
    const adminUser = existingAdmins?.find(user => user.username === 'admin')
    
    if (adminUser) {
      // 既存のadminユーザーのパスワードを更新
      console.log('🔄 既存のadminユーザーのパスワードを更新中...')
      
      const { data, error } = await supabase
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
        return
      }
      
      console.log('✅ 管理者パスワード更新完了:', data)
      
    } else {
      // adminユーザーが存在しない場合は新規作成
      console.log('🆕 新規adminユーザーを作成中...')
      
      const { data, error } = await supabase
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
        return
      }
      
      console.log('✅ 新規管理者ユーザー作成完了:', data)
    }
    
    // 既存のセッションを全てクリア
    console.log('🧹 既存セッションをクリア中...')
    const { error: sessionError } = await supabase
      .from('admin_sessions')
      .delete()
      .neq('id', 'dummy') // 全削除用のダミー条件
    
    if (sessionError) {
      console.warn('⚠️ セッションクリアエラー（継続可能）:', sessionError)
    } else {
      console.log('✅ 既存セッションをクリアしました')
    }
    
    console.log('')
    console.log('🎉 管理者パスワードリセット完了！')
    console.log('📝 ログイン情報:')
    console.log('   ユーザー名: admin')
    console.log('   パスワード: admin123')
    console.log('   URL: http://localhost:3002/admin/login')
    console.log('')
    
  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error)
  }
}

// スクリプト実行
resetAdminPassword() 