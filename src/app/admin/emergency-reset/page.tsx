'use client'

import { useState } from 'react'

export default function EmergencyResetPage() {
  const [isResetting, setIsResetting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [resetToken, setResetToken] = useState('')

  const handleReset = async () => {
    if (!resetToken) {
      alert('リセットトークンを入力してください')
      return
    }

    setIsResetting(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resetToken })
      })

      const data = await response.json()

      if (response.ok) {
        setResult(`✅ 成功: ${data.message}`)
      } else {
        setResult(`❌ エラー: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ 通信エラー: ${error}`)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            🚨 緊急管理者パスワードリセット
          </h1>
          <p className="text-gray-600 text-sm">
            開発者専用の緊急リセットページです
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              リセットトークン
            </label>
            <input
              type="password"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="InstaDish_Admin_Reset_2025"
            />
          </div>

          <button
            onClick={handleReset}
            disabled={isResetting || !resetToken}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isResetting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                リセット中...
              </>
            ) : (
              'パスワードをリセット'
            )}
          </button>

          {result && (
            <div className={`p-4 rounded-md ${result.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <pre className="text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">📝 リセット後のログイン情報</h3>
            <div className="text-sm text-blue-700">
              <p><strong>URL:</strong> <a href="/admin/login" className="underline">/admin/login</a></p>
              <p><strong>ユーザー名:</strong> admin</p>
              <p><strong>パスワード:</strong> admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 