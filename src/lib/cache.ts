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

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

// キャッシュから結果を取得
export async function getCachedResult(
  imageHash: string, 
  businessType: string, 
  effectStrength: string
): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('ai_processing_cache')
      .select('*')
      .eq('image_hash', imageHash)
      .eq('business_type', businessType)
      .eq('effect_strength', effectStrength)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      return null
    }

    return data.result
  } catch (error) {
    console.error('キャッシュ取得エラー:', error)
    return null
  }
}

// 結果をキャッシュに保存
export async function cacheResult(
  imageHash: string,
  businessType: string,
  effectStrength: string,
  result: any
): Promise<void> {
  try {
    // 24時間後に期限切れ
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const { error } = await supabase
      .from('ai_processing_cache')
      .upsert({
        image_hash: imageHash,
        business_type: businessType,
        effect_strength: effectStrength,
        result: result,
        expires_at: expiresAt.toISOString()
      })

    if (error) {
      console.error('キャッシュ保存エラー:', error)
    }
  } catch (error) {
    console.error('キャッシュ保存エラー:', error)
  }
}

// 古いキャッシュエントリを削除
export async function cleanupExpiredCache(): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_processing_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) {
      console.error('キャッシュクリーンアップエラー:', error)
    }
  } catch (error) {
    console.error('キャッシュクリーンアップエラー:', error)
  }
} 