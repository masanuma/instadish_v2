'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    storeName: '',
    storeCode: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    phone: '',
    fixedCaption: '',
    fixedHashtags: '',
    storeDescription: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.storeName.trim()) {
      setError('店舗名を入力してください')
      return false
    }
    if (!formData.storeCode.trim()) {
      setError('店舗コードを入力してください')
      return false
    }
    if (!formData.email.trim()) {
      setError('メールアドレスを入力してください')
      return false
    }
    if (!formData.password) {
      setError('パスワードを入力してください')
      return false
    }
    if (formData.password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (!validateForm()) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/store/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store_code: formData.storeCode,
          name: formData.storeName,
          email: formData.email,
          password: formData.password,
          address: formData.address,
          phone: formData.phone,
          fixed_caption: formData.fixedCaption,
          fixed_hashtags: formData.fixedHashtags,
          store_description: formData.storeDescription
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('アカウントが正常に作成されました！ログインページに移動します...')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError(data.error || 'アカウント作成に失敗しました')
      }
    } catch (error) {
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">InstaDish Pro</h1>
          <p className="text-gray-600">新規アカウント作成</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-2">
                店舗名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="storeName"
                name="storeName"
                value={formData.storeName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="例：美味しいレストラン"
                required
              />
            </div>

            <div>
              <label htmlFor="storeCode" className="block text-sm font-medium text-gray-700 mb-2">
                店舗コード <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="storeCode"
                name="storeCode"
                value={formData.storeCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="例：restaurant001"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="example@restaurant.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="8文字以上"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード確認 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="パスワードを再入力"
                required
              />
            </div>
          </div>

          {/* 連絡先情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                住所
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="東京都渋谷区..."
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                電話番号
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="03-1234-5678"
              />
            </div>
          </div>

          {/* 店舗設定 */}
          <div>
            <label htmlFor="storeDescription" className="block text-sm font-medium text-gray-700 mb-2">
              店舗説明
            </label>
            <textarea
              id="storeDescription"
              name="storeDescription"
              value={formData.storeDescription}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="店舗の特徴やコンセプトを入力してください"
            />
          </div>

          <div>
            <label htmlFor="fixedCaption" className="block text-sm font-medium text-gray-700 mb-2">
              固定キャプション
            </label>
            <textarea
              id="fixedCaption"
              name="fixedCaption"
              value={formData.fixedCaption}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="AI生成キャプションの最後に必ず追加される文章"
            />
          </div>

          <div>
            <label htmlFor="fixedHashtags" className="block text-sm font-medium text-gray-700 mb-2">
              固定ハッシュタグ
            </label>
            <textarea
              id="fixedHashtags"
              name="fixedHashtags"
              value={formData.fixedHashtags}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="#美味しい #レストラン #おすすめ"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'アカウント作成中...' : 'アカウントを作成'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            既にアカウントをお持ちですか？{' '}
            <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium">
              ログイン
            </Link>
          </p>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 mb-2">✨ アカウント作成特典</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 30日間の無料トライアル</li>
            <li>• 全機能を無制限で利用可能</li>
            <li>• クレジットカード登録不要（トライアル期間中）</li>
            <li>• いつでも解約可能</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 