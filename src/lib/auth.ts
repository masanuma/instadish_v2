import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase, Store, AuthSession } from './supabase'

<<<<<<< HEAD
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here'
=======
const JWT_SECRET = process.env.JWT_SECRET!
>>>>>>> master
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24時間

// パスワードをハッシュ化
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

// パスワードを検証
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// JWTトークンを生成
export function generateToken(storeId: string): string {
  const payload = {
    storeId,
    exp: Math.floor(Date.now() / 1000) + (SESSION_DURATION / 1000)
  }
  return jwt.sign(payload, JWT_SECRET)
}

// JWTトークンを検証
export function verifyToken(token: string): { storeId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { storeId: string }
    return decoded
  } catch (error) {
    return null
  }
}

// 店舗コードとパスワードで認証
export async function authenticateStore(storeCode: string, password: string): Promise<Store | null> {
  try {
    const { data: store, error } = await supabase
      .from('stores')
      .select('*')
      .eq('store_code', storeCode)
      .single()

    if (error || !store) {
      return null
    }

    const isValidPassword = await verifyPassword(password, store.password_hash)
    if (!isValidPassword) {
      return null
    }

    return store
  } catch (error) {
    console.error('認証エラー:', error)
    return null
  }
}

// セッションを作成
export async function createSession(storeId: string): Promise<string | null> {
  try {
    const token = generateToken(storeId)
    const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString()

    const { error } = await supabase
      .from('auth_sessions')
      .insert({
        store_id: storeId,
        token,
        expires_at: expiresAt
      })

    if (error) {
      console.error('セッション作成エラー:', error)
      return null
    }

    return token
  } catch (error) {
    console.error('セッション作成エラー:', error)
    return null
  }
}

// セッションを検証
export async function validateSession(token: string): Promise<Store | null> {
  try {
    console.log('セッション検証開始:', token ? 'トークンあり' : 'トークンなし')
    
    // JWTトークンを検証
    const decoded = verifyToken(token)
    console.log('JWT検証結果:', decoded ? 'OK' : 'NG')
    if (!decoded) {
      return null
    }

    // データベースでセッションを確認
    const { data: session, error: sessionError } = await supabase
      .from('auth_sessions')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    console.log('セッション検索結果:', session ? 'あり' : 'なし', sessionError)
    if (sessionError || !session) {
      return null
    }

    // 店舗情報を取得
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', session.store_id)
      .single()

    console.log('店舗情報取得結果:', store ? store.name : 'なし', storeError)
    if (storeError || !store) {
      return null
    }

    return store
  } catch (error) {
    console.error('セッション検証エラー:', error)
    return null
  }
}

// セッションを削除（ログアウト）
export async function destroySession(token: string): Promise<void> {
  try {
    await supabase
      .from('auth_sessions')
      .delete()
      .eq('token', token)
  } catch (error) {
    console.error('セッション削除エラー:', error)
  }
}

// 期限切れセッションを削除
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await supabase
      .from('auth_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())
  } catch (error) {
    console.error('期限切れセッション削除エラー:', error)
  }
} 