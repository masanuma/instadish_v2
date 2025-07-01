import { createClient } from '@supabase/supabase-js'

// キャッシュテーブルの型定義
interface CacheEntry {
  id: string
  image_hash: string
  business_type: string
  effect_strength: string
  result: any
  created_at: string
  expires_at: string
}

// Supabaseクライアントの初期化（本番接続）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prkmqzmramzdolmjsvmq.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya21xem1yYW16ZG9sbWpzdm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjY4MTMsImV4cCI6MjA2NjQ0MjgxM30.4vZTOPOJ1Z8VFr2qKr8wJZGQ1mDR5K2Xw8nQZGQ1mDR'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 画像のハッシュ値を生成（簡易版）
export function generateImageHash(imageData: string): string {
  // Base64画像データから簡易ハッシュを生成
  let hash = 0
  const str = imageData.substring(0, 1000) // 最初の1000文字のみ使用
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32bit整数に変換
  }
  
  return Math.abs(hash).toString(36)
}

// キャッシュから結果を取得（一時的に無効化）
export async function getCachedResult(
  imageHash: string, 
  businessType: string, 
  effectStrength: string
): Promise<any | null> {
  // 一時的にキャッシュ機能を無効化（Anon Keyの権限制限のため）
  console.log('キャッシュ機能は一時的に無効化されています')
  return null
}

// 結果をキャッシュに保存（一時的に無効化）
export async function cacheResult(
  imageHash: string,
  businessType: string,
  effectStrength: string,
  result: any
): Promise<void> {
  // 一時的にキャッシュ機能を無効化（Anon Keyの権限制限のため）
  console.log('キャッシュ保存機能は一時的に無効化されています')
}

// 古いキャッシュエントリを削除（一時的に無効化）
export async function cleanupExpiredCache(): Promise<void> {
  // 一時的にキャッシュ機能を無効化（Anon Keyの権限制限のため）
  console.log('キャッシュクリーンアップ機能は一時的に無効化されています')
} 