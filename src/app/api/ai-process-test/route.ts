import { NextRequest, NextResponse } from 'next/server'
import { generateImageHash, getCachedResult, cacheResult, clearCache } from '@/lib/cache-mock'
import { 
  executeWithRetry, 
  optimizePrompt, 
  measureExecutionTime,
  standardizeErrorMessage,
  validateAIResponse
} from '@/lib/ai-utils'
import { validateSession } from '@/lib/auth'
import OpenAI from 'openai'

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

function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY!
  return new OpenAI({ apiKey })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const searchParams = request.nextUrl.searchParams
  
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

    const { image, businessType, effectStrength, testType } = await request.json()
    const openai = createOpenAIClient()
    
    if (!image || !businessType || !effectStrength || !testType) {
      return NextResponse.json(
        { 
          error: '必要なパラメータが不足しています',
          required: ['image', 'businessType', 'effectStrength', 'testType'],
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    let result: any = {}

    if (testType === 'image-analysis') {
      // 画像解析テスト
      const analysisResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `あなたは料理写真の専門家です。以下の点を詳細に分析してください：

1. 料理の種類と名前
2. 食材の詳細（肉、魚、野菜、調味料など）
3. 調理方法（焼く、煮る、揚げる、蒸すなど）
4. 見た目の特徴（色、テクスチャ、盛り付け、器）
5. 美味しそうに見えるポイント
6. 季節感や旬の要素
7. 文化的背景や地域性
8. 栄養価や健康要素
9. 価格帯の印象
10. SNS投稿に適した魅力ポイント

分析結果は構造化して、キャプション生成に活用できる形で出力してください。`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `この料理写真を詳細に分析してください。料理の種類、食材、調理方法、見た目の特徴、美味しそうに見えるポイントを詳しく教えてください。業種: ${businessType}`
              },
              {
                type: "image_url",
                image_url: {
                  url: image,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.2
      })

      result.analysis = analysisResponse.choices[0]?.message?.content || ''
    }

    if (testType === 'caption-generation') {
      // キャプション生成テスト
      const captionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `あなたはSNS投稿の専門家です。以下の条件で魅力的なキャプションを生成してください：

1. 料理の魅力を最大限に引き出す表現
2. 感情に訴えかける言葉選び
3. 具体的でイメージしやすい描写
4. 業種に適したトーンとスタイル
5. 集客につながる要素の盛り込み
6. 適切な長さ（100-150文字程度）
7. 絵文字の効果的な使用
8. 季節感や旬の要素の活用
9. 価格感や特別感の演出
10. 行動を促す表現

キャプションは自然で読みやすく、SNSでシェアしたくなる内容にしてください。`
          },
          {
            role: "user",
            content: `業種: ${businessType}
この料理写真に最適な、魅力的で集客につながるキャプションを生成してください。絵文字も効果的に使用してください。`
          }
        ],
        max_tokens: 250,
        temperature: 0.8
      })

      result.caption = captionResponse.choices[0]?.message?.content || ''
    }

    if (testType === 'hashtag-generation') {
      // ハッシュタグ生成テスト
      const hashtagResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `あなたはSNSマーケティングの専門家です。以下の条件で効果的なハッシュタグを生成してください：

1. 料理の種類に特化したハッシュタグ
2. 業種・店舗タイプに適したハッシュタグ
3. 人気で検索されやすいハッシュタグ
4. 地域性を活かしたハッシュタグ
5. 季節感や旬を表現するハッシュタグ
6. 価格帯やターゲット層に適したハッシュタグ
7. トレンドや流行を意識したハッシュタグ
8. 具体的で検索しやすいハッシュタグ
9. 感情や雰囲気を表現するハッシュタグ
10. 店舗の特徴を活かしたハッシュタグ

ハッシュタグは15-20個生成し、各ハッシュタグは改行で区切ってください。人気度の高いものから順に並べてください。`
          },
          {
            role: "user",
            content: `業種: ${businessType}
この料理写真に最適な、人気で効果的なハッシュタグを15-20個生成してください。各ハッシュタグは改行で区切ってください。`
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })

      result.hashtags = hashtagResponse.choices[0]?.message?.content || ''
    }

    return NextResponse.json({
      success: true,
      testType,
      businessType,
      effectStrength,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI処理テストエラー:', error)
    return NextResponse.json(
      { 
        error: 'AI処理テストでエラーが発生しました', 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Processing Test API',
    status: 'active',
    version: '2.0.0',
    testTypes: [
      'image-analysis',
      'caption-generation', 
      'hashtag-generation'
    ],
    features: [
      '画像解析精度テスト',
      'キャプション生成品質テスト',
      'ハッシュタグ生成効果テスト'
    ]
  })
} 