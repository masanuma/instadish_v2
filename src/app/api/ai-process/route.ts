import { NextRequest, NextResponse } from 'next/server'

// ビルド時の事前レンダリングを無効にする
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// OpenAIクライアントを動的にインポートして初期化する関数
async function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  
  // OpenAIを動的にインポート（ビルド時には実行されない）
  const { default: OpenAI } = await import('openai')
  return new OpenAI({ apiKey })
}

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
  try {
    // 最初にAPIキーの存在を確認
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

    // OpenAI クライアントの初期化（実行時）
    const openai = await createOpenAIClient()

    // 再生成の場合は画像解析をスキップ
    let imageAnalysis = ''
    if (!regenerateCaption && !regenerateHashtags) {
      // 1. 画像解析（料理の種類・特徴を分析）
      const analysisResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `この写真を詳しく分析してください。以下の情報を教えてください：
                1. 料理名（推定）
                2. 主な食材・特徴
                3. 見た目の印象（色合い、盛り付け、量など）
                4. 美味しそうなポイント
                5. どんな業種の店に合いそうか
                
                日本語で簡潔に答えてください。`
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
      })

      imageAnalysis = analysisResponse.choices[0]?.message?.content || ''
    } else {
      // 再生成の場合は簡易的な分析テキストを使用
      imageAnalysis = `${businessType}の美味しそうな料理写真`
    }

    // 再生成の場合は必要な部分のみ実行
    if (regenerateCaption) {
      // キャプション再生成のみ
      const businessPrompt = BUSINESS_PROMPTS[businessType as keyof typeof BUSINESS_PROMPTS]
      
      // カスタムプロンプトがある場合とない場合で処理を分岐
      let userPrompt = `${businessPrompt.caption}。

画像分析結果：${imageAnalysis}

以下の条件で200文字以内のキャプションを作成してください：
- 集客につながる魅力的な表現
- ${businessPrompt.style}な雰囲気
- 食欲をそそる表現
- 親しみやすい文体
- 絵文字を2-3個程度使用
- ハッシュタグは一切含めない（#マークを使わない）
- 前回とは違う表現で作成`

      // カスタムプロンプトがある場合は追加の指示を含める
      if (customPrompt && customPrompt.trim()) {
        userPrompt += `

【重要】ユーザーからの追加リクエスト：
${customPrompt}

このリクエストを最優先で反映してキャプションを作成してください。`
      }

      const captionResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `あなたは${businessPrompt.style}な${businessType}の店舗SNS担当者です。集客効果の高い魅力的な投稿文を作成してください。`
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.9 // 再生成時は温度を上げてバリエーションを増やす
      })

      const caption = captionResponse.choices[0]?.message?.content || ''

      return NextResponse.json({
        success: true,
        caption: caption.trim()
      })
    }

    if (regenerateHashtags) {
      // ハッシュタグ再生成のみ
      
      // カスタムプロンプトがある場合とない場合で処理を分岐
      let userPrompt = `${businessType}の料理写真用に効果的なハッシュタグを10個生成してください。

画像分析：${imageAnalysis}
業種：${businessType}

条件：
- 日本語と英語を5:5の割合で混在させる
- 英語のハッシュタグを必ず含める（例：#foodporn, #instafood, #delicious, #foodie, #tasty等）
- インスタ映えを狙った人気ハッシュタグを含める
- 業種特有のハッシュタグを含める
- 料理に関連するハッシュタグを含める
- #マークは付けずに、改行区切りで出力
- 前回とは違うバリエーションで作成`

      // カスタムプロンプトがある場合は追加の指示を含める
      if (customPrompt && customPrompt.trim()) {
        userPrompt += `

【重要】ユーザーからの追加リクエスト：
${customPrompt}

このリクエストを最優先で反映してハッシュタグを作成してください。`
      }

      const hashtagResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "あなたはSNSマーケティングの専門家です。効果的なハッシュタグを生成してください。"
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.9 // 再生成時は温度を上げてバリエーションを増やす
      })

      const hashtagsText = hashtagResponse.choices[0]?.message?.content || ''
      const hashtags = hashtagsText.split('\n')
        .filter((tag: string) => tag.trim())
        .map((tag: string) => tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`)
        .slice(0, 10)

      return NextResponse.json({
        success: true,
        hashtags
      })
    }

    // 通常の全体処理
    // 2. 画像加工設定の生成
    const effectSettings = generateImageEffects(effectStrength)
    const processedImage = image // 元画像にCSSフィルターを適用して表示
    const imageProcessingDetails = effectSettings.description

    // 3. 並列処理でAI生成を高速化
    const businessPrompt = BUSINESS_PROMPTS[businessType as keyof typeof BUSINESS_PROMPTS]
    
    // キャプション、ハッシュタグ、撮影アドバイスを並列実行
    const [captionResponse, hashtagResponse, photographyAdviceResponse] = await Promise.all([
      // キャプション生成
      openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `あなたは${businessPrompt.style}な${businessType}の店舗SNS担当者です。集客効果の高い魅力的な投稿文を作成してください。`
          },
          {
            role: "user",
            content: `${businessPrompt.caption}。

画像分析結果：${imageAnalysis}

以下の条件で200文字以内のキャプションを作成してください：
- 集客につながる魅力的な表現
- ${businessPrompt.style}な雰囲気
- 食欲をそそる表現
- 親しみやすい文体
- 絵文字を2-3個程度使用
- ハッシュタグは一切含めない（#マークを使わない）`
          }
        ],
        max_tokens: 300,
        temperature: 0.8
      }),
      
      // ハッシュタグ生成
      openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "あなたはSNSマーケティングの専門家です。効果的なハッシュタグを生成してください。"
          },
          {
            role: "user",
            content: `${businessType}の料理写真用に効果的なハッシュタグを10個生成してください。

画像分析：${imageAnalysis}
業種：${businessType}

条件：
- 日本語と英語を5:5の割合で混在させる
- 英語のハッシュタグを必ず含める（例：#foodporn, #instafood, #delicious, #foodie, #tasty等）
- インスタ映えを狙った人気ハッシュタグを含める
- 業種特有のハッシュタグを含める
- 料理に関連するハッシュタグを含める
- #マークは付けずに、改行区切りで出力`
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      }),
      
      // 撮影アドバイス生成
      openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "あなたは料理写真撮影の専門家です。写真の良い点を褒めつつ、さらに魅力的になるアドバイスを親しみやすく提供してください。"
          },
          {
            role: "user",
            content: `この料理写真の良い点を褒めつつ、さらに魅力的に撮影するためのアドバイスを教えてください。

画像分析結果：${imageAnalysis}
業種：${businessType}

以下の書き方でアドバイスを150文字以内で提供してください：
- まず写真の良い点を褒める（「○○がとても素敵ですね！」など）
- その後「もっと○○すると更に良くなりますよ」という前向きなアドバイス
- 具体的で実践しやすい提案（アングル、光、構図、背景など）
- 親しみやすく優しい口調

例：「盛り付けがとても綺麗ですね！もう少し斜め45度から撮影すると立体感が出て、さらに美味しそうに見えますよ。」`
          }
        ],
        max_tokens: 250,
        temperature: 0.7
      })
    ])

    const caption = captionResponse.choices[0]?.message?.content || ''
    const hashtagsText = hashtagResponse.choices[0]?.message?.content || ''
    const hashtags = hashtagsText.split('\n')
      .filter((tag: string) => tag.trim())
      .map((tag: string) => tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`)
      .slice(0, 10)
    const photographyAdvice = photographyAdviceResponse.choices[0]?.message?.content || ''

    return NextResponse.json({
      success: true,
      processedImage,
      caption: caption.trim(),
      hashtags,
      analysis: imageAnalysis,
      photographyAdvice: photographyAdvice.trim(),
      businessType,
      effectStrength,
      imageEffects: effectSettings.filter, // CSSフィルター設定をフロントエンドに送信
      processingDetails: imageProcessingDetails // 加工詳細説明を送信
    })

  } catch (error) {
    console.error('AI処理エラー:', error)
    
    // エラーの詳細をログに出力
    let errorMessage = 'AI処理でエラーが発生しました。'
    let errorDetails = ''
    
    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message)
      errorDetails = error.message
      
      // 具体的なエラータイプに応じたメッセージ
      if (error.message.includes('API key')) {
        errorMessage = 'OpenAI APIキーの設定に問題があります。'
      } else if (error.message.includes('quota')) {
        errorMessage = 'OpenAI APIの利用制限に達しています。'
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'リクエストが多すぎます。しばらく時間をおいて再試行してください。'
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Processing API',
    status: 'active',
    version: '1.0.0',
    features: [
      '画像解析',
      '業種別キャプション生成',
      'ハッシュタグ生成',
      '画像加工'
    ]
  })
} 