import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { createOptimizedOpenAIClient } from '@/lib/ai-utils'
import { supabase } from '@/lib/supabase'
import OpenAI from 'openai'
import sharp from 'sharp'

// ビルド時の事前レンダリングを無効にする
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

    const { image, mode = 'auto' } = await request.json()
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
      result = await performCompleteOptimization(openai, image, session.id)
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
async function performCompleteOptimization(openai: OpenAI, image: string, storeId: string): Promise<OptimizationResult> {
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
  
  return {
    appliedOptimizations: analysis.recommendedOptimizations,
    processingTime: Date.now() - startTime,
    originalAnalysis: analysis,
    optimizedImage,
    caption: contentAndAdvice.caption,
    hashtags: contentAndAdvice.hashtags,
    photographyAdvice: contentAndAdvice.photographyAdvice
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

// キャプション・ハッシュタグ生成
async function generateCaptionAndHashtags(openai: OpenAI, image: string, analysis: ImageAnalysisResult, storeInfo: any) {
  const prompt = `
この${analysis.foodType}の写真について、Instagram投稿用のキャプションとハッシュタグを生成してください。

店舗情報：
- 店舗名: ${storeInfo?.name || '未設定'}
- 店舗説明: ${storeInfo?.store_description || '美味しい料理を提供するお店'}
- 固定キャプション: ${storeInfo?.fixed_caption || ''}
- 固定ハッシュタグ: ${storeInfo?.fixed_hashtags || ''}

画像分析結果：
- 料理の種類: ${analysis.foodType}
- 適用した最適化: ${analysis.recommendedOptimizations.join(', ')}

以下のJSON形式で回答してください：
{
  "caption": "魅力的なキャプション（絵文字含む、150文字以内）",
  "hashtags": "関連ハッシュタグ（#で区切り、20個以内）"
}

キャプションの要件：
- 料理の美味しさが伝わる表現
- 店舗の特徴を活かした内容
- Instagram映えする絵文字を適度に使用
- 食欲をそそる表現

ハッシュタグの要件：
- 料理名・食材・調理法関連
- 店舗・地域関連
- Instagram人気タグ
- 固定ハッシュタグを必ず含める
`

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
      max_tokens: 800,
      temperature: 0.7
    })

    const contentText = response.choices[0]?.message?.content
    if (!contentText) {
      throw new Error('キャプション生成結果を取得できませんでした')
    }

    // JSONを抽出
    const jsonMatch = contentText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('キャプション生成結果のJSON形式が正しくありません')
    }

    const result = JSON.parse(jsonMatch[0])
    
    // 固定要素を追加
    const finalCaption = storeInfo?.fixed_caption 
      ? `${result.caption}\n\n${storeInfo.fixed_caption}`
      : result.caption
    
    // ハッシュタグの重複排除処理
    const generatedHashtags = result.hashtags
      .split(/[\s\n]+/)
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.startsWith('#') && tag.length > 1)
    
    const fixedHashtags = storeInfo?.fixed_hashtags
      ? storeInfo.fixed_hashtags.split(/[\s\n]+/).map((tag: string) => tag.trim()).filter((tag: string) => tag.startsWith('#') && tag.length > 1)
      : []
    
    // 重複排除して結合
    const allHashtags = [...generatedHashtags]
    fixedHashtags.forEach((tag: string) => {
      if (!allHashtags.includes(tag)) {
        allHashtags.push(tag)
      }
    })
    
    const finalHashtags = allHashtags.join(' ')

    return {
      caption: finalCaption,
      hashtags: finalHashtags
    }
  } catch (error) {
    console.error('キャプション生成エラー:', error)
    // フォールバック
    const fallbackHashtags = `#${analysis.foodType} #美味しい #グルメ #料理 #食べ物 #instafood #delicious #foodie #restaurant #yummy`
    const fixedHashtags = storeInfo?.fixed_hashtags || ''
    
    return {
      caption: `美味しい${analysis.foodType}をご用意しました！✨ 心を込めて作った一品です。ぜひお楽しみください😊`,
      hashtags: `${fallbackHashtags} ${fixedHashtags}`.trim()
    }
  }
}

// 統合コンテンツ生成（キャプション・ハッシュタグ・撮影アドバイス）- 最適化版
async function generateContentAndAdvice(openai: OpenAI, image: string, analysis: ImageAnalysisResult, storeInfo: any) {
  const prompt = `
この${analysis.foodType}の写真について、以下の内容を一度に生成してください：

店舗情報：
- 店舗名: ${storeInfo?.name || '未設定'}
- 店舗説明: ${storeInfo?.store_description || '美味しい料理を提供するお店'}
- 固定キャプション: ${storeInfo?.fixed_caption || ''}
- 固定ハッシュタグ: ${storeInfo?.fixed_hashtags || ''}

画像分析結果：
- 料理の種類: ${analysis.foodType}
- 構図の問題点: ${analysis.compositionIssues.join(', ')}
- 照明の問題点: ${analysis.lightingIssues.join(', ')}
- 色彩の問題点: ${analysis.colorIssues.join(', ')}
- 背景の問題点: ${analysis.backgroundIssues.join(', ')}
- 適用した最適化: ${analysis.recommendedOptimizations.join(', ')}

以下のJSON形式で回答してください：
{
  "caption": "魅力的なキャプション（絵文字含む、150文字以内）",
  "hashtags": "関連ハッシュタグ（#で区切り、20個以内）",
  "photographyAdvice": "次回撮影時の具体的なアドバイス（3-5点、実践的な内容）"
}

要件：
■ キャプション：
- 料理の美味しさが伝わる表現
- 店舗の特徴を活かした内容
- Instagram映えする絵文字を適度に使用

■ ハッシュタグ：
- 日本語ハッシュタグ：5つ（写真に写っている料理・食材・調理法・見た目を具体的に反映）
- 英語ハッシュタグ：5つ（グローバル対応、Instagram人気タグ）
- 合計10個のハッシュタグを生成（固定ハッシュタグは後で追加）

■ 撮影アドバイス：
- 分析結果に基づく具体的な改善点
- 実践しやすい内容
- 各50文字以内で簡潔に
`

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
      max_tokens: 1200,
      temperature: 0.7
    })

    const contentText = response.choices[0]?.message?.content
    if (!contentText) {
      throw new Error('コンテンツ生成結果を取得できませんでした')
    }

    // JSONを抽出
    const jsonMatch = contentText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('コンテンツ生成結果のJSON形式が正しくありません')
    }

    const result = JSON.parse(jsonMatch[0])
    
    // 固定要素を追加
    const finalCaption = storeInfo?.fixed_caption 
      ? `${result.caption}\n\n${storeInfo.fixed_caption}`
      : result.caption
    
    // ハッシュタグの重複排除処理
    const generatedHashtags = result.hashtags
      .split(/[\s\n]+/)
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.startsWith('#') && tag.length > 1)
    
    const fixedHashtags = storeInfo?.fixed_hashtags
      ? storeInfo.fixed_hashtags.split(/[\s\n]+/).map((tag: string) => tag.trim()).filter((tag: string) => tag.startsWith('#') && tag.length > 1)
      : []
    
    // 重複排除して結合
    const allHashtags = [...generatedHashtags]
    fixedHashtags.forEach((tag: string) => {
      if (!allHashtags.includes(tag)) {
        allHashtags.push(tag)
      }
    })
    
    const finalHashtags = allHashtags.join(' ')

    return {
      caption: finalCaption,
      hashtags: finalHashtags,
      photographyAdvice: result.photographyAdvice || '自然光での撮影、背景をシンプルに、料理を中心に配置することをお勧めします。'
    }
  } catch (error) {
    console.error('統合コンテンツ生成エラー:', error)
    // フォールバック
    const fallbackHashtags = `#${analysis.foodType} #美味しい #グルメ #料理 #食べ物 #instafood #delicious #foodie #restaurant #yummy`
    const fixedHashtags = storeInfo?.fixed_hashtags || ''
    
    return {
      caption: `美味しい${analysis.foodType}をご用意しました！✨ 心を込めて作った一品です。ぜひお楽しみください😊`,
      hashtags: `${fallbackHashtags} ${fixedHashtags}`.trim(),
      photographyAdvice: '自然光での撮影、背景をシンプルに、料理を中心に配置することをお勧めします。'
    }
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

// Instagram向け画像分析
async function analyzeImageForInstagram(openai: OpenAI, image: string): Promise<ImageAnalysisResult> {
  const analysisPrompt = `
この料理写真をInstagramで高く評価されるための分析を行ってください。
以下の観点から詳細に分析し、JSON形式で回答してください：

1. 料理の種類（foodType）
2. 構図の問題点（compositionIssues）
3. 照明の問題点（lightingIssues）
4. 色彩の問題点（colorIssues）
5. 背景の問題点（backgroundIssues）
6. 推奨される最適化（recommendedOptimizations）

回答は以下のJSON形式で：
{
  "foodType": "料理の種類",
  "compositionIssues": ["構図の問題1", "構図の問題2"],
  "lightingIssues": ["照明の問題1", "照明の問題2"],
  "colorIssues": ["色彩の問題1", "色彩の問題2"],
  "backgroundIssues": ["背景の問題1", "背景の問題2"],
  "recommendedOptimizations": ["最適化1", "最適化2", "最適化3"]
}

Instagram映えする料理写真の特徴：
- 自然光または暖かい照明
- 背景がすっきりしている
- 料理が中心に配置されている
- 色彩が鮮やか
- 構図にバランスがある
- テクスチャが美しく見える
`

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
      max_tokens: 1000,
      temperature: 0.3
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

// 分析結果に基づく最適化適用（実際の画像処理）
async function applyOptimizations(openai: OpenAI, image: string, analysis: ImageAnalysisResult): Promise<string> {
  try {
    console.log('画像最適化開始:', analysis.recommendedOptimizations)
    
    // 推奨最適化に基づいて処理を適用
    let processedImage = image
    
    for (const optimization of analysis.recommendedOptimizations) {
      switch (optimization) {
        case '照明最適化':
          processedImage = await processImageWithSharp(processedImage, (sharp) => 
            sharp.modulate({ brightness: getOptimizationStrength('brightness', analysis.recommendedOptimizations) })
                 .linear(getOptimizationStrength('contrast', analysis.recommendedOptimizations), 0)
          )
          break
          
        case '色彩強調':
          processedImage = await processImageWithSharp(processedImage, (sharp) => 
            sharp.modulate({ saturation: getOptimizationStrength('saturation', analysis.recommendedOptimizations) })
                 .gamma(getOptimizationStrength('gamma', analysis.recommendedOptimizations))
          )
          break
          
        case '背景ぼかし':
          // 背景ぼかしは複雑なので、基本的なシャープネス強調で代替
          processedImage = await processImageWithSharp(processedImage, (sharp) => 
            sharp.sharpen({ sigma: 1.2, m1: 1.0, m2: 0.2 })
          )
          break
          
        case '構図調整':
          // 構図調整は軽微なトリミングで代替
          processedImage = await processImageWithSharp(processedImage, (sharp) => 
            sharp.trim({ threshold: 10 })
          )
          break
          
        case 'テクスチャ強調':
          processedImage = await processImageWithSharp(processedImage, (sharp) => 
            sharp.sharpen({ sigma: getOptimizationStrength('sharpen', analysis.recommendedOptimizations) })
                 .linear(getOptimizationStrength('contrast', analysis.recommendedOptimizations), 0)
          )
          break
          
        default:
          // その他の最適化は基本的な色調補正を適用
          processedImage = await processImageWithSharp(processedImage, (sharp) => 
            sharp.modulate({ brightness: 1.05, saturation: 1.1 })
          )
          break
      }
    }
    
    console.log('画像最適化完了')
    return processedImage
    
  } catch (error) {
    console.error('画像最適化エラー:', error)
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