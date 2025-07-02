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
    // テスト用のダミー店舗情報
    const store = {
      id: 'test-store-id',
      name: 'テスト店舗',
      store_code: 'TEST001',
      store_description: 'テスト用の店舗です。美味しい料理を提供しています。',
      fixed_caption: '【テスト店舗】\n\n',
      fixed_hashtags: '\n#テスト店舗 #美味しい #おすすめ'
    }

    // APIキーの確認（テスト用にダミーキーを設定）
    if (!process.env.OPENAI_API_KEY) {
      process.env.OPENAI_API_KEY = 'sk-test-dummy-openai-api-key'
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
        return NextResponse.json({
          ...cachedResult,
          fromCache: true,
          processingTime: Date.now() - startTime
        })
      }
    }

    // OpenAI クライアントの初期化
    const openai = createOptimizedOpenAIClient()

    // ここにAI処理のロジックを記述（省略）
    // ...

    // ダミーのレスポンス
    return NextResponse.json({
      success: true,
      processedImage: image, // 本来はAIで加工した画像
      caption: 'AI生成キャプション（ダミー）',
      hashtags: ['#AI', '#ダミー'],
      analysis: '画像解析結果（ダミー）',
      processingDetails: 'エフェクト適用: ' + effectStrength,
      fromCache: false,
      processingTime: Date.now() - startTime
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'AI処理でエラーが発生しました', details: error instanceof Error ? error.message : String(error) },
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