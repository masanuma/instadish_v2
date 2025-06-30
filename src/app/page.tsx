'use client'

import { useState, useRef, useEffect } from 'react'

// エフェクト強度選択肢
const EFFECT_STRENGTHS = [
  { id: 'weak', name: '弱い', description: '自然な美味しさ強調' },
  { id: 'normal', name: '普通', description: '食欲をそそる魅力的な仕上がり' },
  { id: 'strong', name: '強い', description: 'インパクト大！SNS映え重視' }
]

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [businessType, setBusinessType] = useState<string>('restaurant') // 固定値
  const [effectStrength, setEffectStrength] = useState<string>('normal')
  const [caption, setCaption] = useState<string>('')
  const [hashtags, setHashtags] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [imageAnalysis, setImageAnalysis] = useState<string>('')
  const [processingDetails, setProcessingDetails] = useState<string>('')
  const [photographyAdvice, setPhotographyAdvice] = useState<string>('')
  const [imageEffects, setImageEffects] = useState<string>('')
  const [downloadUrl, setDownloadUrl] = useState<string>('')
  const [showCaptionPrompt, setShowCaptionPrompt] = useState<boolean>(false)
  const [showHashtagPrompt, setShowHashtagPrompt] = useState<boolean>(false)
  const [captionPrompt, setCaptionPrompt] = useState<string>('')
  const [hashtagPrompt, setHashtagPrompt] = useState<string>('')
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [storeName, setStoreName] = useState<string>('')
  const [processingTime, setProcessingTime] = useState<number>(0)
  const [fromCache, setFromCache] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ページ読み込み時に保存された設定を復元 & 認証状態チェック
  useEffect(() => {
    const savedEffectStrength = localStorage.getItem('instadish-effect-strength')
    
    if (savedEffectStrength) {
      setEffectStrength(savedEffectStrength)
    }

    // 認証状態をチェック
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/store', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsLoggedIn(true)
        setStoreName(data.name || '店舗')
      } else {
        setIsLoggedIn(false)
        setStoreName('')
      }
    } catch (error) {
      setIsLoggedIn(false)
      setStoreName('')
    }
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
        setDownloadUrl('')
      }
      reader.readAsDataURL(file)
    }
  }

  const processWithAI = async () => {
    if (!selectedImage) return
    
    setIsProcessing(true)
    setProcessingTime(0)
    setFromCache(false)
    
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
        
        // 処理時間とキャッシュ情報を設定
        setProcessingTime(result.processingTime || 0)
        setFromCache(result.fromCache || false)
        
        // APIから返された加工詳細を設定
        setProcessingDetails(result.processingDetails || '画像エフェクト適用済み')

        // ダウンロード用画像を生成
        if (result.processedImage && result.imageEffects) {
          generateDownloadImage(result.processedImage, result.imageEffects).then(downloadUrl => {
            setDownloadUrl(downloadUrl)
          }).catch(err => {
            console.error('ダウンロード画像生成エラー:', err)
            // エラーの場合は元画像をダウンロード可能にする
            setDownloadUrl(result.processedImage)
          })
        } else if (result.processedImage) {
          // エフェクト情報がない場合は元画像をダウンロード可能にする
          setDownloadUrl(result.processedImage)
        }
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

  // キャプション再生成ボタンクリック（プロンプト入力欄を表示）
  const handleCaptionRegenerate = () => {
    setShowCaptionPrompt(true)
    setCaptionPrompt('')
  }

  // キャプション再生成実行（プロンプトあり）
  const regenerateCaptionWithPrompt = async () => {
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
          regenerateCaption: true,
          customPrompt: captionPrompt
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setCaption(result.caption)
        setShowCaptionPrompt(false)
        setCaptionPrompt('')
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

  // キャプション再生成キャンセル
  const cancelCaptionRegenerate = () => {
    setShowCaptionPrompt(false)
    setCaptionPrompt('')
  }

  // ハッシュタグ再生成ボタンクリック（プロンプト入力欄を表示）
  const handleHashtagRegenerate = () => {
    setShowHashtagPrompt(true)
    setHashtagPrompt('')
  }

  // ハッシュタグ再生成実行（プロンプトあり）
  const regenerateHashtagsWithPrompt = async () => {
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
          regenerateHashtags: true,
          customPrompt: hashtagPrompt
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setHashtags(result.hashtags.join('\n'))
        setShowHashtagPrompt(false)
        setHashtagPrompt('')
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

  // ハッシュタグ再生成キャンセル
  const cancelHashtagRegenerate = () => {
    setShowHashtagPrompt(false)
    setHashtagPrompt('')
  }

  // 画像ダウンロード用のCanvas処理
  const generateDownloadImage = (imageSrc: string, effects: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        
        // エフェクトを適用
        if (ctx) {
          ctx.filter = effects || 'brightness(1.1) contrast(1.08) saturate(1.15)'
          ctx.drawImage(img, 0, 0)
        }
        
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      
      img.crossOrigin = 'anonymous'
      img.src = imageSrc
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* ヘッダー */}
        <div className="text-center mb-6 sm:mb-8 relative">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            InstaDish Pro
          </h1>
          <p className="text-sm sm:text-lg text-gray-600">
            AI画像加工 × 業種別キャプション生成サービス
          </p>
          
          {/* ログイン状態に応じたボタン表示 */}
          <div className="absolute top-0 right-0">
            {isLoggedIn ? (
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                ⚙️ 店舗設定
              </button>
            ) : (
              <button
                onClick={() => window.location.href = '/login'}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                🔑 ログイン
              </button>
            )}
          </div>
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

              {/* 業種は店舗紹介文から自動判断されるため、選択UIを削除 */}

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
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-lg font-semibold text-sm sm:text-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? '🤖 AI処理中...' : '🚀 AI加工・キャプション生成'}
              </button>

              {/* 処理時間とキャッシュ情報表示 */}
              {processingTime > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        ⏱️ 処理時間: {processingTime}ms
                      </span>
                      {fromCache && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          🚀 キャッシュから高速取得
                        </span>
                      )}
                    </div>
                    {processingTime < 1000 && !fromCache && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        ⚡ 高速処理
                      </span>
                    )}
                  </div>
                </div>
              )}
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
                        className="w-full max-w-none object-contain rounded-lg shadow-sm border"
                        style={{ height: 'auto', maxHeight: '400px', backgroundColor: '#f9fafb' }}
                      />
                    </div>
                    
                    {/* After */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-green-600">✨ 加工後 (エフェクト適用)</h3>
                        {downloadUrl && (
                          <a
                            href={downloadUrl}
                            download="instadish-processed-image.jpg"
                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors whitespace-nowrap"
                          >
                            📥 DL
                          </a>
                        )}
                      </div>
                      <img
                        src={processedImage}
                        alt="AI加工後の画像"
                        className="w-full max-w-none object-contain rounded-lg border-2 border-green-200 shadow-lg"
                        style={{ 
                          height: 'auto', 
                          maxHeight: '400px',
                          backgroundColor: '#f9fafb',
                          filter: imageEffects || 'brightness(1.1) contrast(1.08) saturate(1.15)'
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
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={handleCaptionRegenerate}
                        disabled={isProcessing}
                        className="bg-purple-500 text-white px-2 py-1 sm:px-3 sm:py-2 rounded text-xs sm:text-sm hover:bg-purple-600 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        🔄 再生成
                      </button>
                      <button
                        onClick={copyCaption}
                        className="bg-blue-500 text-white px-2 py-1 sm:px-3 sm:py-2 rounded text-xs sm:text-sm hover:bg-blue-600 transition-colors whitespace-nowrap"
                      >
                        📋 コピー
                      </button>
                    </div>
                  </div>
                  {/* プロンプト入力欄 */}
                  {showCaptionPrompt && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-medium text-blue-800 mb-2 text-sm sm:text-base">💡 カスタムプロンプト入力</h3>
                      <textarea
                        value={captionPrompt}
                        onChange={(e) => setCaptionPrompt(e.target.value)}
                        className="w-full h-20 p-2 sm:p-3 border border-blue-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="どのようなキャプションにしたいか具体的に書いてください（例：もっとフォーマルに、季節感を入れて、若者向けの表現で、など）"
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={regenerateCaptionWithPrompt}
                          disabled={isProcessing || !captionPrompt.trim()}
                          className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? '🤖 生成中...' : '✨ プロンプトで再生成'}
                        </button>
                        <button
                          onClick={cancelCaptionRegenerate}
                          className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600 transition-colors"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  )}

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
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={handleHashtagRegenerate}
                        disabled={isProcessing}
                        className="bg-purple-500 text-white px-2 py-1 sm:px-3 sm:py-2 rounded text-xs sm:text-sm hover:bg-purple-600 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        🔄 再生成
                      </button>
                      <button
                        onClick={copyHashtags}
                        className="bg-green-500 text-white px-2 py-1 sm:px-3 sm:py-2 rounded text-xs sm:text-sm hover:bg-green-600 transition-colors whitespace-nowrap"
                      >
                        📋 コピー
                      </button>
                    </div>
                  </div>
                  {/* プロンプト入力欄 */}
                  {showHashtagPrompt && (
                    <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="font-medium text-green-800 mb-2 text-sm sm:text-base">💡 カスタムプロンプト入力</h3>
                      <textarea
                        value={hashtagPrompt}
                        onChange={(e) => setHashtagPrompt(e.target.value)}
                        className="w-full h-20 p-2 sm:p-3 border border-green-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="どのようなハッシュタグにしたいか具体的に書いてください（例：トレンド重視、地域密着、ターゲット年齢層を意識して、など）"
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={regenerateHashtagsWithPrompt}
                          disabled={isProcessing || !hashtagPrompt.trim()}
                          className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? '🤖 生成中...' : '✨ プロンプトで再生成'}
                        </button>
                        <button
                          onClick={cancelHashtagRegenerate}
                          className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600 transition-colors"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  )}

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