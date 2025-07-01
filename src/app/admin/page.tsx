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

export default function AdminDashboard() {
  const [stores, setStores] = useState<StoreWithSubscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStore, setSelectedStore] = useState<StoreWithSubscription | null>(null)
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [stats, setStats] = useState({
    totalStores: 0,
    activeSubscriptions: 0,
    trialingStores: 0,
    canceledSubscriptions: 0
  })
  const router = useRouter()

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/admin/stores', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })

      if (response.status === 401) {
        router.push('/admin/login')
        return
      }

      if (response.ok) {
        const data = await response.json()
        setStores(data.stores)
        setStats(data.stats)
      } else {
        setError('店舗情報の取得に失敗しました')
      }
    } catch (error) {
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStoreAction = async (storeId: string, action: string, value?: any) => {
    try {
      const response = await fetch('/api/admin/stores/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          storeId,
          action,
          value
        })
      })

      if (response.ok) {
        fetchStores() // 再取得
        setShowStoreModal(false)
        setSelectedStore(null)
      } else {
        const data = await response.json()
        setError(data.error || '操作に失敗しました')
      }
    } catch (error) {
      setError('ネットワークエラーが発生しました')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'アクティブ' },
      trialing: { color: 'bg-yellow-100 text-yellow-800', text: 'トライアル中' },
      canceled: { color: 'bg-red-100 text-red-800', text: 'キャンセル' },
      past_due: { color: 'bg-orange-100 text-orange-800', text: '支払い遅延' },
      unpaid: { color: 'bg-gray-100 text-gray-800', text: '未払い' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unpaid
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const getDaysLeft = (endDate?: string) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">🔧 管理者ダッシュボード</h1>
              <p className="text-sm text-gray-600">InstaDish Pro 管理画面</p>
            </div>
            <button
              onClick={() => router.push('/admin/login')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* 統計カード */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <p className="text-sm font-medium text-gray-600">アクティブ</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <p className="text-sm font-medium text-gray-600">キャンセル</p>
                <p className="text-2xl font-bold text-gray-900">{stats.canceledSubscriptions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 店舗一覧 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">店舗一覧</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    店舗情報
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    サブスクリプション
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
                {stores.map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{store.name}</div>
                        <div className="text-sm text-gray-500">{store.store_code}</div>
                        <div className="text-sm text-gray-500">{store.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {store.subscriptions && store.subscriptions.length > 0 ? (
                        <div>
                          {getStatusBadge(store.subscriptions[0].status)}
                          {store.subscriptions[0].current_period_end && (
                            <div className="text-sm text-gray-500 mt-1">
                              残り{getDaysLeft(store.subscriptions[0].current_period_end)}日
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">未契約</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(store.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedStore(store)
                          setShowStoreModal(true)
                        }}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        詳細・編集
                      </button>
                    </td>
                  </tr>
                ))}
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedStore.name} の詳細
              </h3>
              
              <div className="space-y-4">
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
                
                {selectedStore.subscriptions && selectedStore.subscriptions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">サブスクリプション状況</label>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(selectedStore.subscriptions[0].status)}
                      {selectedStore.subscriptions[0].current_period_end && (
                        <span className="text-sm text-gray-500">
                          残り{getDaysLeft(selectedStore.subscriptions[0].current_period_end)}日
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                {selectedStore.subscriptions && selectedStore.subscriptions.length > 0 && (
                  <>
                    <button
                      onClick={() => handleStoreAction(selectedStore.id, 'extend_trial', 30)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm"
                    >
                      無料期間延長
                    </button>
                    <button
                      onClick={() => handleStoreAction(selectedStore.id, 'cancel_subscription')}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm"
                    >
                      サブスク停止
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowStoreModal(false)
                    setSelectedStore(null)
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-md shadow-lg">
          {error}
        </div>
      )}
    </div>
  )
} 