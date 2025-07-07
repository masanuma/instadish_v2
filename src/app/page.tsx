'use client'

import { useState, useRef, useEffect } from 'react'
// import InstagramOptimizer from './components/AdvancedImageEditor' // 削除

// エフェクト強度選択肢（5段階）
const EFFECT_STRENGTHS = [
  { id: 'very-weak', name: '最弱', description: 'ほぼ自然、上品な仕上がり' },
  { id: 'weak', name: '弱い', description: '自然な美味しさ強調' },
  { id: 'normal', name: '普通', description: '食欲をそそる魅力的な仕上がり' },
  { id: 'strong', name: '強い', description: 'インパクト大！SNS映え重視' },
  { id: 'very-strong', name: '最強', description: '鮮烈！極限まで魅力を引き出す' }
]

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [businessType, setBusinessType] = useState<string>('restaurant') // 固定値
  const [effectStrength, setEffectStrength] = useState<string>('normal')
  const [caption, setCaption] = useState<string | null>(null)
  const [hashtags, setHashtags] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null)
  const [processingDetails, setProcessingDetails] = useState<string | null>(null)
  const [photographyAdvice, setPhotographyAdvice] = useState<string | null>(null)
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
  const [optimizationResult, setOptimizationResult] = useState<any>(null)
  const [isInstagramOptimizing, setIsInstagramOptimizing] = useState<boolean>(false)
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

  const handleInstagramOptimization = async () => {
    if (!selectedImage) return

    // 処理中の重複実行を防ぐ
    if (isInstagramOptimizing) {
      console.log('Instagram最適化処理中のため、リクエストをスキップします')
      return
    }

    setIsInstagramOptimizing(true)
    setProcessedImage(null)
    setOptimizationResult(null)
    setCaption(null)
    setHashtags(null)
    setPhotographyAdvice(null)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/ai-image-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          image: selectedImage,
          mode: 'auto',
          effectStrength: effectStrength
        })
      })

      if (!response.ok) {
        // 認証エラー（401）の場合は適切な処理を行う
        if (response.status === 401) {
          const confirmLogin = window.confirm('ログインが必要です。ログイン画面に移動しますか？')
          if (confirmLogin) {
            window.location.href = '/login'
          }
          return
        }
        
        const errorData = await response.json()
        throw new Error(errorData.error || 'Instagram最適化に失敗しました')
      }

      const data = await response.json()
      
      if (data.success && data.result) {
        // SNS最適化の場合も元画像にエフェクトを適用
        const processedImageWithFilter = await applyImageEffects(selectedImage, data.result.imageEffects)
        
        setProcessedImage(processedImageWithFilter)
        setOptimizationResult(data.result)
        setCaption(data.result.caption)
        setHashtags(data.result.hashtags)
        setPhotographyAdvice(data.result.photographyAdvice)
      } else {
        throw new Error('最適化結果を取得できませんでした')
      }

    } catch (error) {
      console.error('Instagram最適化エラー:', error)
      alert(error instanceof Error ? error.message : 'Instagram最適化に失敗しました')
    } finally {
      setIsInstagramOptimizing(false)
    }
  }

  const processWithAI = async () => {
    if (!selectedImage) return

    // 処理中の重複実行を防ぐ
    if (isProcessing) {
      console.log('処理中のため、リクエストをスキップします')
      return
    }

    setIsProcessing(true)
    setProcessingTime(0)
    setFromCache(false)

    try {
      console.log('AI処理リクエスト開始:', { effectStrength, businessType })
      
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

      console.log('レスポンス受信:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        contentType: response.headers.get('content-type')
      })

      // レスポンスの内容を確認
      const responseText = await response.text()
      console.log('レスポンステキスト:', responseText)

      if (response.ok) {
        // JSONパースを試行
        let result
        try {
          result = JSON.parse(responseText)
        } catch (parseError) {
          console.error('JSONパースエラー:', parseError)
          throw new Error(`レスポンスのJSONパースに失敗: ${responseText.substring(0, 200)}...`)
        }
        // 元画像にCSS filterを適用して処理済み画像を生成
        const processedImageWithFilter = await applyImageEffects(selectedImage, result.imageEffects)
        
        setProcessedImage(processedImageWithFilter)
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
        // 認証エラー（401）の場合は適切な処理を行う
        if (response.status === 401) {
          const confirmLogin = window.confirm('ログインが必要です。ログイン画面に移動しますか？')
          if (confirmLogin) {
            window.location.href = '/login'
          }
          return
        }
        
        // その他のエラーの場合は詳細情報を表示
        try {
          let errorData
          try {
            errorData = JSON.parse(responseText)
          } catch {
            errorData = { error: 'JSONパースエラー', details: responseText.substring(0, 500) }
          }
          const errorMessage = errorData.error || 'AI処理でエラーが発生しました'
          const errorDetails = errorData.details ? `\n詳細: ${errorData.details}` : ''
          const timestamp = errorData.timestamp ? `\n時刻: ${new Date(errorData.timestamp).toLocaleString()}` : ''
          alert(`${errorMessage}${errorDetails}${timestamp}`)
        } catch {
          alert(`AI処理でエラーが発生しました (HTTP ${response.status})\nレスポンス: ${responseText.substring(0, 200)}`)
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
      await navigator.clipboard.writeText(caption || '')
      alert('キャプションをコピーしました！')
    } catch (err) {
      console.error('コピーエラー:', err)
      alert('コピーに失敗しました')
    }
  }

  const copyHashtags = async () => {
    try {
      await navigator.clipboard.writeText(hashtags || '')
      alert('ハッシュタグをコピーしました！')
    } catch (err) {
      console.error('コピーエラー:', err)
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
        // 認証エラー（401）の場合は適切な処理を行う
        if (response.status === 401) {
          const confirmLogin = window.confirm('ログインが必要です。ログイン画面に移動しますか？')
          if (confirmLogin) {
            window.location.href = '/login'
          }
          return
        }
        
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
        // 認証エラー（401）の場合は適切な処理を行う
        if (response.status === 401) {
          const confirmLogin = window.confirm('ログインが必要です。ログイン画面に移動しますか？')
          if (confirmLogin) {
            window.location.href = '/login'
          }
          return
        }
        
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

  // CSS filterを実際の画像に適用
  const applyImageEffects = (imageSrc: string, imageEffectsObj: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        
        // エフェクトを適用
        if (ctx && imageEffectsObj?.filter) {
          ctx.filter = imageEffectsObj.filter
          ctx.drawImage(img, 0, 0)
          resolve(canvas.toDataURL('image/jpeg', 0.9))
        } else {
          // エフェクトがない場合は元画像を返す
          resolve(imageSrc)
        }
      }
      
      img.onerror = () => {
        console.error('画像読み込みエラー')
        resolve(imageSrc) // エラー時は元画像を返す
      }
      
      img.crossOrigin = 'anonymous'
      img.src = imageSrc
    })
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
          <div className="absolute top-0 right-0 flex space-x-2">
            {isLoggedIn ? (
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                ⚙️ 店舗設定
              </button>
            ) : (
              <>
                <button
                  onClick={() => window.location.href = '/register'}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  📝 新規登録
                </button>
                <button
                  onClick={() => window.location.href = '/login'}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  🔑 ログイン
                </button>
              </>
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

              {/* Instagram最適化ボタン */}
              {selectedImage && (
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">🚀 SNS最適化</h2>
                  
                  {/* 処理中表示 */}
                  {isInstagramOptimizing && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md mb-4">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                        SNS最適化中...
                      </div>
                      <p className="text-sm mt-1">
                        処理に60秒ほどかかる場合があります
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={handleInstagramOptimization}
                    disabled={isInstagramOptimizing}
                    className={`w-full font-medium py-3 px-4 rounded-lg transition-colors ${
                      isInstagramOptimizing
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white'
                    }`}
                  >
                                         {isInstagramOptimizing ? '最適化中...' : '🚀 SNS最適化を開始'}
                    {!isInstagramOptimizing && (
                      <div className="text-sm mt-1 opacity-90">
                        画像最適化・キャプション・ハッシュタグを一括生成
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* 右側：結果表示エリア */}
            <div className="space-y-4 sm:space-y-6">
              
              {/* 加工後画像 */}
              {processedImage && (
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4">
                    {optimizationResult ? '🚀 SNS最適化完了' : '✨ AI処理完了'}
                  </h2>
                  
                  <div className="space-y-6 mb-6">
                    <div>
                      <h3 className="font-medium mb-3">元画像</h3>
                      <img 
                        src={selectedImage || ''} 
                        alt="元画像" 
                        className="w-full h-64 sm:h-80 lg:h-96 object-cover rounded-lg border shadow-lg"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium mb-3">
                        {optimizationResult ? 'SNS最適化済み' : '処理済み画像'}
                      </h3>
                      <img 
                        src={processedImage} 
                        alt="処理済み画像" 
                        className="w-full h-64 sm:h-80 lg:h-96 object-cover rounded-lg border shadow-lg"
                      />
                    </div>
                  </div>

                                        {/* SNS最適化結果の詳細表示 */}
                  {optimizationResult && (
                    <div className="space-y-6">
                      {/* AI最適化レポート */}
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <h3 className="text-lg font-semibold text-purple-900 mb-3">
                          🤖 AI最適化レポート
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h4 className="font-medium text-purple-800 mb-2">📊 画像分析結果</h4>
                            <div className="space-y-1 text-purple-700">
                              <p><strong>料理の種類:</strong> {optimizationResult.originalAnalysis.foodType}</p>
                              {optimizationResult.originalAnalysis.compositionIssues.length > 0 && (
                                <p><strong>構図の改善点:</strong> {optimizationResult.originalAnalysis.compositionIssues.join(', ')}</p>
                              )}
                              {optimizationResult.originalAnalysis.lightingIssues.length > 0 && (
                                <p><strong>照明の改善点:</strong> {optimizationResult.originalAnalysis.lightingIssues.join(', ')}</p>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-purple-800 mb-2">✨ 適用した最適化</h4>
                            <ul className="space-y-1 text-purple-700">
                              {optimizationResult.appliedOptimizations.map((opt: string, index: number) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-purple-500 mr-2">•</span>
                                  <span>{opt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Instagram効果説明 */}
                      <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                        <h4 className="font-medium text-pink-900 mb-2">📈 SNS効果</h4>
                        <p className="text-sm text-pink-700">
                          💡 この最適化により、より多くの「いいね」や「保存」を獲得しやすくなります。
                          AIが分析した結果に基づいて、照明・構図・色彩を最適化し、魅力的なキャプションとハッシュタグを生成しました。
                          SNS映えする投稿として、高いエンゲージメントが期待できます。
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 従来の処理結果表示 */}
                  {!optimizationResult && (
                    <div className="space-y-4 mb-4">
                      {imageAnalysis && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h3 className="font-medium text-blue-900 mb-2">🔍 画像分析</h3>
                          <p className="text-blue-700 text-sm">{imageAnalysis}</p>
                        </div>
                      )}
                      
                      {processingDetails && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h3 className="font-medium text-green-900 mb-2">⚙️ 処理詳細</h3>
                          <p className="text-green-700 text-sm">{processingDetails}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ダウンロード・シェアボタン */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t">
                    <button
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = processedImage
                        link.download = `instadish-optimized-${Date.now()}.jpg`
                        link.click()
                      }}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      📥 最適化画像をダウンロード
                    </button>
                    
                    {optimizationResult && (
                      <>
                        <button
                          onClick={() => {
                            const shareText = `${optimizationResult.caption}\n\n${optimizationResult.hashtags}`
                            navigator.clipboard.writeText(shareText)
                            alert('投稿用テキスト（キャプション+ハッシュタグ）をコピーしました！')
                          }}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                          📋 投稿用テキストをコピー
                        </button>
                        
                        <button
                          onClick={() => {
                            const reportText = `InstaDish Pro - AI最適化レポート\n\n📊 料理: ${optimizationResult.originalAnalysis.foodType}\n✨ 最適化: ${optimizationResult.appliedOptimizations.join(', ')}\n💡 アドバイス: ${optimizationResult.photographyAdvice}\n\n#InstaDishPro #料理写真 #Instagram最適化`
                            navigator.clipboard.writeText(reportText)
                            alert('最適化レポートをコピーしました！')
                          }}
                          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                          📊 レポートをコピー
                        </button>
                      </>
                    )}
                  </div>
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
                      value={caption || ''}
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
                      value={hashtags ? hashtags.split(' ').filter((tag: string) => tag.trim() !== '').join('\n') : ''}
                      onChange={(e) => setHashtags(e.target.value.split('\n').join(' '))}
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