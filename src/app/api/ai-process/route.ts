import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { generateImageHash, getCachedResult, cacheResult } from '@/lib/cache'
import { 
  executeWithRetry, 
  createOptimizedOpenAIClient, 
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

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 認証チェック
    const token = request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const store = await validateSession(token)
    if (!store) {
      return NextResponse.json(
        { error: 'セッションが無効です' },
        { status: 401 }
      )
    }

    // APIキーの確認
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OpenAI API キーが設定されていません',
          details: 'サーバー管理者にお問い合わせください',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    const { image, businessType, effectStrength, regenerateCaption, regenerateHashtags, customPrompt } = await request.json()
    
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

    // OpenAI クライアントの初期化
    const openai = createOptimizedOpenAIClient()

    // 再生成の場合は画像解析をスキップ
    let imageAnalysis = ''
    if (!regenerateCaption && !regenerateHashtags) {
      // 画像解析（リトライ機能付き）
      const analysisResponse = await executeWithRetry(
        () => measureExecutionTime(
          () => openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: optimizePrompt(`この写真を詳しく分析してください。以下の情報を教えてください：
                    1. 料理名（推定）
                    2. 主な食材・特徴
                    3. 見た目の印象（色合い、盛り付け、量など）
                    4. 美味しそうなポイント
                    5. どんな業種の店に合いそうか
                    
                    日本語で簡潔に答えてください。`)
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: image
                    }
                  }
                ]
              }
            ],
            max_tokens: 500
          }),
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
      const businessPrompt = BUSINESS_PROMPTS[businessType as keyof typeof BUSINESS_PROMPTS]
      
      let userPrompt = optimizePrompt(`${businessPrompt.caption}。

画像分析結果：${imageAnalysis}

以下の条件で200文字以内のキャプションを作成してください：
- 集客につながる魅力的な表現
- ${businessPrompt.style}な雰囲気
- 食欲をそそる表現
- 親しみやすい文体
- 絵文字を2-3個程度使用
- ハッシュタグは一切含めない（#マークを使わない）
- 前回とは違う表現で作成
- キャプション本文のみを出力し、説明文は一切含めない`)

      if (customPrompt && customPrompt.trim()) {
        userPrompt = optimizePrompt(userPrompt + `

【重要】ユーザーからの追加リクエスト：
${customPrompt}

このリクエストを最優先で反映してキャプションを作成してください。`)
      }

      const captionResponse = await executeWithRetry(
        () => measureExecutionTime(
          () => openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `あなたは${businessPrompt.style}な${businessType}の店舗SNS担当者です。集客効果の高い魅力的な投稿文を作成してください。キャプション本文のみを出力し、説明や前置きは一切含めないでください。`
              },
              {
                role: "user",
                content: userPrompt
              }
            ],
            max_tokens: 300,
            temperature: 0.9
          }),
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
      let userPrompt = optimizePrompt(`${businessType}の料理写真用に効果的なハッシュタグを10個生成してください。

画像分析：${imageAnalysis}
業種：${businessType}

条件：
- 日本語と英語を5:5の割合で混在させる
- 英語のハッシュタグを必ず含める（例：#foodporn, #instafood, #delicious, #foodie, #tasty等）
- インスタ映えを狙った人気ハッシュタグを含める
- 業種特有のハッシュタグを含める
- 料理に関連するハッシュタグを含める
- #マークは付けずに、改行区切りで出力
- 前回とは違うバリエーションで作成
- ハッシュタグのみを出力し、説明文は一切含めない`)

      if (customPrompt && customPrompt.trim()) {
        userPrompt = optimizePrompt(userPrompt + `

【重要】ユーザーからの追加リクエスト：
${customPrompt}

このリクエストを最優先で反映してハッシュタグを作成してください。`)
      }

      const hashtagResponse = await executeWithRetry(
        () => measureExecutionTime(
          () => openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "あなたはSNSマーケティングの専門家です。効果的なハッシュタグを生成してください。ハッシュタグのみを出力し、説明や前置きは一切含めないでください。"
              },
              {
                role: "user",
                content: userPrompt
              }
            ],
            max_tokens: 200,
            temperature: 0.9
          }),
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
    // 業種自動判定（リトライ機能付き）
    let detectedBusinessType = businessType
    
    if (store.store_description && store.store_description.trim()) {
      const businessDetectionResponse = await executeWithRetry(
        () => measureExecutionTime(
          () => openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "あなたは店舗の業種分類の専門家です。店舗紹介文から業種を判定してください。"
              },
              {
                role: "user",
                content: optimizePrompt(`以下の店舗紹介文から業種を判定してください。

店舗紹介文：「${store.store_description.trim()}」

以下の選択肢から最も適切な業種を1つ選んで、そのIDのみを回答してください：
- bar: バー（お酒メイン、大人の雰囲気）
- izakaya: 居酒屋（お酒と料理、カジュアル）
- sushi: 寿司店（寿司、和食、高級）
- ramen: ラーメン店（ラーメン、麺類）
- cafe: カフェ（コーヒー、軽食、おしゃれ）
- restaurant: レストラン（洋食、コース料理、上品）
- yakiniku:焼肉店（焼肉、BBQ、肉料理）
- italian: イタリアン（イタリア料理、パスタ、ピザ）

回答は業種IDのみ（例：sushi）で答えてください。`)
              }
            ],
            max_tokens: 10,
            temperature: 0.1
          }),
          '業種判定'
        ),
        '業種判定'
      )
      
      if (validateAIResponse(businessDetectionResponse)) {
        const detectedType = businessDetectionResponse.choices[0]?.message?.content?.trim()
        if (detectedType && BUSINESS_PROMPTS[detectedType as keyof typeof BUSINESS_PROMPTS]) {
          detectedBusinessType = detectedType
        }
      }
    }

    // 画像加工設定の生成
    const effectSettings = generateImageEffects(effectStrength)
    const processedImage = image
    const imageProcessingDetails = effectSettings.description

    // AI生成処理（並列実行 + リトライ機能）
    const businessPrompt = BUSINESS_PROMPTS[detectedBusinessType as keyof typeof BUSINESS_PROMPTS]
    
    const [captionResponse, hashtagResponse, photographyAdviceResponse] = await Promise.all([
      // キャプション生成
      executeWithRetry(
        () => measureExecutionTime(
          () => openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `あなたは${businessPrompt.style}な${businessType}の店舗SNS担当者です。集客効果の高い魅力的な投稿文を作成してください。キャプション本文のみを出力し、説明や前置きは一切含めないでください。`
              },
              {
                role: "user",
                content: optimizePrompt(`${businessPrompt.caption}。

画像分析結果：${imageAnalysis}

以下の条件で200文字以内のキャプションを作成してください：
- 集客につながる魅力的な表現
- ${businessPrompt.style}な雰囲気
- 食欲をそそる表現
- 親しみやすい文体
- 絵文字を2-3個程度使用
- ハッシュタグは一切含めない（#マークを使わない）
- キャプション本文のみを出力し、説明文は一切含めない`)
              }
            ],
            max_tokens: 150,
            temperature: 0.8
          }),
          'キャプション生成'
        ),
        'キャプション生成'
      ),
      
      // ハッシュタグ生成
      executeWithRetry(
        () => measureExecutionTime(
          () => openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "あなたはSNSマーケティングの専門家です。効果的なハッシュタグを生成してください。ハッシュタグのみを出力し、説明や前置きは一切含めないでください。"
              },
              {
                role: "user",
                content: optimizePrompt(`${detectedBusinessType}の料理写真用に効果的なハッシュタグを10個生成してください。

画像分析：${imageAnalysis}
業種：${detectedBusinessType}

条件：
- 日本語と英語を5:5の割合で混在させる
- 英語のハッシュタグを必ず含める（例：#foodporn, #instafood, #delicious, #foodie, #tasty等）
- インスタ映えを狙った人気ハッシュタグを含める
- 業種特有のハッシュタグを含める
- 料理に関連するハッシュタグを含める
- #マークは付けずに、改行区切りで出力
- ハッシュタグのみを出力し、説明文は一切含めない`)
              }
            ],
            max_tokens: 100,
            temperature: 0.7
          }),
          'ハッシュタグ生成'
        ),
        'ハッシュタグ生成'
      ),
      
      // 撮影アドバイス生成
      executeWithRetry(
        () => measureExecutionTime(
          () => openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "あなたは料理写真撮影の専門家です。写真の良い点を褒めつつ、さらに魅力的になるアドバイスを親しみやすく提供してください。"
              },
              {
                role: "user",
                content: optimizePrompt(`この料理写真の良い点を褒めつつ、さらに魅力的に撮影するためのアドバイスを教えてください。

画像分析結果：${imageAnalysis}
業種：${detectedBusinessType}

以下の書き方でアドバイスを150文字以内で提供してください：
- まず写真の良い点を褒める（「○○がとても素敵ですね！」など）
- その後「もっと○○すると更に良くなりますよ」という前向きなアドバイス
- 具体的で実践しやすい提案（アングル、光、構図、背景など）
- 親しみやすく優しい口調

例：「盛り付けがとても綺麗ですね！もう少し斜め45度から撮影すると立体感が出て、さらに美味しそうに見えますよ。」`)
              }
            ],
            max_tokens: 120,
            temperature: 0.7
          }),
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

    // 固定キャプション・ハッシュタグの追記処理
    let finalCaption = aiCaption
    let finalHashtags = [...aiHashtags]

    if (store.fixed_caption && store.fixed_caption.trim()) {
      const fixedCaption = store.fixed_caption.trim()
      if (finalCaption) {
        finalCaption = `${finalCaption}\n\n${fixedCaption}`
      } else {
        finalCaption = fixedCaption
      }
    }

    if (store.fixed_hashtags && store.fixed_hashtags.trim()) {
      const fixedHashtags = store.fixed_hashtags
        .split(/[\s,]+/)
        .filter((tag: string) => tag.trim())
        .map((tag: string) => tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`)
      
      fixedHashtags.forEach((tag: string) => {
        if (!finalHashtags.includes(tag)) {
          finalHashtags.push(tag)
        }
      })
    }

    const result = {
      success: true,
      processedImage,
      caption: finalCaption,
      hashtags: finalHashtags,
      analysis: imageAnalysis,
      photographyAdvice,
      businessType: detectedBusinessType,
      effectStrength,
      imageEffects: effectSettings.filter,
      processingDetails: imageProcessingDetails,
      usedFixedCaption: !!(store.fixed_caption && store.fixed_caption.trim()),
      usedFixedHashtags: !!(store.fixed_hashtags && store.fixed_hashtags.trim()),
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
    message: 'AI Processing API (Optimized)',
    status: 'active',
    version: '2.0.0',
    features: [
      '画像解析',
      '業種別キャプション生成',
      'ハッシュタグ生成',
      '画像加工',
      'キャッシュ機能',
      'リトライ機能',
      'エラーハンドリング強化'
    ]
  })
} 