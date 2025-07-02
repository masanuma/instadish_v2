'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

  const fetchStores = async (token: string) => {
    try {
      const response = await fetch('/api/admin/stores', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401) {
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
        return
      }

      if (!response.ok) {
        throw new Error('店舗情報の取得に失敗しました')
      }

      const data = await response.json()
      setStores(data.stores)
      setStats(data.stats)
    } catch (error) {
      setError('データの取得に失敗しました')
      console.error('店舗取得エラー:', error)
    } finally {
      setIsLoading(false)
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
          <p className="mt-4 text-gray-600">読み込み中...</p>
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
              <p className="text-gray-600">店舗管理・サブスクリプション管理</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
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
                    <tr key={store.id} className="hover:bg-gray-50">
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
                        </div>
                      </td>
                    </tr>
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