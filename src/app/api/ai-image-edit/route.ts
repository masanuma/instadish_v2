import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import OpenAI from 'openai'

// ビルド時の事前レンダリングを無効にする
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY!
  return new OpenAI({ apiKey })
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

    const { image, editType, options } = await request.json()
    const openai = createOpenAIClient()
    
    if (!image || !editType) {
      return NextResponse.json(
        { 
          error: '画像と編集タイプが必要です',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    let result
    switch (editType) {
      case 'background_blur':
        result = await processBackgroundBlur(openai, image, options)
        break
      
      case 'lighting_enhancement':
        result = await processLightingEnhancement(openai, image, options)
        break
      
      case 'composition_optimization':
        result = await processCompositionOptimization(openai, image, options)
        break
      
      case 'style_transfer':
        result = await processStyleTransfer(openai, image, options)
        break
      
      case 'texture_enhancement':
        result = await processTextureEnhancement(openai, image, options)
        break
      
      default:
        return NextResponse.json({ 
          error: '未対応の編集タイプです',
          supportedTypes: ['background_blur', 'lighting_enhancement', 'composition_optimization', 'style_transfer', 'texture_enhancement']
        })
    }

    if (!result) {
      return NextResponse.json({ 
        error: 'AI画像編集の処理に失敗しました',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      processedImage: result.url,
      editType,
      options,
      processingTime: Date.now() - startTime,
      model: 'dall-e-3'
    })

  } catch (error) {
    console.error('AI画像編集エラー:', error)
    return NextResponse.json(
      { 
        error: 'AI画像編集でエラーが発生しました', 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
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