'use client'

import { useState, useRef, useEffect } from 'react'

// 業種選択肢
const BUSINESS_TYPES = [
  { id: 'bar', name: 'バー', description: '大人の雰囲気を演出' },
  { id: 'izakaya', name: '居酒屋', description: 'カジュアルで親しみやすく' },
  { id: 'sushi', name: '寿司店', description: '高級感と職人技を表現' },
  { id: 'ramen', name: 'ラーメン店', description: '温かみとボリューム感' },
  { id: 'cafe', name: 'カフェ', description: 'おしゃれで落ち着いた印象' },
  { id: 'restaurant', name: 'レストラン', description: '上品で洗練された雰囲気' },
  { id: 'yakiniku', name: '焼肉店', description: '迫力と食欲をそそる表現' },
  { id: 'italian', name: 'イタリアン', description: '陽気で本格的な味' }
]

// エフェクト強度選択肢
const EFFECT_STRENGTHS = [
  { id: 'weak', name: '弱い', description: '自然な美味しさ強調' },
  { id: 'normal', name: '普通', description: '食欲をそそる魅力的な仕上がり' },
  { id: 'strong', name: '強い', description: 'インパクト大！SNS映え重視' }
]

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [businessType, setBusinessType] = useState<string>('restaurant')
  const [effectStrength, setEffectStrength] = useState<string>('normal')
  const [caption, setCaption] = useState<string>('')
  const [hashtags, setHashtags] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [imageAnalysis, setImageAnalysis] = useState<string>('')
  const [processingDetails, setProcessingDetails] = useState<string>('')
  const [photographyAdvice, setPhotographyAdvice] = useState<string>('')
  const [imageEffects, setImageEffects] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ページ読み込み時に保存された設定を復元
  useEffect(() => {
    const savedBusinessType = localStorage.getItem('instadish-business-type')
    const savedEffectStrength = localStorage.getItem('instadish-effect-strength')
    
    if (savedBusinessType) {
      setBusinessType(savedBusinessType)
    }
    if (savedEffectStrength) {
      setEffectStrength(savedEffectStrength)
    }
  }, [])

  // 業種選択時に保存
  const handleBusinessTypeChange = (type: string) => {
    setBusinessType(type)
    localStorage.setItem('instadish-business-type', type)
  }

  // エフェクト強度選択時に保存
  const handleEffectStrengthChange = (strength: string) => {
    setEffectStrength(strength)
    localStorage.setItem('instadish-effect-strength', strength)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setProcessedImage(null)
        setCaption('')
        setHashtags('')
        setImageAnalysis('')
        setProcessingDetails('')
        setPhotographyAdvice('')
        setImageEffects('')
      }
      reader.readAsDataURL(file)
    }
  }

  const processWithAI = async () => {
    if (!selectedImage) return
    
    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/ai-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: selectedImage,
          businessType,
          effectStrength
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setProcessedImage(result.processedImage)
        setCaption(result.caption)
        setHashtags(result.hashtags.join('\n'))
        setImageAnalysis(result.analysis || '')
        setPhotographyAdvice(result.photographyAdvice || '')
        setImageEffects(result.imageEffects || '')
        
        // エフェクト強度に応じた加工詳細を設定
        const effectDetails = (() => {
          switch (result.effectStrength) {
            case 'weak':
              return '軽微な調整: 明度+5%, 彩度+3%, コントラスト+2% - 自然な美味しさを保持'
            case 'normal':
              return '標準調整: 明度+10%, 彩度+8%, コントラスト+5%, 暖色調+3% - バランスの良い食欲増進効果'
            case 'strong':
              return '強力調整: 明度+15%, 彩度+15%, コントラスト+10%, 暖色調+8%, シャープ+5% - インパクトのある美味しさ強調'
            default:
              return '標準調整を適用'
          }
        })()
        setProcessingDetails(effectDetails)
      } else {
        // APIからの詳細エラー情報を取得して表示
        try {
          const errorData = await response.json()
          const errorMessage = errorData.error || 'AI処理でエラーが発生しました'
          const errorDetails = errorData.details ? `\n詳細: ${errorData.details}` : ''
          const timestamp = errorData.timestamp ? `\n時刻: ${new Date(errorData.timestamp).toLocaleString()}` : ''
          alert(`${errorMessage}${errorDetails}${timestamp}`)
        } catch {
          alert(`AI処理でエラーが発生しました (HTTP ${response.status})`)
        }
      }
    } catch (error) {
      console.error('AI処理エラー:', error)
      if (error instanceof Error) {
        alert(`ネットワークエラーが発生しました: ${error.message}`)
      } else {
        alert('AI処理でエラーが発生しました。ネットワーク接続を確認してください。')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption)
      alert('キャプションをコピーしました！')
    } catch (err) {
      alert('コピーに失敗しました')
    }
  }

  const copyHashtags = async () => {
    try {
      await navigator.clipboard.writeText(hashtags)
      alert('ハッシュタグをコピーしました！')
    } catch (err) {
      alert('コピーに失敗しました')
    }
  }

  // キャプション再生成
  const regenerateCaption = async () => {
    if (!selectedImage) return
    
    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/ai-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: selectedImage,
          businessType,
          effectStrength,
          regenerateCaption: true
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setCaption(result.caption)
      } else {
        try {
          const errorData = await response.json()
          const errorMessage = errorData.error || 'キャプション再生成でエラーが発生しました'
          alert(errorMessage)
        } catch {
          alert(`キャプション再生成でエラーが発生しました (HTTP ${response.status})`)
        }
      }
    } catch (error) {
      console.error('キャプション再生成エラー:', error)
      alert('キャプション再生成でエラーが発生しました。')
    } finally {
      setIsProcessing(false)
    }
  }

  // ハッシュタグ再生成
  const regenerateHashtags = async () => {
    if (!selectedImage) return
    
    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/ai-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: selectedImage,
          businessType,
          effectStrength,
          regenerateHashtags: true
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setHashtags(result.hashtags.join('\n'))
      } else {
        try {
          const errorData = await response.json()
          const errorMessage = errorData.error || 'ハッシュタグ再生成でエラーが発生しました'
          alert(errorMessage)
        } catch {
          alert(`ハッシュタグ再生成でエラーが発生しました (HTTP ${response.status})`)
        }
      }
    } catch (error) {
      console.error('ハッシュタグ再生成エラー:', error)
      alert('ハッシュタグ再生成でエラーが発生しました。')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* ヘッダー */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            InstaDish Pro
          </h1>
          <p className="text-sm sm:text-lg text-gray-600">
            AI画像加工 × 業種別キャプション生成サービス
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            
            {/* 左側：画像アップロード・設定エリア */}
            <div className="space-y-4 sm:space-y-6">
              
              {/* 画像アップロード */}
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">📷 画像アップロード</h2>
                
                {!selectedImage ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center">
                    <div className="mb-3 sm:mb-4">
                      <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">料理の写真をアップロードしてください</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                    >
                      画像を選択
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <img
                      src={selectedImage}
                      alt="アップロードされた画像"
                      className="w-full max-w-none object-cover rounded-lg shadow-md"
                      style={{ height: 'auto', minHeight: '300px', maxHeight: '500px' }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
                    >
                      別の画像を選択
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* 業種選択 */}
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">🏪 業種選択</h2>
                <select
                  value={businessType}
                  onChange={(e) => handleBusinessTypeChange(e.target.value)}
                  className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-lg text-base sm:text-lg font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                >
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* エフェクト強度選択 */}
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">✨ エフェクト強度</h2>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {EFFECT_STRENGTHS.map((strength) => (
                    <button
                      key={strength.id}
                      onClick={() => handleEffectStrengthChange(strength.id)}
                      className={`p-2 sm:p-3 rounded-lg border-2 text-center transition-colors ${
                        effectStrength === strength.id
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm sm:text-base">{strength.name}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{strength.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI処理ボタン */}
              <button
                onClick={processWithAI}
                disabled={!selectedImage || isProcessing}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? '🤖 AI処理中...' : '🚀 AI加工・キャプション生成'}
              </button>
            </div>

            {/* 右側：結果表示エリア */}
            <div className="space-y-4 sm:space-y-6">
              
              {/* 加工後画像 */}
              {processedImage && (
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">✨ AI加工後</h2>
                  
                  {/* Before/After表示 */}
                  <div className="space-y-4">
                    {/* Before */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-2">📷 加工前</h3>
                      <img
                        src={selectedImage || ''}
                        alt="加工前の画像"
                        className="w-full max-w-none object-cover rounded-lg shadow-sm"
                        style={{ height: 'auto', minHeight: '200px', maxHeight: '300px' }}
                      />
                    </div>
                    
                    {/* After */}
                    <div>
                      <h3 className="text-sm font-medium text-green-600 mb-2">✨ 加工後 (エフェクト適用)</h3>
                      <img
                        src={processedImage}
                        alt="AI加工後の画像"
                        className="w-full max-w-none object-cover rounded-lg border-2 border-green-200 shadow-lg"
                        style={{ 
                          height: 'auto', 
                          minHeight: '200px', 
                          maxHeight: '300px',
                          filter: imageEffects || 'brightness(1.2) contrast(1.15) saturate(1.3)'
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* 加工詳細 */}
                  {processingDetails && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <h3 className="font-medium text-green-800 mb-2 text-sm sm:text-base">🔧 画像加工詳細</h3>
                      <p className="text-xs sm:text-sm text-green-700">{processingDetails}</p>
                    </div>
                  )}
                  
                  {/* 撮影アドバイス */}
                  {photographyAdvice && (
                    <div className="mt-3 sm:mt-4 p-3 bg-purple-50 rounded-lg">
                      <h3 className="font-medium text-purple-800 mb-2 text-sm sm:text-base">📸 撮影アドバイス</h3>
                      <p className="text-xs sm:text-sm text-purple-700 whitespace-pre-line">{photographyAdvice}</p>
                    </div>
                  )}
                </div>
              )}

              {/* キャプション */}
              {caption && (
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold">📝 生成されたキャプション</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={regenerateCaption}
                        disabled={isProcessing}
                        className="bg-purple-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded text-xs sm:text-sm hover:bg-purple-600 transition-colors disabled:opacity-50"
                      >
                        🔄 再生成
                      </button>
                      <button
                        onClick={copyCaption}
                        className="bg-blue-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded text-xs sm:text-sm hover:bg-blue-600 transition-colors"
                      >
                        📋 コピー
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="w-full h-24 sm:h-32 p-2 sm:p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="キャプションを編集できます..."
                    />
                    <p className="text-xs text-gray-500 mt-2">✏️ 自由に編集してからコピーできます</p>
                  </div>
                </div>
              )}

              {/* ハッシュタグ */}
              {hashtags && (
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold">#️⃣ おすすめハッシュタグ</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={regenerateHashtags}
                        disabled={isProcessing}
                        className="bg-purple-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded text-xs sm:text-sm hover:bg-purple-600 transition-colors disabled:opacity-50"
                      >
                        🔄 再生成
                      </button>
                      <button
                        onClick={copyHashtags}
                        className="bg-green-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded text-xs sm:text-sm hover:bg-green-600 transition-colors"
                      >
                        📋 コピー
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <textarea
                      value={hashtags}
                      onChange={(e) => setHashtags(e.target.value)}
                      className="w-full h-36 sm:h-48 p-2 sm:p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-xs sm:text-sm"
                      placeholder="ハッシュタグを編集できます..."
                    />
                    <p className="text-xs text-gray-500 mt-2">✏️ 自由に編集してからコピーできます</p>
                  </div>
                </div>
              )}

              {/* 初期状態のメッセージ */}
              {!processedImage && !caption && !hashtags && (
                <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12 text-center">
                  <div className="mb-3 sm:mb-4">
                    <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm sm:text-lg">
                    画像をアップロードして、<br />
                    業種とエフェクト強度を選択後、<br />
                    AI処理を実行してください
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}