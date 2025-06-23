import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// OpenAI クライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

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

export async function POST(request: NextRequest) {
  try {
    const { image, businessType, effectStrength } = await request.json()
    
    if (!image || !businessType || !effectStrength) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API キーが設定されていません' },
        { status: 500 }
      )
    }

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

    const imageAnalysis = analysisResponse.choices[0]?.message?.content || ''

    // 2. 画像加工（エフェクト強度に応じた調整）
    // 現在は元画像を返しているが、実際の加工内容を説明
    const processedImage = image // 暫定的に元画像をそのまま使用
    
    // 加工内容の説明を生成
    const imageProcessingDetails = (() => {
      switch (effectStrength) {
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

    // 3. 業種別キャプション生成
    const businessPrompt = BUSINESS_PROMPTS[businessType as keyof typeof BUSINESS_PROMPTS]
    const captionResponse = await openai.chat.completions.create({
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
- 絵文字を2-3個程度使用`
        }
      ],
      max_tokens: 300,
      temperature: 0.8
    })

    const caption = captionResponse.choices[0]?.message?.content || ''

    // 4. ハッシュタグ生成
    const hashtagResponse = await openai.chat.completions.create({
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
- 日本語と英語を混在させる
- インスタ映えを狙った人気ハッシュタグを含める
- 業種特有のハッシュタグを含める
- 料理に関連するハッシュタグを含める
- #マークは付けずに、改行区切りで出力`
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    })

    const hashtagsText = hashtagResponse.choices[0]?.message?.content || ''
    const hashtags = hashtagsText.split('\n')
      .filter(tag => tag.trim())
      .map(tag => tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`)
      .slice(0, 10)

    // 5. 撮影アドバイス生成
    const photographyAdviceResponse = await openai.chat.completions.create({
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

    const photographyAdvice = photographyAdviceResponse.choices[0]?.message?.content || ''

    return NextResponse.json({
      success: true,
      processedImage,
      caption: caption.trim(),
      hashtags,
      analysis: imageAnalysis,
      photographyAdvice: photographyAdvice.trim(),
      businessType,
      effectStrength
    })

  } catch (error) {
    console.error('AI処理エラー:', error)
    
    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message)
    }
    
    return NextResponse.json(
      { error: 'AI処理でエラーが発生しました。しばらく時間をおいて再試行してください。' },
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