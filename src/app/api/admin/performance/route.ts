import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // 管理者認証確認
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const admin = await validateAdminSession(token)
    
    if (!admin) {
      return NextResponse.json({ error: '無効なセッションです' }, { status: 401 })
    }

    // パフォーマンス監視データの取得
    const performanceData = await getPerformanceMetrics()
    
    return NextResponse.json({
      success: true,
      data: performanceData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('パフォーマンス監視データ取得エラー:', error)
    return NextResponse.json(
      { error: 'パフォーマンス監視データの取得に失敗しました' },
      { status: 500 }
    )
  }
}

async function getPerformanceMetrics() {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // AI処理パフォーマンス統計
  const aiProcessingStats = await getAIProcessingStats(oneHourAgo, oneDayAgo, oneWeekAgo)
  
  // API応答時間統計
  const apiResponseStats = await getAPIResponseStats(oneHourAgo, oneDayAgo, oneWeekAgo)
  
  // エラー発生率統計
  const errorStats = await getErrorStats(oneHourAgo, oneDayAgo, oneWeekAgo)
  
  // キャッシュヒット率統計
  const cacheStats = await getCacheStats(oneHourAgo, oneDayAgo, oneWeekAgo)
  
  // システム使用量
  const systemStats = await getSystemStats()

  return {
    aiProcessing: aiProcessingStats,
    apiResponse: apiResponseStats,
    errors: errorStats,
    cache: cacheStats,
    system: systemStats,
    summary: {
      totalRequests: aiProcessingStats.total + apiResponseStats.total,
      averageResponseTime: (aiProcessingStats.averageTime + apiResponseStats.averageTime) / 2,
      errorRate: errorStats.rate,
      cacheHitRate: cacheStats.hitRate,
      uptime: '99.9%' // 実際の監視システムと連携
    }
  }
}

async function getAIProcessingStats(oneHourAgo: Date, oneDayAgo: Date, oneWeekAgo: Date) {
  // AI処理ログの取得（実際の実装では専用のログテーブルを使用）
  const { data: recentProcessing, error } = await supabaseAdmin
    .from('ai_processing_logs')
    .select('*')
    .gte('created_at', oneHourAgo.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('AI処理ログ取得エラー:', error)
    return {
      total: 0,
      averageTime: 0,
      lastHour: 0,
      lastDay: 0,
      lastWeek: 0,
      distribution: []
    }
  }

  const total = recentProcessing?.length || 0
  const averageTime = recentProcessing?.reduce((sum: any, log: any) => sum + (log.processing_time || 0), 0) / (total || 1)
  
  return {
    total,
    averageTime: Math.round(averageTime),
    lastHour: recentProcessing?.filter((log: any) => new Date(log.created_at) > oneHourAgo).length || 0,
    lastDay: recentProcessing?.filter((log: any) => new Date(log.created_at) > oneDayAgo).length || 0,
    lastWeek: recentProcessing?.filter((log: any) => new Date(log.created_at) > oneWeekAgo).length || 0,
    distribution: getTimeDistribution(recentProcessing || [])
  }
}

async function getAPIResponseStats(oneHourAgo: Date, oneDayAgo: Date, oneWeekAgo: Date) {
  // API応答ログの取得
  const { data: apiLogs, error } = await supabaseAdmin
    .from('api_response_logs')
    .select('*')
    .gte('created_at', oneHourAgo.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('API応答ログ取得エラー:', error)
    return {
      total: 0,
      averageTime: 0,
      lastHour: 0,
      lastDay: 0,
      lastWeek: 0,
      endpoints: []
    }
  }

  const total = apiLogs?.length || 0
  const averageTime = apiLogs?.reduce((sum: any, log: any) => sum + (log.response_time || 0), 0) / (total || 1)
  
  return {
    total,
    averageTime: Math.round(averageTime),
    lastHour: apiLogs?.filter((log: any) => new Date(log.created_at) > oneHourAgo).length || 0,
    lastDay: apiLogs?.filter((log: any) => new Date(log.created_at) > oneDayAgo).length || 0,
    lastWeek: apiLogs?.filter((log: any) => new Date(log.created_at) > oneWeekAgo).length || 0,
    endpoints: getEndpointStats(apiLogs || [])
  }
}

async function getErrorStats(oneHourAgo: Date, oneDayAgo: Date, oneWeekAgo: Date) {
  // エラーログの取得
  const { data: errorLogs, error } = await supabaseAdmin
    .from('error_logs')
    .select('*')
    .gte('created_at', oneHourAgo.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('エラーログ取得エラー:', error)
    return {
      total: 0,
      rate: 0,
      lastHour: 0,
      lastDay: 0,
      lastWeek: 0,
      types: []
    }
  }

  const total = errorLogs?.length || 0
  const rate = total / (total + 1000) * 100 // 仮の計算
  
  return {
    total,
    rate: Math.round(rate * 100) / 100,
    lastHour: errorLogs?.filter((log: any) => new Date(log.created_at) > oneHourAgo).length || 0,
    lastDay: errorLogs?.filter((log: any) => new Date(log.created_at) > oneDayAgo).length || 0,
    lastWeek: errorLogs?.filter((log: any) => new Date(log.created_at) > oneWeekAgo).length || 0,
    types: getErrorTypes(errorLogs || [])
  }
}

async function getCacheStats(oneHourAgo: Date, oneDayAgo: Date, oneWeekAgo: Date) {
  // キャッシュ統計の取得
  const { data: cacheLogs, error } = await supabaseAdmin
    .from('cache_logs')
    .select('*')
    .gte('created_at', oneHourAgo.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('キャッシュログ取得エラー:', error)
    return {
      total: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
      lastHour: { hits: 0, misses: 0 },
      lastDay: { hits: 0, misses: 0 },
      lastWeek: { hits: 0, misses: 0 }
    }
  }

  const total = cacheLogs?.length || 0
  const hits = cacheLogs?.filter((log: any) => log.hit === true).length || 0
  const misses = total - hits
  const hitRate = total > 0 ? (hits / total) * 100 : 0
  
  return {
    total,
    hits,
    misses,
    hitRate: Math.round(hitRate * 100) / 100,
    lastHour: getCachePeriodStats(cacheLogs || [], oneHourAgo),
    lastDay: getCachePeriodStats(cacheLogs || [], oneDayAgo),
    lastWeek: getCachePeriodStats(cacheLogs || [], oneWeekAgo)
  }
}

async function getSystemStats() {
  // システム使用量の取得（実際の実装では監視ツールのAPIを使用）
  return {
    cpu: Math.floor(Math.random() * 50) + 20, // 20-70%
    memory: Math.floor(Math.random() * 40) + 30, // 30-70%
    disk: Math.floor(Math.random() * 30) + 20, // 20-50%
    network: Math.floor(Math.random() * 100) + 50, // 50-150 Mbps
    uptime: '99.9%',
    activeConnections: Math.floor(Math.random() * 50) + 10 // 10-60 connections
  }
}

function getTimeDistribution(logs: any[]) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  return hours.map(hour => {
    const count = logs.filter(log => {
      const logHour = new Date(log.created_at).getHours()
      return logHour === hour
    }).length
    return { hour, count }
  })
}

function getEndpointStats(logs: any[]) {
  const endpoints = logs.reduce((acc: any, log: any) => {
    const endpoint = log.endpoint || 'unknown'
    acc[endpoint] = (acc[endpoint] || 0) + 1
    return acc
  }, {})
  
  return Object.entries(endpoints).map(([endpoint, count]) => ({ endpoint, count }))
}

function getErrorTypes(logs: any[]) {
  const types = logs.reduce((acc: any, log: any) => {
    const type = log.error_type || 'unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})
  
  return Object.entries(types).map(([type, count]) => ({ type, count }))
}

function getCachePeriodStats(logs: any[], since: Date) {
  const filteredLogs = logs.filter(log => new Date(log.created_at) > since)
  const hits = filteredLogs.filter(log => log.hit === true).length
  const misses = filteredLogs.length - hits
  return { hits, misses }
} 