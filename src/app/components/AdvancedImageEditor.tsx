'use client'

import { useState } from 'react'

interface InstagramOptimizerProps {
  image: string
  onOptimized: (optimizedImageUrl: string, completeResult: any) => void
  onCancel: () => void
}

interface CompleteOptimizationResult {
  appliedOptimizations: string[]
  originalAnalysis: {
    foodType: string
    compositionIssues: string[]
    lightingIssues: string[]
    colorIssues: string[]
    backgroundIssues: string[]
    recommendedOptimizations: string[]
  }
  optimizedImage: string
  caption: string
  hashtags: string
  photographyAdvice: string
}

export default function InstagramOptimizer({ image, onOptimized, onCancel }: InstagramOptimizerProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CompleteOptimizationResult | null>(null)
  const [processingStage, setProcessingStage] = useState('')

  const handleOptimize = async () => {
    if (!image) return

    setIsProcessing(true)
    setError('')
    setResult(null)

    try {
      setProcessingStage('画像を分析中...')
      
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/ai-image-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          image,
          mode: 'auto'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Instagram最適化に失敗しました')
      }

      setProcessingStage('最適化を適用中...')
      const data = await response.json()
      
      if (data.success && data.result) {
        setResult(data.result)
        onOptimized(data.result.optimizedImage, data.result)
      } else {
        throw new Error('最適化結果を取得できませんでした')
      }

    } catch (error) {
      console.error('Instagram最適化エラー:', error)
      setError(error instanceof Error ? error.message : 'Instagram最適化に失敗しました')
    } finally {
      setIsProcessing(false)
      setProcessingStage('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              🚀 SNS最適化
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 元画像 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">元画像</h3>
              <img
                src={image}
                alt="元画像"
                className="w-full h-64 object-cover rounded-lg border"
              />
            </div>

            {/* 最適化説明・結果 */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  🤖 AI完全最適化
                </h3>
                <p className="text-blue-700 text-sm mb-3">
                  AIが画像を分析し、Instagram投稿に必要な全てを自動生成します：
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center text-blue-700">
                    <span className="mr-2">📸</span>
                    <span>画像最適化</span>
                  </div>
                  <div className="flex items-center text-blue-700">
                    <span className="mr-2">✍️</span>
                    <span>キャプション生成</span>
                  </div>
                  <div className="flex items-center text-blue-700">
                    <span className="mr-2">#️⃣</span>
                    <span>ハッシュタグ生成</span>
                  </div>
                  <div className="flex items-center text-blue-700">
                    <span className="mr-2">💡</span>
                    <span>撮影アドバイス</span>
                  </div>
                </div>
              </div>

              {/* 処理結果表示 */}
              {result && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-3">
                    ✅ 最適化完了
                  </h4>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-green-800">📊 料理の種類:</p>
                      <p className="text-green-700">{result.originalAnalysis.foodType}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-green-800">✨ 適用した最適化:</p>
                      <ul className="text-green-700 list-disc list-inside ml-2">
                        {result.appliedOptimizations.map((opt, index) => (
                          <li key={index}>{opt}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <p className="font-medium text-green-800">✍️ 生成されたキャプション:</p>
                      <div className="bg-white p-3 rounded border text-green-700 text-sm">
                        {result.caption}
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-medium text-green-800">#️⃣ ハッシュタグ:</p>
                      <div className="bg-white p-3 rounded border text-green-700 text-sm">
                        {result.hashtags.split(' ').filter((tag: string) => tag.trim() !== '').map((tag: string, index: number) => (
                          <div key={index} className="mb-1">{tag}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* エラー表示 */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {/* 処理中表示 */}
              {isProcessing && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700 mr-2"></div>
                    {processingStage || 'SNS最適化中...'}
                  </div>
                  <p className="text-sm mt-1">
                    処理には60秒程度かかる場合があります
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              キャンセル
            </button>
            <button
              onClick={handleOptimize}
              disabled={isProcessing}
              className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600'
              }`}
            >
              {isProcessing ? '最適化中...' : '🚀 SNS最適化を開始'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 