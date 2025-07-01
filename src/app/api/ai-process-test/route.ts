import { NextRequest, NextResponse } from 'next/server'
import { generateImageHash, getCachedResult, cacheResult, clearCache } from '@/lib/cache-mock'
import { 
  executeWithRetry, 
  optimizePrompt, 
  measureExecutionTime,
  standardizeErrorMessage,
  validateAIResponse
} from '@/lib/ai-utils'

// ビルド時の事前レンダリングを無効にする
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// 業種別のプロンプト設定
const BUSINESS_PROMPTS = {
  bar: {
    caption: 'バーの雰囲気に合う大人っぽく洗練された表現で、この料理・ドリンクの魅力を集客につながるキャプションにして',
    style: '大人の夜の時間、洗練された味わい'
  },
  izakaya: {
    caption: '居酒屋の親しみやすい雰囲気で、この料理の美味しさを気軽に楽しめることをアピールするキャプションにして',
    style: 'カジュアル、親しみやすい、みんなで楽しむ'
  },
  sushi: {
    caption: '高級寿司店の職人技と新鮮な素材の良さを表現した、格式高いキャプションにして',
    style: '職人技、新鮮、高級感、伝統'
  },
  ramen: {
    caption: 'ラーメン店の温かみとボリューム感、こだわりの味を表現した食欲をそそるキャプションにして',
    style: '温かい、こだわり、ボリューム、満足感'
  },
  cafe: {
    caption: 'カフェのおしゃれで落ち着いた雰囲気に合う、リラックスできる時間を演出するキャプションにして',
    style: 'おしゃれ、リラックス、癒し、ゆったり'
  },
  restaurant: {
    caption: 'レストランの上品で洗練された雰囲気に合う、特別な時間を演出するキャプションにして',
    style: '上品、洗練、特別な時間、丁寧'
  },
  yakiniku: {
    caption: '焼肉店の迫力ある料理と食欲をそそる表現で、ガッツリ食べたくなるキャプションにして',
    style: 'ガッツリ、迫力、食欲をそそる、満足感'
  },
  italian: {
    caption: 'イタリアンレストランの陽気で本格的な雰囲気に合う、本場の味を表現するキャプションにして',
    style: '本格的、陽気、情熱的、本場の味'
  }
}

// エフェクト強度の設定
const EFFECT_PROMPTS = {
  weak: 'very subtle and natural enhancement',
  normal: 'moderate enhancement while keeping natural look',
  strong: 'dramatic but tasteful enhancement'
}

// CSS フィルターを使用した画像処理のエフェクト生成
function generateImageEffects(effectStrength: string) {
  switch (effectStrength) {
    case 'weak':
      return {
        filter: 'brightness(1.05) contrast(1.03) saturate(1.08) hue-rotate(2deg)',
        description: '軽微な調整: 明度+5%, 彩度+8%, コントラスト+3% - 自然な美味しさを保持'
      }
    case 'normal':
      return {
        filter: 'brightness(1.1) contrast(1.08) saturate(1.15) hue-rotate(4deg)',
        description: '標準調整: 明度+10%, 彩度+15%, コントラスト+8% - バランスの良い食欲増進効果'
      }
    case 'strong':
      return {
        filter: 'brightness(1.15) contrast(1.12) saturate(1.25) hue-rotate(6deg) sepia(0.05)',
        description: '強力調整: 明度+15%, 彩度+25%, コントラスト+12%, 暖色調整 - インパクトのある美味しさ強調'
      }
    default:
      return {
        filter: 'brightness(1.1) contrast(1.08) saturate(1.15)',
        description: '標準調整を適用'
      }
  }
}

// モックAI応答生成
function generateMockAIResponse(type: string, businessType: string, customPrompt?: string): any {
  const businessPrompt = BUSINESS_PROMPTS[businessType as keyof typeof BUSINESS_PROMPTS]
  
  switch (type) {
    case 'caption':
      const baseCaption = `${businessPrompt?.style || '美味しい'}な料理が完成しました！✨ 素材の味を活かした${businessPrompt?.style || '素敵な'}一品です。ぜひお試しください🍽️`
      return {
        choices: [{
          message: {
            content: customPrompt ? `${baseCaption} ${customPrompt}` : baseCaption
          }
        }]
      }
    
    case 'hashtags':
      const hashtags = [
        '#foodporn', '#instafood', '#delicious', '#foodie', '#tasty',
        '#料理', '#美味しい', '#グルメ', '#食事', '#食べ物'
      ]
      return {
        choices: [{
          message: {
            content: hashtags.join('\n')
          }
        }]
      }
    
    case 'analysis':
      return {
        choices: [{
          message: {
            content: `${businessType}の美味しそうな料理写真です。色合いが美しく、盛り付けも素敵です。`
          }
        }]
      }
    
    case 'advice':
      return {
        choices: [{
          message: {
            content: `写真の構図がとても素敵ですね！もう少し斜め45度から撮影すると立体感が出て、さらに美味しそうに見えますよ。`
          }
        }]
      }
    
    default:
      return {
        choices: [{
          message: {
            content: 'テスト用の応答です'
          }
        }]
      }
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const searchParams = request.nextUrl.searchParams
  
  try {
    const { image, businessType, effectStrength, regenerateCaption, regenerateHashtags, customPrompt } = await request.json()

    // テスト用：キャッシュクリア機能（クエリパラメータで制御）
    if (searchParams.get('clearCache') === 'true') {
      await clearCache()
      console.log('テスト用キャッシュクリアを実行しました')
      return NextResponse.json({
        success: true,
        message: 'キャッシュがクリアされました',
        timestamp: new Date().toISOString()
      })
    }
    
    if (!image || !businessType || !effectStrength) {
      const missingParams = []
      if (!image) missingParams.push('image')
      if (!businessType) missingParams.push('businessType')
      if (!effectStrength) missingParams.push('effectStrength')
      
      return NextResponse.json(
        { 
          error: '必要なパラメータが不足しています',
          missingParams,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // 無効な業種のチェック
    if (!BUSINESS_PROMPTS[businessType as keyof typeof BUSINESS_PROMPTS]) {
      return NextResponse.json(
        { 
          error: '無効な業種が指定されました',
          invalidBusinessType: businessType,
          validBusinessTypes: Object.keys(BUSINESS_PROMPTS),
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // 無効なエフェクト強度のチェック
    if (!EFFECT_PROMPTS[effectStrength as keyof typeof EFFECT_PROMPTS]) {
      return NextResponse.json(
        { 
          error: '無効なエフェクト強度が指定されました',
          invalidEffectStrength: effectStrength,
          validEffectStrengths: Object.keys(EFFECT_PROMPTS),
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // キャッシュチェック（再生成でない場合のみ）
    if (!regenerateCaption && !regenerateHashtags) {
      const imageHash = generateImageHash(image)
      const cachedResult = await getCachedResult(imageHash, businessType, effectStrength)
      
      if (cachedResult) {
        console.log('キャッシュから結果を取得しました')
        return NextResponse.json({
          ...cachedResult,
          fromCache: true,
          processingTime: Date.now() - startTime
        })
      }
    }

    // 再生成の場合は画像解析をスキップ
    let imageAnalysis = ''
    if (!regenerateCaption && !regenerateHashtags) {
      // モック画像解析
      const analysisResponse = await executeWithRetry(
        () => measureExecutionTime(
          () => Promise.resolve(generateMockAIResponse('analysis', businessType)),
          '画像解析'
        ),
        '画像解析'
      )

      if (!validateAIResponse(analysisResponse)) {
        throw new Error('画像解析の結果が無効です')
      }

      imageAnalysis = analysisResponse.choices[0]?.message?.content || ''
    } else {
      imageAnalysis = `${businessType}の美味しそうな料理写真`
    }

    // 再生成の場合は必要な部分のみ実行
    if (regenerateCaption) {
      const captionResponse = await executeWithRetry(
        () => measureExecutionTime(
          () => Promise.resolve(generateMockAIResponse('caption', businessType, customPrompt)),
          'キャプション再生成'
        ),
        'キャプション再生成'
      )

      if (!validateAIResponse(captionResponse)) {
        throw new Error('キャプション生成の結果が無効です')
      }

      const caption = captionResponse.choices[0]?.message?.content || ''

      return NextResponse.json({
        success: true,
        caption: caption.trim(),
        processingTime: Date.now() - startTime
      })
    }

    if (regenerateHashtags) {
      const hashtagResponse = await executeWithRetry(
        () => measureExecutionTime(
          () => Promise.resolve(generateMockAIResponse('hashtags', businessType, customPrompt)),
          'ハッシュタグ再生成'
        ),
        'ハッシュタグ再生成'
      )

      if (!validateAIResponse(hashtagResponse)) {
        throw new Error('ハッシュタグ生成の結果が無効です')
      }

      const hashtagsText = hashtagResponse.choices[0]?.message?.content || ''
      const hashtags = hashtagsText.split('\n')
        .filter((tag: string) => tag.trim())
        .map((tag: string) => tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`)
        .slice(0, 10)

      return NextResponse.json({
        success: true,
        hashtags,
        processingTime: Date.now() - startTime
      })
    }

    // 通常の全体処理
    // 画像加工設定の生成
    const effectSettings = generateImageEffects(effectStrength)
    const processedImage = image
    const imageProcessingDetails = effectSettings.description

    // AI生成処理（並列実行 + リトライ機能）
    const businessPrompt = BUSINESS_PROMPTS[businessType as keyof typeof BUSINESS_PROMPTS]
    
    const [captionResponse, hashtagResponse, photographyAdviceResponse] = await Promise.all([
      // キャプション生成
      executeWithRetry(
        () => measureExecutionTime(
          () => Promise.resolve(generateMockAIResponse('caption', businessType)),
          'キャプション生成'
        ),
        'キャプション生成'
      ),
      
      // ハッシュタグ生成
      executeWithRetry(
        () => measureExecutionTime(
          () => Promise.resolve(generateMockAIResponse('hashtags', businessType)),
          'ハッシュタグ生成'
        ),
        'ハッシュタグ生成'
      ),
      
      // 撮影アドバイス生成
      executeWithRetry(
        () => measureExecutionTime(
          () => Promise.resolve(generateMockAIResponse('advice', businessType)),
          '撮影アドバイス生成'
        ),
        '撮影アドバイス生成'
      )
    ])

    // 結果の検証
    if (!validateAIResponse(captionResponse) || !validateAIResponse(hashtagResponse) || !validateAIResponse(photographyAdviceResponse)) {
      throw new Error('AI生成結果の一部が無効です')
    }

    // AI生成結果の取得
    let aiCaption = captionResponse.choices[0]?.message?.content?.trim() || ''
    const hashtagsText = hashtagResponse.choices[0]?.message?.content || ''
    let aiHashtags = hashtagsText.split('\n')
      .filter((tag: string) => tag.trim())
      .map((tag: string) => tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`)
      .slice(0, 10)
    const photographyAdvice = photographyAdviceResponse.choices[0]?.message?.content?.trim() || ''

    const result = {
      success: true,
      processedImage,
      caption: aiCaption,
      hashtags: aiHashtags,
      analysis: imageAnalysis,
      photographyAdvice,
      businessType,
      effectStrength,
      imageEffects: effectSettings.filter,
      processingDetails: imageProcessingDetails,
      usedFixedCaption: false,
      usedFixedHashtags: false,
      processingTime: Date.now() - startTime
    }

    // 結果をキャッシュに保存
    const imageHash = generateImageHash(image)
    await cacheResult(imageHash, businessType, effectStrength, result)

    return NextResponse.json(result)

  } catch (error) {
    console.error('AI処理エラー:', error)
    
    const errorMessage = standardizeErrorMessage(error)
    const processingTime = Date.now() - startTime
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
        timestamp: new Date().toISOString(),
        processingTime
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Processing Test API (Mock)',
    status: 'active',
    version: '2.0.0-test',
    features: [
      '画像解析（モック）',
      '業種別キャプション生成（モック）',
      'ハッシュタグ生成（モック）',
      '画像加工',
      'キャッシュ機能（メモリ）',
      'リトライ機能',
      'エラーハンドリング強化'
    ]
  })
} 