'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [storeCode, setStoreCode] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeCode, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // ログイン成功 - トークンをlocalStorageに保存
        console.log('ログイン成功、レスポンス:', data)
        console.log('受信したトークン:', data.token)
        
        if (data.token) {
          localStorage.setItem('authToken', data.token)
          console.log('トークンをlocalStorageに保存しました')
          
          // 保存されたか確認
          const savedToken = localStorage.getItem('authToken')
          console.log('保存確認:', savedToken ? '成功' : '失敗')
        } else {
          console.log('トークンが受信されませんでした')
        }
        
        router.push('/dashboard')
      } else {
        setError(data.error || 'ログインに失敗しました')
      }
    } catch (error) {
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">InstaDish Pro</h1>
          <p className="text-gray-600">店舗ログイン</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="storeCode" className="block text-sm font-medium text-gray-700 mb-2">
              店舗コード
            </label>
            <input
              type="text"
              id="storeCode"
              value={storeCode}
              onChange={(e) => setStoreCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="店舗コードを入力"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="パスワードを入力"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            店舗コードやパスワードが分からない場合は<br />
            店長にお問い合わせください
          </p>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              新規アカウント作成は{' '}
              <a href="/register" className="text-orange-500 hover:text-orange-600 font-medium">
                こちら
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 