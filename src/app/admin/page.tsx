'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import React from 'react'

interface Store {
  id: string
  name: string
  store_code: string
  email: string
  address: string
  phone: string
  created_at: string
  stripe_customer_id?: string
}

interface Subscription {
  id: string
  store_id: string
  status: string
  trial_start?: string
  trial_end?: string
  current_period_end?: string
  cancel_at_period_end: boolean
}

interface StoreWithSubscription extends Store {
  subscriptions?: Subscription[]
}

interface Stats {
  totalStores: number
  activeSubscriptions: number
  trialingStores: number
  canceledSubscriptions: number
}

export default function AdminDashboard() {
  const [stores, setStores] = useState<StoreWithSubscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isRetrying, setIsRetrying] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  const [selectedStore, setSelectedStore] = useState<StoreWithSubscription | null>(null)
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [stats, setStats] = useState<Stats>({
    totalStores: 0,
    activeSubscriptions: 0,
    trialingStores: 0,
    canceledSubscriptions: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showPasswordForm, setShowPasswordForm] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // 管理者認証チェック
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    fetchStores(token)
  }, [router])

  const fetchStores = async (token: string, retryCount: number = 0) => {
    const maxRetries = 3
    const timeout = 15000 // 15秒タイムアウト
    
    // 再試行状態の管理
    if (retryCount > 0) {
      setIsRetrying(true)
    }
    
    try {
      console.log('管理者店舗情報取得開始:', { retryCount, timestamp: new Date().toISOString() })
      
      // AbortController でタイムアウト設定
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch('/api/admin/stores', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      console.log('API応答受信:', { 
        status: response.status, 
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (response.status === 401) {
        console.log('認証エラー: トークンを削除してログイン画面に遷移')
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API応答エラー:', { status: response.status, error: errorText })
        throw new Error(`店舗情報の取得に失敗しました (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      console.log('店舗データ取得成功:', { 
        storeCount: data.stores?.length || 0,
        stats: data.stats 
      })
      
      setStores(data.stores || [])
      setStats(data.stats || {
        totalStores: 0,
        activeSubscriptions: 0,
        trialingStores: 0,
        canceledSubscriptions: 0
      })
      setError('') // エラーをクリア
      setLastFetchTime(new Date()) // 最後の取得時間を記録
      
    } catch (error) {
      console.error('店舗取得エラー:', error)
      
      // タイムアウトエラーの処理
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = `接続がタイムアウトしました (${timeout/1000}秒)`
        setError(timeoutError)
        console.error('タイムアウトエラー:', timeoutError)
      } else {
        const errorMessage = error instanceof Error ? error.message : 'データの取得に失敗しました'
        setError(errorMessage)
      }
      
      // 再試行処理
      if (retryCount < maxRetries) {
        console.log(`再試行中... (${retryCount + 1}/${maxRetries})`)
        setTimeout(() => {
          fetchStores(token, retryCount + 1)
        }, 2000 * (retryCount + 1)) // 指数バックオフ
        return
      }
      
    } finally {
      setIsLoading(false)
      setIsRetrying(false)
    }
  }

  // 手動再試行機能
  const handleRetry = () => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsLoading(true)
      setError('')
      fetchStores(token)
    }
  }

  const handleStoreAction = async (storeId: string, action: string, value?: any) => {
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        router.push('/admin/login')
        return
      }

      const response = await fetch('/api/admin/stores/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ storeId, action, value })
      })

      if (!response.ok) {
        throw new Error('操作に失敗しました')
      }

      const result = await response.json()
      alert(result.message || '操作が完了しました')
      
      // データを再取得
      fetchStores(token)
    } catch (error) {
      alert('操作に失敗しました')
      console.error('店舗操作エラー:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    router.push('/admin/login')
  }

  const handleDeleteStore = async (storeId: string) => {
    if (!window.confirm('本当にこの店舗を削除しますか？（論理削除）')) return;
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }
      const res = await fetch('/api/store/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ storeId })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '削除に失敗しました');
        return;
      }
      alert('店舗を削除しました');
      fetchStores(token);
    } catch (e) {
      alert('削除時にエラーが発生しました');
    }
  };

  const handleUpdatePassword = async (userId: string) => {
    if (!newPassword) {
      alert('新しいパスワードを入力してください');
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }
      const res = await fetch('/api/admin/users/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, newPassword })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'パスワード更新に失敗しました');
        return;
      }
      alert('パスワードを更新しました');
      setShowPasswordForm(null);
      setNewPassword('');
    } catch (e) {
      alert('更新時にエラーが発生しました');
    }
  };

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.store_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterStatus === 'all') return matchesSearch
    
    const subscription = store.subscriptions?.[0]
    if (filterStatus === 'active') return matchesSearch && subscription?.status === 'active'
    if (filterStatus === 'trialing') return matchesSearch && subscription?.status === 'trialing'
    if (filterStatus === 'canceled') return matchesSearch && subscription?.status === 'canceled'
    if (filterStatus === 'no_subscription') return matchesSearch && !subscription
    
    return matchesSearch
  })

  const getStatusBadge = (subscription?: Subscription) => {
    if (!subscription) {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">未登録</span>
    }
    
    switch (subscription.status) {
      case 'active':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">有効</span>
      case 'trialing':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">トライアル中</span>
      case 'canceled':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">停止</span>
      case 'past_due':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">支払い遅延</span>
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">{subscription.status}</span>
    }
  }

  const getDaysLeft = (subscription?: Subscription) => {
    if (!subscription) return null
    
    const endDate = subscription.trial_end || subscription.current_period_end
    if (!endDate) return null
    
    const now = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays : 0
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isRetrying ? '再試行中...' : '読み込み中...'}
          </p>
          {isRetrying && (
            <p className="mt-2 text-sm text-gray-500">
              データの取得に時間がかかっています
            </p>
          )}
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
              <h1 className="text-2xl font-bold text-gray-900">InstaDish Pro 管理者ダッシュボード</h1>
              <p className="text-gray-600">
                店舗管理・サブスクリプション管理
                {lastFetchTime && (
                  <span className="text-sm text-gray-500 ml-2">
                    (最終更新: {lastFetchTime.toLocaleString('ja-JP')})
                  </span>
                )}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRetry}
                disabled={isLoading || isRetrying}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading || isRetrying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    更新中...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    更新
                  </>
                )}
              </button>
              <button
                onClick={() => router.push('/admin/performance')}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                パフォーマンス監視
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">エラーが発生しました</p>
                <p className="text-sm mt-1">{error}</p>
                {lastFetchTime && (
                  <p className="text-xs text-red-600 mt-1">
                    最後の更新: {lastFetchTime.toLocaleString('ja-JP')}
                  </p>
                )}
              </div>
              <button
                onClick={handleRetry}
                disabled={isLoading || isRetrying}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading || isRetrying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    再試行中...
                  </>
                ) : (
                  '再試行'
                )}
              </button>
            </div>
          </div>
        )}

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総店舗数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStores}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">有効サブスク</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">トライアル中</p>
                <p className="text-2xl font-bold text-gray-900">{stats.trialingStores}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">停止中</p>
                <p className="text-2xl font-bold text-gray-900">{stats.canceledSubscriptions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">検索</label>
                <input
                  type="text"
                  placeholder="店舗名、店舗コード、メールアドレスで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ステータスフィルター</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">すべて</option>
                  <option value="active">有効</option>
                  <option value="trialing">トライアル中</option>
                  <option value="canceled">停止</option>
                  <option value="no_subscription">未登録</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 店舗一覧 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">店舗一覧 ({filteredStores.length}件)</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    店舗情報
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    残り日数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStores.map((store) => {
                  const subscription = store.subscriptions?.[0]
                  const daysLeft = getDaysLeft(subscription)
                  
                  return (
                    <React.Fragment key={store.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{store.name}</div>
                            <div className="text-sm text-gray-500">{store.store_code}</div>
                            <div className="text-sm text-gray-500">{store.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(subscription)}
                        </td>
                        <td className="px-6 py-4">
                          {daysLeft !== null ? (
                            <span className={`text-sm ${daysLeft <= 7 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                              {daysLeft}日
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(store.created_at).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedStore(store)
                                setShowStoreModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900 text-sm"
                            >
                              詳細
                            </button>
                            {subscription && subscription.status === 'trialing' && (
                              <button
                                onClick={() => handleStoreAction(store.id, 'extend_trial', 7)}
                                className="text-green-600 hover:text-green-900 text-sm"
                              >
                                7日延長
                              </button>
                            )}
                            {subscription && subscription.status === 'active' && (
                              <button
                                onClick={() => handleStoreAction(store.id, 'cancel_subscription')}
                                className="text-red-600 hover:text-red-900 text-sm"
                              >
                                停止
                              </button>
                            )}
                            {subscription && subscription.status === 'canceled' && (
                              <button
                                onClick={() => handleStoreAction(store.id, 'activate_subscription')}
                                className="text-green-600 hover:text-green-900 text-sm"
                              >
                                再開
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setShowPasswordForm(store.id)
                                setNewPassword('')
                                setTimeout(() => passwordInputRef.current?.focus(), 100)
                              }}
                              className="text-purple-600 hover:text-purple-900 text-sm"
                              title="店舗のパスワードを強制更新"
                            >
                              パスワード更新
                            </button>
                            <button
                              onClick={() => handleDeleteStore(store.id)}
                              className="text-red-500 hover:underline ml-2 text-sm"
                            >
                              削除
                            </button>
                          </div>
                        </td>
                      </tr>
                      {showPasswordForm === store.id && (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 bg-gray-50">
                            <div className="p-4 bg-white rounded-lg border border-gray-200">
                              <div className="text-sm font-medium text-gray-700 mb-3">
                                🔑 店舗「{store.name}」のパスワード更新
                              </div>
                              <div className="flex items-center space-x-3">
                                <input 
                                  type="password" 
                                  ref={passwordInputRef} 
                                  value={newPassword} 
                                  onChange={e => setNewPassword(e.target.value)} 
                                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 max-w-xs" 
                                  placeholder="新しいパスワードを入力" 
                                  minLength={6}
                                />
                                <button 
                                  onClick={() => handleUpdatePassword(store.id)} 
                                  disabled={!newPassword || newPassword.length < 6}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2H7a3 3 0 01-3-3V9a2 2 0 012-2m0 0V7a2 2 0 012-2h4zm-5 15v-5a2 2 0 010-4h1m0 0V7a2 2 0 012-2h3a2 2 0 012 2v3m-6 0a2 2 0 100-4h1a2 2 0 000 4h-1z" />
                                  </svg>
                                  パスワード更新
                                </button>
                                <button 
                                  onClick={() => { 
                                    setShowPasswordForm(null); 
                                    setNewPassword(''); 
                                  }} 
                                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                                >
                                  キャンセル
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                ※ パスワードは6文字以上で設定してください
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 店舗詳細モーダル */}
      {showStoreModal && selectedStore && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">店舗詳細</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">店舗名</label>
                  <p className="text-sm text-gray-900">{selectedStore.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">店舗コード</label>
                  <p className="text-sm text-gray-900">{selectedStore.store_code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
                  <p className="text-sm text-gray-900">{selectedStore.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">住所</label>
                  <p className="text-sm text-gray-900">{selectedStore.address || '未設定'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">電話番号</label>
                  <p className="text-sm text-gray-900">{selectedStore.phone || '未設定'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">登録日</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedStore.created_at).toLocaleString('ja-JP')}
                  </p>
                </div>
                {selectedStore.subscriptions?.[0] && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">サブスクリプション</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedStore.subscriptions[0])}
                      {getDaysLeft(selectedStore.subscriptions[0]) !== null && (
                        <p className="text-sm text-gray-600 mt-1">
                          残り {getDaysLeft(selectedStore.subscriptions[0])} 日
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowStoreModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 