'use client'

import { useState } from 'react'

interface InstagramOptimizerProps {
  image: string
  onOptimized: (optimizedImageUrl: string, analysis: any) => void
  onCancel: () => void
}

interface OptimizationResult {
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
}

export default function InstagramOptimizer({ image, onOptimized, onCancel }: InstagramOptimizerProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [analysisResult, setAnalysisResult] = useState<OptimizationResult | null>(null)
  const [processingStage, setProcessingStage] = useState('')

  const handleOptimize = async () => {
    if (!image) return

    setIsProcessing(true)
    setError('')
    setAnalysisResult(null)

    try {
      setProcessingStage('画像を分析中...')
      
      const token = localStorage.getItem('auth_token')
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
        setAnalysisResult(data.result)
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
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              📸 Instagram最適化
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  🤖 AI自動最適化
                </h3>
                <p className="text-blue-700 text-sm">
                  AIが画像を分析し、Instagramで高く評価されるように自動で最適化します：
                </p>
                <ul className="text-blue-700 text-sm mt-2 space-y-1">
                  <li>• 料理の種類を自動判定</li>
                  <li>• 照明・色彩・構図を最適化</li>
                  <li>• 背景やテクスチャを調整</li>
                  <li>• Instagram映えする仕上がりに</li>
                </ul>
              </div>

              {/* 分析結果表示 */}
              {analysisResult && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    ✅ 最適化完了
                  </h4>
                  <div className="text-green-700 text-sm space-y-2">
                    <p><strong>料理の種類:</strong> {analysisResult.originalAnalysis.foodType}</p>
                    <p><strong>適用した最適化:</strong></p>
                    <ul className="list-disc list-inside ml-2">
                      {analysisResult.appliedOptimizations.map((opt, index) => (
                        <li key={index}>{opt}</li>
                      ))}
                    </ul>
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
                    {processingStage || 'Instagram最適化中...'}
                  </div>
                  <p className="text-sm mt-1">
                    処理には30秒程度かかる場合があります
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
              className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              }`}
            >
              {isProcessing ? '最適化中...' : '🚀 Instagram最適化を開始'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 