import { supabase } from './supabase'

interface APILogData {
  endpoint: string
  method: string
  status: number
  response_time: number
  user_id?: string
  error_message?: string
  request_size?: number
  response_size?: number
}

interface AIProcessingLogData {
  user_id?: string
  processing_time: number
  effect_strength: string
  success: boolean
  error_message?: string
  cache_hit: boolean
  image_size?: number
  model_used?: string
}

interface CacheLogData {
  key: string
  hit: boolean
  operation: 'get' | 'set' | 'delete'
  ttl?: number
  size?: number
}

interface ErrorLogData {
  error_type: string
  error_message: string
  stack_trace?: string
  endpoint?: string
  user_id?: string
  context?: Record<string, any>
}

// API応答時間を記録
export async function logAPIResponse(data: APILogData) {
  try {
    const { error } = await supabase
      .from('api_response_logs')
      .insert({
        endpoint: data.endpoint,
        method: data.method,
        status: data.status,
        response_time: data.response_time,
        user_id: data.user_id,
        error_message: data.error_message,
        request_size: data.request_size,
        response_size: data.response_size,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('API応答ログ記録エラー:', error)
    }
  } catch (error) {
    console.error('API応答ログ記録例外:', error)
  }
}

// AI処理パフォーマンスを記録
export async function logAIProcessing(data: AIProcessingLogData) {
  try {
    const { error } = await supabase
      .from('ai_processing_logs')
      .insert({
        user_id: data.user_id,
        processing_time: data.processing_time,
        effect_strength: data.effect_strength,
        success: data.success,
        error_message: data.error_message,
        cache_hit: data.cache_hit,
        image_size: data.image_size,
        model_used: data.model_used,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('AI処理ログ記録エラー:', error)
    }
  } catch (error) {
    console.error('AI処理ログ記録例外:', error)
  }
}

// キャッシュ使用状況を記録
export async function logCacheOperation(data: CacheLogData) {
  try {
    const { error } = await supabase
      .from('cache_logs')
      .insert({
        key: data.key,
        hit: data.hit,
        operation: data.operation,
        ttl: data.ttl,
        size: data.size,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('キャッシュログ記録エラー:', error)
    }
  } catch (error) {
    console.error('キャッシュログ記録例外:', error)
  }
}

// エラーを記録
export async function logError(data: ErrorLogData) {
  try {
    const { error } = await supabase
      .from('error_logs')
      .insert({
        error_type: data.error_type,
        error_message: data.error_message,
        stack_trace: data.stack_trace,
        endpoint: data.endpoint,
        user_id: data.user_id,
        context: data.context,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('エラーログ記録エラー:', error)
    }
  } catch (error) {
    console.error('エラーログ記録例外:', error)
  }
}

// パフォーマンス測定ユーティリティ
export class PerformanceTimer {
  private startTime: number
  private endpoint: string
  private method: string

  constructor(endpoint: string, method: string) {
    this.startTime = Date.now()
    this.endpoint = endpoint
    this.method = method
  }

  async finish(status: number, userId?: string, errorMessage?: string) {
    const responseTime = Date.now() - this.startTime

    await logAPIResponse({
      endpoint: this.endpoint,
      method: this.method,
      status,
      response_time: responseTime,
      user_id: userId,
      error_message: errorMessage
    })

    return responseTime
  }
}

// AI処理パフォーマンス測定ユーティリティ
export class AIProcessingTimer {
  private startTime: number
  private effectStrength: string
  private userId?: string

  constructor(effectStrength: string, userId?: string) {
    this.startTime = Date.now()
    this.effectStrength = effectStrength
    this.userId = userId
  }

  async finish(success: boolean, cacheHit: boolean, errorMessage?: string, imageSize?: number, modelUsed?: string) {
    const processingTime = Math.round((Date.now() - this.startTime) / 1000) // 秒単位

    await logAIProcessing({
      user_id: this.userId,
      processing_time: processingTime,
      effect_strength: this.effectStrength,
      success,
      error_message: errorMessage,
      cache_hit: cacheHit,
      image_size: imageSize,
      model_used: modelUsed
    })

    return processingTime
  }
}

// 自動クリーンアップ（古いログの削除）
export async function cleanupOldLogs() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const cutoffDate = thirtyDaysAgo.toISOString()

  try {
    // 30日以上前のログを削除
    const tables = ['api_response_logs', 'ai_processing_logs', 'cache_logs', 'error_logs']
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .lt('created_at', cutoffDate)

      if (error) {
        console.error(`${table}の古いログ削除エラー:`, error)
      } else {
        console.log(`${table}の古いログを削除しました`)
      }
    }
  } catch (error) {
    console.error('ログクリーンアップエラー:', error)
  }
}

// データベーステーブル作成用SQL（参考）
export const CREATE_TABLES_SQL = `
-- API応答ログテーブル
CREATE TABLE IF NOT EXISTS api_response_logs (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status INTEGER NOT NULL,
  response_time INTEGER NOT NULL,
  user_id VARCHAR(255),
  error_message TEXT,
  request_size INTEGER,
  response_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI処理ログテーブル
CREATE TABLE IF NOT EXISTS ai_processing_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  processing_time INTEGER NOT NULL,
  effect_strength VARCHAR(50) NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  cache_hit BOOLEAN DEFAULT FALSE,
  image_size INTEGER,
  model_used VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- キャッシュログテーブル
CREATE TABLE IF NOT EXISTS cache_logs (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL,
  hit BOOLEAN NOT NULL,
  operation VARCHAR(10) NOT NULL,
  ttl INTEGER,
  size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- エラーログテーブル
CREATE TABLE IF NOT EXISTS error_logs (
  id SERIAL PRIMARY KEY,
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  endpoint VARCHAR(255),
  user_id VARCHAR(255),
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_api_response_logs_created_at ON api_response_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_created_at ON ai_processing_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_cache_logs_created_at ON cache_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
`; 