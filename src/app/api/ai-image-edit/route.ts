import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { createOptimizedOpenAIClient } from '@/lib/ai-utils'
import OpenAI from 'openai'

// ビルド時の事前レンダリングを無効にする
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
      // 自動最適化モード
      result = await performAutoOptimization(openai, image)
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

// 自動最適化処理
async function performAutoOptimization(openai: OpenAI, image: string): Promise<OptimizationResult> {
  // Step 1: 画像を分析
  const analysis = await analyzeImageForInstagram(openai, image)
  
  // Step 2: 分析結果に基づいて最適化を実行
  const optimizedImage = await applyOptimizations(openai, image, analysis)
  
  return {
    appliedOptimizations: analysis.recommendedOptimizations,
    processingTime: 0, // 後で設定
    originalAnalysis: analysis,
    optimizedImage
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

// 分析結果に基づく最適化適用
async function applyOptimizations(openai: OpenAI, image: string, analysis: ImageAnalysisResult): Promise<string> {
  const optimizations = analysis.recommendedOptimizations
  
  // 最適化の優先度を決定
  const optimizationPrompt = generateOptimizationPrompt(analysis, optimizations)
  
  try {
    const response = await openai.images.edit({
      model: "dall-e-3",
      image: image as any,
      prompt: optimizationPrompt,
      n: 1,
      size: "1024x1024"
    })
    
    return response.data?.[0]?.url || ''
  } catch (error) {
    console.error('最適化適用エラー:', error)
    throw new Error('画像の最適化に失敗しました')
  }
}

// 最適化プロンプト生成
function generateOptimizationPrompt(analysis: ImageAnalysisResult, optimizations: string[]): string {
  const basePrompt = `Professional Instagram-worthy food photography of ${analysis.foodType}.`
  
  const optimizationInstructions = optimizations.map(opt => {
    switch (opt) {
      case '照明最適化':
        return 'Perfect natural lighting with soft shadows, warm and inviting atmosphere'
      case '色彩強調':
        return 'Enhanced vibrant colors that make the food look fresh and appetizing'
      case '背景ぼかし':
        return 'Beautiful shallow depth of field with artistic background blur'
      case '構図調整':
        return 'Optimal composition with rule of thirds, balanced and visually appealing'
      case 'テクスチャ強調':
        return 'Enhanced food texture that looks delicious and mouth-watering'
      default:
        return opt
    }
  }).join(', ')
  
  return `${basePrompt} ${optimizationInstructions}. High quality, professional photography, Instagram-worthy, food styling perfection.`
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
  const blurStrength = options.blurStrength || 50
  const prompt = `Professional food photography with ${blurStrength}% background blur, 
                 shallow depth of field, beautiful bokeh effect, studio lighting, 
                 the food remains sharp and detailed while background is artistically blurred, 
                 high quality, Instagram-worthy`
  
  const response = await openai.images.edit({
    model: "dall-e-3",
    image: image as any,
    prompt: prompt,
    n: 1,
    size: "1024x1024"
  })
  
  return response.data?.[0]
}

// 照明最適化処理
async function processLightingEnhancement(openai: OpenAI, image: string, options: any) {
  const lightingType = options.lightingType || 'natural'
  
  const lightingPrompts: Record<string, string> = {
    natural: "Natural window lighting, soft shadows, warm atmosphere, golden hour effect",
    studio: "Professional studio lighting, dramatic shadows, high contrast, magazine quality",
    warm: "Warm golden hour lighting, cozy atmosphere, soft glow, romantic mood",
    dramatic: "Dramatic side lighting, deep shadows, cinematic look, artistic lighting",
    bright: "Bright cheerful lighting, minimal shadows, clean and fresh appearance"
  }
  
  const prompt = `Food photography with ${lightingPrompts[lightingType]}, 
                 enhanced lighting, professional quality, the food looks delicious and appetizing`
  
  const response = await openai.images.edit({
    model: "dall-e-3",
    image: image as any,
    prompt: prompt,
    n: 1,
    size: "1024x1024"
  })
  
  return response.data?.[0]
}

// 構図最適化処理
async function processCompositionOptimization(openai: OpenAI, image: string, options: any) {
  const compositionStyle = options.compositionStyle || 'overhead'
  
  const compositionPrompts: Record<string, string> = {
    overhead: "Overhead shot, flat lay composition, Instagram style, perfectly arranged",
    angle45: "45-degree angle shot, dynamic composition, professional look, depth and dimension",
    closeup: "Close-up macro shot, detailed texture, intimate feel, focus on details",
    wide: "Wide shot with context, environmental storytelling, restaurant atmosphere",
    centered: "Centered composition, balanced layout, minimalist approach, clean design"
  }
  
  const prompt = `Food photography with ${compositionPrompts[compositionStyle]}, 
                 professional composition, high quality, the food is the main focus`
  
  const response = await openai.images.edit({
    model: "dall-e-3",
    image: image as any,
    prompt: prompt,
    n: 1,
    size: "1024x1024"
  })
  
  return response.data?.[0]
}

// スタイル転送処理
async function processStyleTransfer(openai: OpenAI, image: string, options: any) {
  const style = options.style || 'modern'
  
  const stylePrompts: Record<string, string> = {
    vintage: "Vintage film photography style, warm tones, nostalgic atmosphere, classic look",
    modern: "Modern minimalist style, clean lines, contemporary aesthetic, sleek design",
    rustic: "Rustic farmhouse style, natural textures, earthy tones, homely feel",
    elegant: "Elegant fine dining style, sophisticated presentation, luxury atmosphere",
    casual: "Casual everyday style, relaxed atmosphere, approachable and friendly"
  }
  
  const prompt = `Food photography in ${stylePrompts[style]}, 
                 professional quality, the food looks delicious and appealing`
  
  const response = await openai.images.edit({
    model: "dall-e-3",
    image: image as any,
    prompt: prompt,
    n: 1,
    size: "1024x1024"
  })
  
  return response.data?.[0]
}

// テクスチャ強調処理
async function processTextureEnhancement(openai: OpenAI, image: string, options: any) {
  const enhancementType = options.enhancementType || 'general'
  
  const enhancementPrompts: Record<string, string> = {
    general: "Enhanced food textures, detailed surface details, appetizing appearance",
    crispy: "Enhanced crispy textures, crunchy appearance, satisfying texture",
    smooth: "Enhanced smooth textures, creamy appearance, luxurious feel",
    juicy: "Enhanced juicy textures, moist appearance, succulent look",
    fresh: "Enhanced fresh textures, vibrant appearance, crisp and clean look"
  }
  
  const prompt = `Food photography with ${enhancementPrompts[enhancementType]}, 
                 professional quality, the food textures are enhanced and look delicious`
  
  const response = await openai.images.edit({
    model: "dall-e-3",
    image: image as any,
    prompt: prompt,
    n: 1,
    size: "1024x1024"
  })
  
  return response.data?.[0]
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