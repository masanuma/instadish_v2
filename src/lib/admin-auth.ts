import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from './supabase'

const JWT_SECRET = process.env.JWT_SECRET!
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24時間

// 管理者の型定義
export interface AdminUser {
  id: string
  username: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 管理者セッションの型定義
export interface AdminSession {
  id: string
  admin_id: string
  token: string
  expires_at: string
  created_at: string
}

// 管理者認証
export async function authenticateAdmin(username: string, password: string): Promise<AdminUser | null> {
  try {
    const { data: admin, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single()

    if (error || !admin) {
      return null
    }

    const isValidPassword = await bcrypt.compare(password, admin.password_hash)
    if (!isValidPassword) {
      return null
    }

    return admin
  } catch (error) {
    console.error('管理者認証エラー:', error)
    return null
  }
}

// 管理者セッション作成
export async function createAdminSession(adminId: string): Promise<string | null> {
  try {
    const token = generateAdminToken(adminId)
    const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString()

    const { error } = await supabaseAdmin
      .from('admin_sessions')
      .insert({
        admin_id: adminId,
        token,
        expires_at: expiresAt
      })

    if (error) {
      console.error('管理者セッション作成エラー:', error)
      return null
    }

    return token
  } catch (error) {
    console.error('管理者セッション作成エラー:', error)
    return null
  }
}

// 管理者セッション検証
export async function validateAdminSession(token: string): Promise<AdminUser | null> {
  try {
    console.log('管理者セッション検証開始:', { tokenStart: token.substring(0, 50) + '...' })
    
    // JWTトークンを検証
    const decoded = verifyAdminToken(token)
    console.log('JWT検証結果:', decoded ? 'OK' : 'NG')
    if (!decoded) {
      return null
    }

    // データベースでセッションを確認
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('admin_sessions')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    console.log('セッションDB検索結果:', { session: session ? 'あり' : 'なし', error: sessionError })
    if (sessionError || !session) {
      return null
    }

    // 管理者情報を取得
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('id', session.admin_id)
      .eq('is_active', true)
      .single()

    console.log('管理者情報取得結果:', { admin: admin ? admin.username : 'なし', error: adminError })
    if (adminError || !admin) {
      return null
    }

    return admin
  } catch (error) {
    console.error('管理者セッション検証エラー:', error)
    return null
  }
}

// 管理者セッション削除
export async function destroyAdminSession(token: string): Promise<void> {
  try {
    await supabaseAdmin
      .from('admin_sessions')
      .delete()
      .eq('token', token)
  } catch (error) {
    console.error('管理者セッション削除エラー:', error)
  }
}

// 管理者JWTトークン生成
function generateAdminToken(adminId: string): string {
  const payload = {
    adminId,
    type: 'admin',
    exp: Math.floor(Date.now() / 1000) + (SESSION_DURATION / 1000)
  }
  return jwt.sign(payload, JWT_SECRET)
}

// 管理者JWTトークン検証
function verifyAdminToken(token: string): { adminId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string; type: string }
    if (decoded.type !== 'admin') {
      return null
    }
    return { adminId: decoded.adminId }
  } catch (error) {
    return null
  }
}

// 期限切れ管理者セッションを削除
export async function cleanupExpiredAdminSessions(): Promise<void> {
  try {
    await supabaseAdmin
      .from('admin_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())
  } catch (error) {
    console.error('期限切れ管理者セッション削除エラー:', error)
  }
} 