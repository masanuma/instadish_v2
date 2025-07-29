'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Store {
  id: string
  store_code: string
  name: string
  address: string
  phone: string
  fixed_caption: string
  fixed_hashtags: string
  store_description: string
}

interface SubscriptionStatus {
  isActive: boolean
  isTrialing: boolean
  daysLeft?: number
  subscription?: any
}

interface Plan {
  id: string
  name: string
  price: number
  features: string[]
}

export default function Dashboard() {
  const [store, setStore] = useState<Store | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('')
  const router = useRouter()

  // フォームデータ
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    fixed_caption: '',
    fixed_hashtags: '',
    store_description: ''
  })

  const fetchStoreInfo = async () => {
    try {
      const token = localStorage.getItem('authToken')
      console.log('店舗情報取得時のトークン:', token)
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/store', { headers })
      
      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (response.ok) {
        const data = await response.json()
        setStore(data.store)
        setFormData({
          name: data.store.name || '',
          address: data.store.address || '',
          phone: data.store.phone || '',
          fixed_caption: data.store.fixed_caption || '',
          fixed_hashtags: data.store.fixed_hashtags || '',
          store_description: data.store.store_description || ''
        })
      } else {
        setError('店舗情報の取得に失敗しました')
      }
    } catch (error) {
      setError('ネットワークエラーが発生しました')
    }
  }

  const fetchSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch('/api/subscription/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSubscriptionStatus(data.subscription)
      }
    } catch (error) {
      console.error('サブスクリプション状況取得エラー:', error)
    }
  }

  const fetchAvailablePlans = async () => {
    try {
      const response = await fetch('/api/subscription/create')
      if (response.ok) {
        const data = await response.json()
        setAvailablePlans(data.plans)
        if (data.plans.length > 0) {
          setSelectedPlan(data.plans[0].id)
        }
      }
    } catch (error) {
      console.error('プラン取得エラー:', error)
    }
  }

  useEffect(() => {
    Promise.all([
      fetchStoreInfo(),
      fetchSubscriptionStatus(),
      fetchAvailablePlans()
    ]).finally(() => {
      setIsLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('authToken')
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/store', {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setStore(data.store)
        setSuccess('店舗情報を更新しました')
        setIsEditing(false)
      } else {
        setError(data.error || '更新に失敗しました')
      }
    } catch (error) {
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubscribe = async () => {
    if (!email || !selectedPlan) {
      setError('メールアドレスとプランを選択してください')
      return
    }

    setIsSubscribing(true)
    setError('')

    try {
      const token = localStorage.getItem('authToken')
      console.log('ローカルストレージのトークン:', token)
      
      if (!token) {
        setError('認証トークンが見つかりません。再ログインしてください。')
        setIsSubscribing(false)
        return
      }

      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email,
          planId: selectedPlan
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setShowSubscriptionForm(false)
        fetchSubscriptionStatus() // 状況を再取得
      } else {
        setError(data.error || 'サブスクリプション作成に失敗しました')
      }
    } catch (error) {
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  const goToImageProcessor = () => {
    router.push('/')
  }

  const getSubscriptionStatusColor = () => {
    if (!subscriptionStatus?.isActive) return 'text-red-600'
    if (subscriptionStatus.isTrialing) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getSubscriptionStatusText = () => {
    if (!subscriptionStatus?.isActive) return '未契約'
    if (subscriptionStatus.isTrialing) return `無料トライアル中 (残り${subscriptionStatus.daysLeft}日)`
    return `アクティブ (残り${subscriptionStatus.daysLeft}日)`
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

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">店舗情報の取得に失敗しました</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md"
          >
            ログインページへ
          </button>
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
              <h1 className="text-2xl font-bold text-gray-800">⚙️ 店舗設定</h1>
              <p className="text-sm text-gray-600">{store.name} の設定画面</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={goToImageProcessor}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                🚀 メイン画面へ
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* サブスクリプション状況 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">💳 サブスクリプション</h2>
            <div className={`text-sm font-medium ${getSubscriptionStatusColor()}`}>
              {getSubscriptionStatusText()}
            </div>
          </div>

          {!subscriptionStatus?.isActive && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    サブスクリプションが必要です
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    AI画像処理機能を利用するにはサブスクリプションの契約が必要です。2週間の無料トライアルからお試しください。
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setShowSubscriptionForm(true)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  無料トライアルを開始
                </button>
              </div>
            </div>
          )}

          {subscriptionStatus?.isActive && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    サブスクリプション有効
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    AI画像処理機能をご利用いただけます。
                    {subscriptionStatus.isTrialing && '無料トライアル期間中です。'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* サブスクリプション登録フォーム */}
          {showSubscriptionForm && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">サブスクリプション登録</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    プラン選択
                  </label>
                  <div className="space-y-2">
                    {availablePlans.map((plan) => (
                      <label key={plan.id} className="flex items-center">
                        <input
                          type="radio"
                          name="plan"
                          value={plan.id}
                          checked={selectedPlan === plan.id}
                          onChange={(e) => setSelectedPlan(e.target.value)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{plan.name}</span>
                            <span className="text-sm text-gray-600">月額 ¥{plan.price.toLocaleString()}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {plan.features.join(', ')}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-md text-sm font-medium"
                  >
                    {isSubscribing ? '処理中...' : '2週間無料トライアル開始'}
                  </button>
                  <button
                    onClick={() => setShowSubscriptionForm(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 店舗情報設定 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">🏪 店舗情報設定</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                編集
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 基本情報 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  店舗コード
                </label>
                <input
                  type="text"
                  value={store.store_code}
                  disabled
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  店舗名
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={!isEditing}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                    isEditing ? 'focus:outline-none focus:ring-2 focus:ring-orange-500' : 'bg-gray-50 text-gray-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  住所
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  disabled={!isEditing}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                    isEditing ? 'focus:outline-none focus:ring-2 focus:ring-orange-500' : 'bg-gray-50 text-gray-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={!isEditing}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                    isEditing ? 'focus:outline-none focus:ring-2 focus:ring-orange-500' : 'bg-gray-50 text-gray-500'
                  }`}
                />
              </div>
            </div>

            {/* AI設定 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  固定キャプション
                </label>
                <textarea
                  value={formData.fixed_caption}
                  onChange={(e) => setFormData({...formData, fixed_caption: e.target.value})}
                  disabled={!isEditing}
                  rows={3}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                    isEditing ? 'focus:outline-none focus:ring-2 focus:ring-orange-500' : 'bg-gray-50 text-gray-500'
                  }`}
                  placeholder="全ての投稿に追加される固定文言"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  固定ハッシュタグ
                </label>
                <input
                  type="text"
                  value={formData.fixed_hashtags}
                  onChange={(e) => setFormData({...formData, fixed_hashtags: e.target.value})}
                  disabled={!isEditing}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                    isEditing ? 'focus:outline-none focus:ring-2 focus:ring-orange-500' : 'bg-gray-50 text-gray-500'
                  }`}
                  placeholder="#グルメ #美味しい #おすすめ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  店舗説明
                </label>
                <textarea
                  value={formData.store_description}
                  onChange={(e) => setFormData({...formData, store_description: e.target.value})}
                  disabled={!isEditing}
                  rows={4}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                    isEditing ? 'focus:outline-none focus:ring-2 focus:ring-orange-500' : 'bg-gray-50 text-gray-500'
                  }`}
                  placeholder="AI生成時に参考にする店舗の特徴や雰囲気"
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="mt-6 flex space-x-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-md text-sm font-medium"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setFormData({
                    name: store.name || '',
                    address: store.address || '',
                    phone: store.phone || '',
                    fixed_caption: store.fixed_caption || '',
                    fixed_hashtags: store.fixed_hashtags || '',
                    store_description: store.store_description || ''
                  })
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                キャンセル
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 