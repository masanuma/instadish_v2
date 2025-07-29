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

// メモリベースキャッシュの実装
interface MemoryCacheEntry {
  result: any
  timestamp: number
  accessCount: number
  lastAccessed: number
}

class MemoryCache {
  private cache: Map<string, MemoryCacheEntry> = new Map()
  private maxSize: number = 100  // 最大100エントリ
  private ttl: number = 30 * 60 * 1000  // 30分のTTL

  private generateKey(imageHash: string, businessType: string, effectStrength: string): string {
    return `${imageHash}_${businessType}_${effectStrength}`
  }

  get(imageHash: string, businessType: string, effectStrength: string): any | null {
    const key = this.generateKey(imageHash, businessType, effectStrength)
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    const now = Date.now()
    // TTLチェック
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    // アクセス情報を更新
    entry.accessCount++
    entry.lastAccessed = now
    
    console.log(`🚀 メモリキャッシュヒット: ${key}`)
    return entry.result
  }

  set(imageHash: string, businessType: string, effectStrength: string, result: any): void {
    const key = this.generateKey(imageHash, businessType, effectStrength)
    const now = Date.now()
    
    // キャッシュサイズ制限チェック
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }
    
    this.cache.set(key, {
      result,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    })
    
    console.log(`📦 メモリキャッシュ保存: ${key}`)
  }

  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()
    
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    })
    
    if (oldestKey) {
      this.cache.delete(oldestKey)
      console.log(`🗑️ キャッシュエビクション: ${oldestKey}`)
    }
  }

  getStats(): { size: number, maxSize: number, hitCount: number } {
    let hitCount = 0
    Array.from(this.cache.values()).forEach(entry => {
      hitCount += entry.accessCount
    })
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount
    }
  }

  clear(): void {
    this.cache.clear()
    console.log('🧹 メモリキャッシュクリア')
  }
}

// グローバルキャッシュインスタンス
const memoryCache = new MemoryCache()

// Supabaseクライアントの初期化（本番接続）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prkmqzmramzdolmjsvmq.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya21xem1yYW16ZG9sbWpzdm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjY4MTMsImV4cCI6MjA2NjQ0MjgxM30.4vZTOPOJ1Z8VFr2qKr8wJZGQ1mDR5K2Xw8nQZGQ1mDR'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 画像のハッシュ値を生成（改良版）
export function generateImageHash(imageData: string): string {
  // Base64画像データから改良ハッシュを生成
  let hash = 0
  const str = imageData.substring(0, 2000) // 最初の2000文字を使用（精度向上）
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32bit整数に変換
  }
  
  return Math.abs(hash).toString(36)
}

// キャッシュから結果を取得（メモリキャッシュ使用）
export async function getCachedResult(
  imageHash: string, 
  businessType: string, 
  effectStrength: string
): Promise<any | null> {
  try {
    // メモリキャッシュから検索
    const cachedResult = memoryCache.get(imageHash, businessType, effectStrength)
    if (cachedResult) {
      return cachedResult
    }
    
    // Supabaseは権限制限のため一時的に無効化
    console.log('Supabaseキャッシュは一時的に無効化されています')
    return null
  } catch (error) {
    console.error('キャッシュ取得エラー:', error)
    return null
  }
}

// 結果をキャッシュに保存（メモリキャッシュ使用）
export async function cacheResult(
  imageHash: string,
  businessType: string,
  effectStrength: string,
  result: any
): Promise<void> {
  try {
    // メモリキャッシュに保存
    memoryCache.set(imageHash, businessType, effectStrength, result)
    
    // Supabaseは権限制限のため一時的に無効化
    console.log('Supabaseキャッシュ保存は一時的に無効化されています')
  } catch (error) {
    console.error('キャッシュ保存エラー:', error)
  }
}

// 古いキャッシュエントリを削除（メモリキャッシュ対応）
export async function cleanupExpiredCache(): Promise<void> {
  try {
    console.log('メモリキャッシュクリーンアップ実行')
    // 統計情報を出力
    const stats = memoryCache.getStats()
    console.log('キャッシュ統計:', stats)
    
    // Supabaseは権限制限のため一時的に無効化
    console.log('Supabaseキャッシュクリーンアップは一時的に無効化されています')
  } catch (error) {
    console.error('キャッシュクリーンアップエラー:', error)
  }
}

// キャッシュ統計情報を取得
export function getCacheStats() {
  return memoryCache.getStats()
}

// キャッシュクリア
export function clearCache() {
  memoryCache.clear()
} 