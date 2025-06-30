import OpenAI from 'openai'

// リトライ設定
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1秒
  maxDelay: 10000, // 10秒
}

// 指数バックオフで遅延を計算
function calculateDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1)
  return Math.min(delay, RETRY_CONFIG.maxDelay)
}

// リトライ可能なエラーかどうかを判定
function isRetryableError(error: any): boolean {
  if (!error) return false
  
  const errorMessage = error.message?.toLowerCase() || ''
  const statusCode = error.status || error.code
  
  // ネットワークエラー
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return true
  }
  
  // レート制限
  if (errorMessage.includes('rate limit') || statusCode === 429) {
    return true
  }
  
  // サーバーエラー
  if (statusCode >= 500 && statusCode < 600) {
    return true
  }
  
  // OpenAI API の一時的なエラー
  if (errorMessage.includes('timeout') || errorMessage.includes('service unavailable')) {
    return true
  }
  
  return false
}

// リトライ機能付きのAI処理実行
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'AI処理'
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      console.error(`${operationName} エラー (試行 ${attempt}/${RETRY_CONFIG.maxRetries}):`, error)
      
      // 最後の試行でない場合のみリトライ
      if (attempt < RETRY_CONFIG.maxRetries && isRetryableError(error)) {
        const delay = calculateDelay(attempt)
        console.log(`${delay}ms後にリトライします...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // リトライ不可能なエラーまたは最後の試行
      break
    }
  }
  
  throw lastError
}

// OpenAI API の設定を最適化
export function createOptimizedOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  
  return new OpenAI({
    apiKey,
    timeout: 30000, // 30秒タイムアウト
    maxRetries: 0, // 手動でリトライを制御
  })
}

// プロンプトの最適化
export function optimizePrompt(prompt: string, maxLength: number = 4000): string {
  if (prompt.length <= maxLength) {
    return prompt
  }
  
  // 長すぎるプロンプトを短縮
  return prompt.substring(0, maxLength - 100) + '...'
}

// 処理時間の測定
export function measureExecutionTime<T>(
  operation: () => Promise<T>,
  operationName: string = '処理'
): Promise<T> {
  const startTime = Date.now()
  
  return operation().finally(() => {
    const endTime = Date.now()
    const duration = endTime - startTime
    console.log(`${operationName} 実行時間: ${duration}ms`)
  })
}

// エラーメッセージの標準化
export function standardizeErrorMessage(error: any): string {
  if (!error) return '不明なエラーが発生しました'
  
  const errorMessage = error.message?.toLowerCase() || ''
  
  if (errorMessage.includes('api key') || errorMessage.includes('authentication')) {
    return 'API認証エラーが発生しました。設定を確認してください。'
  }
  
  if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
    return 'API利用制限に達しました。しばらく時間をおいて再試行してください。'
  }
  
  if (errorMessage.includes('rate limit')) {
    return 'リクエストが多すぎます。しばらく時間をおいて再試行してください。'
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
  }
  
  if (errorMessage.includes('timeout')) {
    return '処理がタイムアウトしました。しばらく時間をおいて再試行してください。'
  }
  
  return 'AI処理でエラーが発生しました。しばらく時間をおいて再試行してください。'
}

// 処理結果の品質チェック
export function validateAIResponse(response: any): boolean {
  if (!response || !response.choices || !response.choices[0]) {
    return false
  }
  
  const content = response.choices[0].message?.content
  if (!content || content.trim().length === 0) {
    return false
  }
  
  return true
} 