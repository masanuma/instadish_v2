// テスト用モックキャッシュ機能

// メモリ内キャッシュ（テスト用）
const memoryCache = new Map<string, any>();

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

// キャッシュから結果を取得（モック版）
export async function getCachedResult(
  imageHash: string, 
  businessType: string, 
  effectStrength: string
): Promise<any | null> {
  try {
    const cacheKey = `${imageHash}_${businessType}_${effectStrength}`
    const cached = memoryCache.get(cacheKey)
    
    if (!cached) {
      return null
    }
    
    // 24時間の有効期限チェック
    const now = new Date()
    const expiresAt = new Date(cached.expiresAt)
    
    if (now > expiresAt) {
      memoryCache.delete(cacheKey)
      return null
    }
    
    console.log('モックキャッシュから結果を取得しました')
    return cached.result
  } catch (error) {
    console.error('モックキャッシュ取得エラー:', error)
    return null
  }
}

// 結果をキャッシュに保存（モック版）
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
    
    const cacheKey = `${imageHash}_${businessType}_${effectStrength}`
    memoryCache.set(cacheKey, {
      result,
      expiresAt: expiresAt.toISOString()
    })
    
    console.log('モックキャッシュに結果を保存しました')
  } catch (error) {
    console.error('モックキャッシュ保存エラー:', error)
  }
}

// 古いキャッシュエントリを削除（モック版）
export async function cleanupExpiredCache(): Promise<void> {
  try {
    const now = new Date()
    const keysToDelete = []
    
      for (const [key, value] of Array.from(memoryCache.entries())) {
    const expiresAt = new Date(value.expiresAt)
    if (now > expiresAt) {
      keysToDelete.push(key)
    }
  }
    
    keysToDelete.forEach(key => memoryCache.delete(key))
    
    if (keysToDelete.length > 0) {
      console.log(`${keysToDelete.length}件の期限切れキャッシュを削除しました`)
    }
  } catch (error) {
    console.error('モックキャッシュクリーンアップエラー:', error)
  }
}

// キャッシュの状態を確認（テスト用）
export function getCacheStats(): { size: number, keys: string[] } {
  return {
    size: memoryCache.size,
    keys: Array.from(memoryCache.keys())
  }
}

// キャッシュをクリア（テスト用）
export function clearCache(): void {
  memoryCache.clear()
  console.log('モックキャッシュをクリアしました')
} 