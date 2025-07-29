import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { createOptimizedOpenAIClient } from '@/lib/ai-utils'
import { supabase } from '@/lib/supabase'
import OpenAI from 'openai'
import sharp from 'sharp'

// ビルド時の事前レンダリングを無効にする
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// CSS フィルターを使用した画像処理のエフェクト生成（5段階に拡張）
function generateImageEffects(effectStrength: string) {
  switch (effectStrength) {
    case 'very-weak':
      return {
        filter: 'brightness(1.03) contrast(1.02) saturate(1.05) hue-rotate(1deg)',
        description: '最小調整: 明度+3%, 彩度+5%, コントラスト+2% - ほぼ自然な上品仕上がり'
      }
    case 'weak':
      return {
        filter: 'brightness(1.08) contrast(1.05) saturate(1.12) hue-rotate(3deg)',
        description: '軽微な調整: 明度+8%, 彩度+12%, コントラスト+5% - 自然な美味しさを保持'
      }
    case 'normal':
      return {
        filter: 'brightness(1.15) contrast(1.12) saturate(1.25) hue-rotate(5deg)',
        description: '標準調整: 明度+15%, 彩度+25%, コントラスト+12% - バランスの良い食欲増進効果'
      }
    case 'strong':
      return {
        filter: 'brightness(1.25) contrast(1.18) saturate(1.35) hue-rotate(8deg) sepia(0.08)',
        description: '強力調整: 明度+25%, 彩度+35%, コントラスト+18%, 暖色調整 - インパクトのある美味しさ強調'
      }
    case 'very-strong':
      return {
        filter: 'brightness(1.35) contrast(1.25) saturate(1.45) hue-rotate(12deg) sepia(0.15)',
        description: '最強調整: 明度+35%, 彩度+45%, コントラスト+25%, 暖色強調 - 極限まで魅力を引き出す'
      }
    default:
      return {
        filter: 'brightness(1.15) contrast(1.12) saturate(1.25) hue-rotate(5deg)',
        description: '標準調整を適用'
      }
  }
}

// 最適化強度の設定（エフェクト強度対応）
function getOptimizationStrength(type: 'brightness' | 'contrast' | 'saturation' | 'gamma' | 'sharpen', optimizations: string[], effectStrength?: string): number {
  const baseValues = {
    brightness: { 'very-weak': 1.02, weak: 1.05, normal: 1.1, strong: 1.15, 'very-strong': 1.2 },
    contrast: { 'very-weak': 1.02, weak: 1.08, normal: 1.15, strong: 1.2, 'very-strong': 1.3 },
    saturation: { 'very-weak': 1.05, weak: 1.1, normal: 1.2, strong: 1.3, 'very-strong': 1.4 },
    gamma: { 'very-weak': 1.02, weak: 1.05, normal: 1.1, strong: 1.15, 'very-strong': 1.2 },
    sharpen: { 'very-weak': 0.8, weak: 1.0, normal: 1.2, strong: 1.5, 'very-strong': 2.0 }
  }
  
  const strength = effectStrength || 'normal'
  return baseValues[type][strength as keyof typeof baseValues[typeof type]] || baseValues[type].normal
}

// 画像処理用ユーティリティ関数 - 最適化版
async function processImageWithSharp(base64Image: string, processingFn: (sharp: sharp.Sharp) => sharp.Sharp): Promise<string> {
  try {
    const processStart = Date.now()
    
    // base64からバッファを作成
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')
    
    // Sharpで画像を処理（最適化設定）
    const sharpImage = sharp(imageBuffer, {
      failOnError: false,  // エラー時も処理を継続
      density: 150,        // 適度な解像度に制限
      limitInputPixels: 268402689  // 最大ピクセル数制限（16384x16384）
    })
    
    const processedImage = processingFn(sharpImage)
    
    // 処理後の画像をbase64に変換（最適化設定）
    const outputBuffer = await processedImage
      .jpeg({ 
        quality: 85,           // 品質を85に調整（サイズと品質のバランス）
        progressive: true,     // プログレッシブJPEG
        mozjpeg: true         // mozjpegエンコーダ使用
      })
      .toBuffer()
    
    const outputBase64 = `data:image/jpeg;base64,${outputBuffer.toString('base64')}`
    
    console.log(`Sharp処理完了: ${Date.now() - processStart}ms`)
    return outputBase64
  } catch (error) {
    console.error('画像処理エラー:', error)
    throw new Error('画像処理に失敗しました')
  }
}

interface ImageAnalysisResult {
  foodType: string
  compositionIssues: string[]
  lightingIssues: string[]
  colorIssues: string[]
  backgroundIssues: string[]
  recommendedOptimizations: string[]
}

interface OptimizationResult {
  appliedOptimizations: string[]
  processingTime: number
  originalAnalysis: ImageAnalysisResult
  optimizedImage: string
  caption: string
  hashtags: string
  photographyAdvice: string
  imageEffects?: any
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 認証チェック
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }
    const session = await validateSession(token)
    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { image, mode = 'auto', effectStrength = 'normal' } = await request.json()
    const openai = createOptimizedOpenAIClient()
    
    if (!image) {
      return NextResponse.json(
        { 
          error: '画像が必要です',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    let result: any
    
    if (mode === 'auto') {
      // 自動最適化モード（画像最適化＋キャプション生成）
      result = await performCompleteOptimization(openai, image, session.id, effectStrength)
    } else {
      // 手動編集モード（既存機能）
      const { editType, options } = await request.json()
      result = await performManualEdit(openai, image, editType, options)
    }

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      result: result,
      processingTime,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI画像編集エラー:', error)
    return NextResponse.json(
      { 
        error: 'AI画像編集に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// 完全最適化処理（画像最適化＋キャプション生成）- 最適化版
async function performCompleteOptimization(openai: OpenAI, image: string, storeId: string, effectStrength: string = 'normal'): Promise<OptimizationResult> {
  const startTime = Date.now()
  
  // Step 1: 画像分析と店舗情報取得を並列実行
  const [analysis, storeInfo] = await Promise.all([
    analyzeImageForInstagram(openai, image),
    getStoreInfo(storeId)
  ])
  
  console.log(`分析・店舗情報取得完了: ${Date.now() - startTime}ms`)
  
  // Step 2: 画像最適化とコンテンツ生成を並列実行
  const [optimizedImage, contentAndAdvice] = await Promise.all([
    applyOptimizations(openai, image, analysis),
    generateContentAndAdvice(openai, image, analysis, storeInfo)
  ])
  
  console.log(`最適化・コンテンツ生成完了: ${Date.now() - startTime}ms`)
  
  // エフェクト強度に応じた画像エフェクト生成
  const imageEffects = generateImageEffects(effectStrength)
  
  return {
    appliedOptimizations: analysis.recommendedOptimizations,
    processingTime: Date.now() - startTime,
    originalAnalysis: analysis,
    optimizedImage,
    caption: contentAndAdvice.caption,
    hashtags: contentAndAdvice.hashtags,
    photographyAdvice: contentAndAdvice.photographyAdvice,
    imageEffects
  }
}

// 店舗情報キャッシュ（簡易版）
const storeInfoCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5分

// 店舗情報取得 - キャッシュ対応版
async function getStoreInfo(storeId: string) {
  try {
    // キャッシュチェック
    const cached = storeInfoCache.get(storeId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('店舗情報キャッシュヒット')
      return cached.data
    }

    // 環境変数チェック
    if (!supabase) {
      console.log('Supabase未設定、デフォルト店舗情報を使用')
      return {
        name: 'デフォルト店舗',
        store_description: '美味しい料理を提供するお店',
        fixed_caption: '',
        fixed_hashtags: ''
      }
    }
    
    const { data, error } = await supabase
      .from('stores')
      .select('name, store_description, fixed_caption, fixed_hashtags')
      .eq('id', storeId)
      .single()
    
    if (error) {
      console.error('店舗情報取得エラー:', error)
      return null
    }
    
    // キャッシュに保存
    storeInfoCache.set(storeId, { data, timestamp: Date.now() })
    console.log('店舗情報をキャッシュに保存')
    
    return data
  } catch (error) {
    console.error('店舗情報取得エラー:', error)
    return null
  }
}

// 統合コンテンツ生成（キャプション・ハッシュタグ・撮影アドバイス）- 最適化版
async function generateContentAndAdvice(openai: OpenAI, image: string, analysis: ImageAnalysisResult, storeInfo: any) {
  // 画像形式の検証
  if (!isValidImageFormat(image)) {
    console.error('無効な画像形式が検出されました。フォールバック処理を実行します。')
    return generateFallbackContent(analysis, storeInfo)
  }

  // 3つのAPI呼び出しを並列実行（処理時間短縮）
  const startTime = Date.now()
  
  try {
    const [captionResult, hashtagsResult, adviceResult] = await Promise.all([
      // キャプション生成（簡潔プロンプト）
      generateCaptionOptimized(openai, image, analysis, storeInfo),
      // ハッシュタグ生成（簡潔プロンプト）
      generateHashtagsOptimized(openai, analysis, storeInfo),
      // 撮影アドバイス生成（テキストのみ、画像不要）
      generateAdviceOptimized(openai, analysis)
    ])

    console.log(`並列コンテンツ生成完了: ${Date.now() - startTime}ms`)
    
    return {
      caption: captionResult,
      hashtags: hashtagsResult,
      photographyAdvice: adviceResult
    }
  } catch (error) {
    console.error('並列コンテンツ生成エラー:', error)
    return generateFallbackContent(analysis, storeInfo)
  }
}

// 画像形式検証関数
function isValidImageFormat(image: string): boolean {
  try {
    const header = image.substring(0, 50)
    return header.includes('data:image/') && 
           (header.includes('jpeg') || header.includes('jpg') || header.includes('png')) &&
           header.includes('base64')
  } catch (error) {
    return false
  }
}

// フォールバック処理
function generateFallbackContent(analysis: ImageAnalysisResult, storeInfo: any) {
  return {
    caption: `美味しそうな${analysis.foodType}をご用意しました🍽️ 心を込めて作りました✨`,
    hashtags: `#${analysis.foodType} #美味しい #手作り #料理 #グルメ #instafood #foodie #yummy #delicious #foodstagram`,
    photographyAdvice: '自然光での撮影、背景をシンプルに、料理を中心に配置することをお勧めします。'
  }
}

// キャプション生成（最適化版）
async function generateCaptionOptimized(openai: OpenAI, image: string, analysis: ImageAnalysisResult, storeInfo: any) {
  const prompt = `${analysis.foodType}のキャプションを生成。店舗: ${storeInfo?.name || ''}。150文字以内、絵文字含む。`
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0.4
    })

    const caption = response.choices[0]?.message?.content || `美味しそうな${analysis.foodType}をご用意しました🍽️`
    
    return storeInfo?.fixed_caption 
      ? `${caption}\n\n${storeInfo.fixed_caption}`
      : caption
  } catch (error) {
    console.error('キャプション生成エラー:', error)
    return `美味しそうな${analysis.foodType}をご用意しました🍽️ 心を込めて作りました✨`
  }
}

// ハッシュタグ生成（最適化版）
async function generateHashtagsOptimized(openai: OpenAI, analysis: ImageAnalysisResult, storeInfo: any) {
  const prompt = `${analysis.foodType}のハッシュタグを正確に10個生成してください。
  
出力形式：#タグ1 #タグ2 #タグ3 #タグ4 #タグ5 #タグ6 #タグ7 #タグ8 #タグ9 #タグ10

日本語5個、英語5個。説明文は不要です。ハッシュタグのみを出力してください。`
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.3
    })

    const generatedContent = response.choices[0]?.message?.content || ''
    
    // ハッシュタグのみを抽出（#で始まる文字列のみ）
    const hashtagPattern = /#[a-zA-Z0-9ぁ-んァ-ヶー一-龠]+/g
    const extractedTags = generatedContent.match(hashtagPattern) || []
    
    // 基本ハッシュタグ（フォールバック）
    const fallbackTags = [
      `#${analysis.foodType}`, '#美味しい', '#手作り', '#料理', '#グルメ', 
      '#instafood', '#foodie', '#yummy', '#delicious', '#foodstagram'
    ]
    
    // 生成されたタグを使用、足りない場合はフォールバックで補完
    const finalTags = extractedTags.length >= 5 ? extractedTags.slice(0, 10) : fallbackTags
    
         // 固定ハッシュタグを追加
     const fixedTags = storeInfo?.fixed_hashtags || ''
     const fixedTagsArray = fixedTags.split(/\s+/).filter((tag: string) => tag.startsWith('#'))
    
         // 重複を避けて結合
     const allTags = [...finalTags]
     fixedTagsArray.forEach((tag: string) => {
       if (!allTags.includes(tag)) {
         allTags.push(tag)
       }
     })
    
    return allTags.join(' ')
    
  } catch (error) {
    console.error('ハッシュタグ生成エラー:', error)
    return `#${analysis.foodType} #美味しい #手作り #料理 #グルメ #instafood #foodie #yummy #delicious #foodstagram`
  }
}

// 撮影アドバイス生成（最適化版）
async function generateAdviceOptimized(openai: OpenAI, analysis: ImageAnalysisResult) {
  const prompt = `${analysis.foodType}の撮影アドバイスを3点、各30文字以内。問題点: ${analysis.compositionIssues.join(', ')}`
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.3
    })

    return response.choices[0]?.message?.content || 
      '自然光での撮影、背景をシンプルに、料理を中心に配置することをお勧めします。'
  } catch (error) {
    console.error('撮影アドバイス生成エラー:', error)
    return '自然光での撮影、背景をシンプルに、料理を中心に配置することをお勧めします。'
  }
}

// 撮影アドバイス生成（旧版 - 互換性のため残存）
async function generatePhotographyAdvice(openai: OpenAI, analysis: ImageAnalysisResult) {
  const prompt = `
この料理写真の分析結果に基づいて、次回の撮影時により良い写真を撮るためのアドバイスを生成してください。

分析結果：
- 料理の種類: ${analysis.foodType}
- 構図の問題点: ${analysis.compositionIssues.join(', ')}
- 照明の問題点: ${analysis.lightingIssues.join(', ')}
- 色彩の問題点: ${analysis.colorIssues.join(', ')}
- 背景の問題点: ${analysis.backgroundIssues.join(', ')}

具体的で実践的なアドバイスを3-5点、各50文字以内で簡潔に教えてください。
`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.5
    })

    return response.choices[0]?.message?.content || '自然光での撮影、背景をシンプルに、料理を中心に配置することをお勧めします。'
  } catch (error) {
    console.error('撮影アドバイス生成エラー:', error)
    return '自然光での撮影、背景をシンプルに、料理を中心に配置することをお勧めします。'
  }
}

// SNS向け画像分析（最適化版）
async function analyzeImageForInstagram(openai: OpenAI, image: string): Promise<ImageAnalysisResult> {
  const analysisPrompt = `この料理写真を分析してください。
  
JSON形式で回答：
{
  "foodType": "具体的な料理名",
  "compositionIssues": ["構図の問題点"],
  "lightingIssues": ["照明の問題点"], 
  "colorIssues": ["色彩の問題点"],
  "backgroundIssues": ["背景の問題点"],
  "recommendedOptimizations": ["照明最適化", "色彩強調", "背景ぼかし", "構図調整", "テクスチャ強調"]
}`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: analysisPrompt },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ],
      max_tokens: 600,
      temperature: 0.2
    })

    const analysisText = response.choices[0]?.message?.content
    if (!analysisText) {
      throw new Error('分析結果を取得できませんでした')
    }

    // JSONを抽出
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('分析結果のJSON形式が正しくありません')
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('画像分析エラー:', error)
    // フォールバック分析
    return {
      foodType: "一般的な料理",
      compositionIssues: ["構図の改善が必要"],
      lightingIssues: ["照明の最適化が必要"],
      colorIssues: ["色彩の調整が必要"],
      backgroundIssues: ["背景の整理が必要"],
      recommendedOptimizations: ["照明最適化", "色彩強調", "背景ぼかし", "構図調整"]
    }
  }
}

// AI品質チェック結果の型定義
interface QualityCheckResult {
  needsReprocessing: boolean
  issues: string[]
  suggestion?: string
}

// AI品質チェック機能
async function performQualityCheck(openai: OpenAI, processedImage: string): Promise<QualityCheckResult> {
  try {
    console.log('AI品質チェック開始')
    const startTime = Date.now()
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user", 
        content: [
          { 
            type: "text", 
            text: `この処理済み料理写真の品質を判定してください。以下の問題がないかチェック：
            1. 白飛び（明るすぎて詳細が失われている部分）
            2. 黒つぶれ（暗すぎて詳細が見えない部分）  
            3. 不自然な色調（現実離れした色合い）
            4. SNSで魅力的に見えるか
            
            JSON形式で回答：{"needsReprocessing": true/false, "issues": ["問題点1", "問題点2"], "suggestion": "改善提案"}
            問題がなければneedsReprocessing: false、issuesは空配列で返してください。` 
          },
          { type: "image_url", image_url: { url: processedImage } }
        ]
      }],
      max_tokens: 300,
      temperature: 0.3
    })
    
    const content = response.choices[0]?.message?.content || '{"needsReprocessing": false, "issues": []}'
    const result = JSON.parse(content)
    
    console.log(`AI品質チェック完了: ${Date.now() - startTime}ms`, result)
    return result
    
  } catch (error) {
    console.error('AI品質チェックエラー:', error)
    // エラーの場合は品質OK扱いで処理続行
    return { needsReprocessing: false, issues: [] }
  }
}

// 品質保証付き画像処理
async function processImageWithQualityAssurance(openai: OpenAI, image: string, analysis: ImageAnalysisResult): Promise<string> {
  const maxRetries = 3
  const strengthVariations = [
    { brightness: 1.05, saturation: 1.1, gamma: 1.05, contrast: 1.1 },  // 弱め
    { brightness: 1.1, saturation: 1.2, gamma: 1.1, contrast: 1.15 },   // 標準
    { brightness: 1.08, saturation: 1.15, gamma: 1.08, contrast: 1.12 }  // 中間
  ]
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`品質保証付き処理: 試行${attempt + 1}回目`)
      const params = strengthVariations[attempt]
      
      // 画像処理パラメータを調整して処理
      const processedImage = await processImageWithSharp(image, (sharp) => {
        return sharp
          .modulate({ brightness: params.brightness, saturation: params.saturation })
          .gamma(params.gamma)
          .linear(params.contrast, 0)
          .sharpen({ sigma: 1.2 })
          .trim({ threshold: 10 })
      })
      
      // AI品質チェック
      const qualityCheck = await performQualityCheck(openai, processedImage)
      
      if (!qualityCheck.needsReprocessing) {
        console.log(`品質チェック合格: 試行${attempt + 1}回目`)
        return processedImage
      }
      
      console.log(`品質チェック不合格: 試行${attempt + 1}回目`, {
        issues: qualityCheck.issues,
        suggestion: qualityCheck.suggestion
      })
      
    } catch (error) {
      console.error(`品質保証処理エラー（試行${attempt + 1}）:`, error)
    }
  }
  
  // 最大試行回数に達した場合は標準パラメータで最終処理
  console.log('品質チェック: 最大試行回数に達しました。標準処理で完了します。')
  return await processImageWithSharp(image, (sharp) => {
    return sharp
      .modulate({ brightness: 1.1, saturation: 1.2 })
      .gamma(1.1)
      .linear(1.15, 0)
      .sharpen({ sigma: 1.2 })
      .trim({ threshold: 10 })
  })
}

// 分析結果に基づく最適化適用（品質保証版）- 統合最適化版
async function applyOptimizations(openai: OpenAI, image: string, analysis: ImageAnalysisResult): Promise<string> {
  try {
    console.log('品質保証付き統合画像最適化開始:', analysis.recommendedOptimizations)
    const startTime = Date.now()
    
    // 品質保証付き処理を実行
    const processedImage = await processImageWithQualityAssurance(openai, image, analysis)
    
    console.log(`品質保証付き統合画像最適化完了: ${Date.now() - startTime}ms`)
    return processedImage
    
  } catch (error) {
    console.error('統合画像最適化エラー:', error)
    // エラーの場合は元画像を返す
    return image
  }
}



// 手動編集処理（既存機能）
async function performManualEdit(openai: OpenAI, image: string, editType: string, options: any) {
  switch (editType) {
    case 'background_blur':
      return await processBackgroundBlur(openai, image, options)
    case 'lighting_enhancement':
      return await processLightingEnhancement(openai, image, options)
    case 'composition_optimization':
      return await processCompositionOptimization(openai, image, options)
    case 'style_transfer':
      return await processStyleTransfer(openai, image, options)
    case 'texture_enhancement':
      return await processTextureEnhancement(openai, image, options)
    default:
      throw new Error('未対応の編集タイプです')
  }
}

// 背景ボケ効果処理
async function processBackgroundBlur(openai: OpenAI, image: string, options: any) {
  try {
    const blurStrength = options.blurStrength || 50
    const effectStrength = options.effectStrength || 'normal'
    console.log(`背景ぼかし処理開始（強度: ${blurStrength}%, エフェクト: ${effectStrength}）`)
    
    // 背景ぼかしの近似処理（シャープネス強調で被写体を際立たせる）
    const processedImage = await processImageWithSharp(image, (sharp) => 
      sharp.sharpen({ sigma: getOptimizationStrength('sharpen', [], effectStrength) + (blurStrength / 100) })
    )
    
    console.log('背景ぼかし処理完了')
    return { url: processedImage }
  } catch (error) {
    console.error('背景ぼかし処理エラー:', error)
    return { url: image }
  }
}

// 照明最適化処理
async function processLightingEnhancement(openai: OpenAI, image: string, options: any) {
  try {
    const lightingType = options.lightingType || 'natural'
    const effectStrength = options.effectStrength || 'normal'
    console.log(`照明最適化処理開始（タイプ: ${lightingType}, エフェクト: ${effectStrength}）`)
    
    let processedImage = image
    
    switch (lightingType) {
      case 'bright':
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.modulate({ brightness: getOptimizationStrength('brightness', [], effectStrength) + 0.1 })
               .linear(getOptimizationStrength('contrast', [], effectStrength), 0)
        )
        break
      case 'warm':
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.modulate({ brightness: getOptimizationStrength('brightness', [], effectStrength) })
               .tint({ r: 255, g: 240, b: 220 })
        )
        break
      case 'dramatic':
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.linear(getOptimizationStrength('contrast', [], effectStrength) + 0.1, -10)
               .modulate({ saturation: getOptimizationStrength('saturation', [], effectStrength) })
        )
        break
      case 'studio':
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.modulate({ brightness: getOptimizationStrength('brightness', [], effectStrength) + 0.05 })
               .linear(getOptimizationStrength('contrast', [], effectStrength), 0)
        )
        break
      default: // natural
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.modulate({ brightness: getOptimizationStrength('brightness', [], effectStrength) })
               .linear(getOptimizationStrength('contrast', [], effectStrength), 0)
        )
    }
    
    console.log('照明最適化処理完了')
    return { url: processedImage }
  } catch (error) {
    console.error('照明最適化処理エラー:', error)
    return { url: image }
  }
}

// 構図最適化処理
async function processCompositionOptimization(openai: OpenAI, image: string, options: any) {
  try {
    const compositionStyle = options.compositionStyle || 'overhead'
    console.log(`構図最適化処理開始（スタイル: ${compositionStyle}）`)
    
    let processedImage = image
    
    switch (compositionStyle) {
      case 'centered':
        // 中央配置の場合は余分な部分を軽微にトリミング
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.trim({ threshold: 5 })
        )
        break
      case 'closeup':
        // クローズアップの場合は周辺をトリミング
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.trim({ threshold: 15 })
        )
        break
      case 'wide':
        // 広角の場合は基本的な調整のみ
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.trim({ threshold: 2 })
        )
        break
      default:
        // デフォルト（overhead, angle45等）は軽微なトリミング
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.trim({ threshold: 10 })
        )
    }
    
    console.log('構図最適化処理完了')
    return { url: processedImage }
  } catch (error) {
    console.error('構図最適化処理エラー:', error)
    return { url: image }
  }
}

// スタイル転送処理
async function processStyleTransfer(openai: OpenAI, image: string, options: any) {
  try {
    const style = options.style || 'modern'
    console.log(`スタイル転送処理開始（スタイル: ${style}）`)
    
    let processedImage = image
    
    switch (style) {
      case 'vintage':
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.modulate({ brightness: 0.95, saturation: 0.8 })
            .tint({ r: 255, g: 235, b: 205 })
        )
        break
      case 'modern':
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.modulate({ brightness: 1.1, saturation: 1.2 })
            .linear(1.15, 0)
        )
        break
      case 'rustic':
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.modulate({ brightness: 0.9, saturation: 0.9 })
            .tint({ r: 255, g: 220, b: 180 })
        )
        break
      case 'elegant':
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.modulate({ brightness: 1.05, saturation: 1.1 })
            .linear(1.1, 0)
        )
        break
      default: // casual
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.modulate({ brightness: 1.05, saturation: 1.15 })
        )
    }
    
    console.log('スタイル転送処理完了')
    return { url: processedImage }
  } catch (error) {
    console.error('スタイル転送処理エラー:', error)
    return { url: image }
  }
}

// テクスチャ強調処理
async function processTextureEnhancement(openai: OpenAI, image: string, options: any) {
  try {
    const enhancementType = options.enhancementType || 'general'
    console.log(`テクスチャ強調処理開始（タイプ: ${enhancementType}）`)
    
    let processedImage = image
    
    switch (enhancementType) {
      case 'crispy':
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.sharpen({ sigma: 2.0 }).linear(1.2, 0)
        )
        break
      case 'smooth':
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.median(3).modulate({ saturation: 1.1 })
        )
        break
      case 'juicy':
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.modulate({ saturation: 1.3 }).linear(1.1, 0)
        )
        break
      case 'fresh':
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.sharpen({ sigma: 1.2 }).modulate({ saturation: 1.2, brightness: 1.05 })
        )
        break
      default: // general
        processedImage = await processImageWithSharp(image, (sharp) => 
          sharp.sharpen({ sigma: 1.5 }).linear(1.1, 0)
        )
    }
    
    console.log('テクスチャ強調処理完了')
    return { url: processedImage }
  } catch (error) {
    console.error('テクスチャ強調処理エラー:', error)
    return { url: image }
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Image Edit API (Production Ready)',
    status: 'active',
    version: '1.0.0',
    features: [
      '背景ボケ効果（Background Blur）',
      '照明最適化（Lighting Enhancement）',
      '構図最適化（Composition Optimization）',
      'スタイル転送（Style Transfer）',
      'テクスチャ強調（Texture Enhancement）'
    ],
    supportedEditTypes: {
      background_blur: {
        description: '背景をボケさせて被写体を強調',
        options: { blurStrength: 'number (0-100)' }
      },
      lighting_enhancement: {
        description: '照明効果を最適化',
        options: { lightingType: 'natural|studio|warm|dramatic|bright' }
      },
      composition_optimization: {
        description: '構図を最適化',
        options: { compositionStyle: 'overhead|angle45|closeup|wide|centered' }
      },
      style_transfer: {
        description: '写真のスタイルを変更',
        options: { style: 'vintage|modern|rustic|elegant|casual' }
      },
      texture_enhancement: {
        description: '食材のテクスチャを強調',
        options: { enhancementType: 'general|crispy|smooth|juicy|fresh' }
      }
    },
    model: 'dall-e-3',
    processingTime: '10-30秒程度',
    cost: '約$0.04-0.12/画像'
  })
} 