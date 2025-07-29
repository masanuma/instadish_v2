'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PerformanceData {
  aiProcessing: {
    total: number
    averageTime: number
    lastHour: number
    lastDay: number
    lastWeek: number
    distribution: { [key: string]: number }
  }
  apiResponse: {
    total: number
    averageTime: number
    lastHour: number
    lastDay: number
    lastWeek: number
    endpoints: { endpoint: string; count: number }[]
  }
  errors: {
    total: number
    rate: number
    lastHour: number
    lastDay: number
    lastWeek: number
    types: { type: string; count: number }[]
  }
  cache: {
    total: number
    hits: number
    misses: number
    hitRate: number
    lastHour: { hits: number; misses: number }
    lastDay: { hits: number; misses: number }
    lastWeek: { hits: number; misses: number }
  }
  system: {
    cpu: number
    memory: number
    disk: number
    network: number
    uptime: string
    activeConnections: number
  }
  summary: {
    totalRequests: number
    averageResponseTime: number
    errorRate: number
    cacheHitRate: number
    uptime: string
  }
}

export default function PerformancePage() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    fetchPerformanceData(token)
  }, [router])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      const token = localStorage.getItem('adminToken')
      if (token) {
        fetchPerformanceData(token)
      }
    }, 30000) // 30秒ごとに更新

    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchPerformanceData = async (token: string) => {
    try {
      const response = await fetch('/api/admin/performance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
        return
      }

      if (!response.ok) {
        throw new Error('パフォーマンスデータの取得に失敗しました')
      }

      const data = await response.json()
      setPerformanceData(data.data)
      setLastUpdated(new Date())
      setError('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'データの取得に失敗しました')
      console.error('パフォーマンスデータ取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsLoading(true)
      fetchPerformanceData(token)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">パフォーマンスデータを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!performanceData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">データが取得できませんでした</p>
          <button
            onClick={handleRefresh}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">パフォーマンス監視</h1>
              <p className="text-gray-600">
                システムパフォーマンス・API応答時間・エラー監視
                {lastUpdated && (
                  <span className="text-sm text-gray-500 ml-2">
                    (最終更新: {lastUpdated.toLocaleString('ja-JP')})
                  </span>
                )}
              </p>
            </div>
            <div className="flex space-x-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">自動更新</span>
              </label>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                更新
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                管理画面に戻る
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-medium">エラーが発生しました</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総リクエスト数</p>
                <p className="text-2xl font-bold text-gray-900">{performanceData.summary.totalRequests?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">平均応答時間</p>
                <p className="text-2xl font-bold text-gray-900">{performanceData.summary.averageResponseTime || 0}ms</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${performanceData.summary.errorRate < 1 ? 'bg-green-100' : performanceData.summary.errorRate < 5 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                <svg className={`w-6 h-6 ${performanceData.summary.errorRate < 1 ? 'text-green-600' : performanceData.summary.errorRate < 5 ? 'text-yellow-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">エラー発生率</p>
                <p className="text-2xl font-bold text-gray-900">{performanceData.summary.errorRate || 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">キャッシュヒット率</p>
                <p className="text-2xl font-bold text-gray-900">{performanceData.summary.cacheHitRate || 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">稼働率</p>
                <p className="text-2xl font-bold text-gray-900">{performanceData.summary.uptime || '99.9%'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 詳細監視データ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* AI処理パフォーマンス */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">AI処理パフォーマンス</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">総処理数</span>
                <span className="text-sm font-medium">{performanceData.aiProcessing.total?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">平均処理時間</span>
                <span className="text-sm font-medium">{performanceData.aiProcessing.averageTime || 0}秒</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">過去1時間</span>
                <span className="text-sm font-medium">{performanceData.aiProcessing.lastHour || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">過去24時間</span>
                <span className="text-sm font-medium">{performanceData.aiProcessing.lastDay || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">過去1週間</span>
                <span className="text-sm font-medium">{performanceData.aiProcessing.lastWeek || 0}</span>
              </div>
            </div>
          </div>

          {/* システムリソース */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">システムリソース</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">CPU使用率</span>
                  <span className="font-medium">{performanceData.system.cpu || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${(performanceData.system.cpu || 0) > 80 ? 'bg-red-500' : (performanceData.system.cpu || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${performanceData.system.cpu || 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">メモリ使用率</span>
                  <span className="font-medium">{performanceData.system.memory || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${(performanceData.system.memory || 0) > 80 ? 'bg-red-500' : (performanceData.system.memory || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${performanceData.system.memory || 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">ディスク使用率</span>
                  <span className="font-medium">{performanceData.system.disk || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${(performanceData.system.disk || 0) > 80 ? 'bg-red-500' : (performanceData.system.disk || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${performanceData.system.disk || 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">アクティブ接続</span>
                <span className="text-sm font-medium">{performanceData.system.activeConnections?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* キャッシュとエラー統計 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* キャッシュ統計 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">キャッシュ統計</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">総リクエスト</span>
                <span className="text-sm font-medium">{performanceData.cache.total?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">ヒット数</span>
                <span className="text-sm font-medium text-green-600">{performanceData.cache.hits?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">ミス数</span>
                <span className="text-sm font-medium text-red-600">{performanceData.cache.misses?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">ヒット率</span>
                <span className="text-sm font-medium">{performanceData.cache.hitRate || 0}%</span>
              </div>
            </div>
          </div>

          {/* エラー統計 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">エラー統計</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">総エラー数</span>
                <span className="text-sm font-medium">{performanceData.errors.total?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">エラー発生率</span>
                <span className="text-sm font-medium">{performanceData.errors.rate || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">過去1時間</span>
                <span className="text-sm font-medium">{performanceData.errors.lastHour || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">過去24時間</span>
                <span className="text-sm font-medium">{performanceData.errors.lastDay || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 