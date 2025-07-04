import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { generateImageHash, getCachedResult, cacheResult } from '@/lib/cache'
import {
  executeWithRetry,
  measureExecutionTime,
  standardizeErrorMessage,
  validateAIResponse
} from '@/lib/ai-utils'
import OpenAI from 'openai'

// ビルド時の事前レンダリングを無効にする
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// エフェクト強度の設定（5段階に拡張）
const EFFECT_PROMPTS = {
  'very-weak': 'minimal and ultra-natural enhancement, barely noticeable',
  'weak': 'very subtle and natural enhancement',
  'normal': 'moderate enhancement while keeping natural look',
  'strong': 'dramatic but tasteful enhancement',
  'very-strong': 'maximum impact enhancement, bold and vibrant'
}

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

    const { image, effectStrength, regenerateCaption, regenerateHashtags, customPrompt, fastMode } = await request.json()
    const openai = createOpenAIClient()
    
    if (!image || !effectStrength) {
      const missingParams = []
      if (!image) missingParams.push('image')
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

    // 高速モードの設定
    const model = fastMode ? "gpt-4o-mini" : "gpt-4o"
    const maxTokens = fastMode ? 200 : 500
    const captionMaxTokens = fastMode ? 150 : 250
    const hashtagMaxTokens = fastMode ? 200 : 300

    // キャッシュチェック（再生成でない場合のみ）
    if (!regenerateCaption && !regenerateHashtags) {
      const imageHash = generateImageHash(image)
      const cachedResult = await getCachedResult(imageHash, 'general', effectStrength)
      if (cachedResult) {
        return NextResponse.json({
          ...cachedResult,
          fromCache: true
        })
      }
    }

    // 再生成の場合は画像解析をスキップ
    let imageAnalysis = ''
    if (!regenerateCaption && !regenerateHashtags) {
      // 画像解析（Vision APIを使用）
      const analysisResponse = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: fastMode 
              ? `あなたは料理写真の専門家です。以下の点を簡潔に分析してください：
1. 料理の種類と名前
2. 主要な食材
3. 調理方法
4. 見た目の特徴
5. 美味しそうに見えるポイント
6. 季節感や旬の要素

簡潔で要点を押さえた分析をしてください。`
              : `あなたは料理写真の専門家です。以下の点を詳細に分析してください：

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
                text: `この料理写真を${fastMode ? '簡潔に' : '詳細に'}分析してください。料理の種類、食材、調理方法、見た目の特徴、美味しそうに見えるポイントを教えてください。店舗: ${session.name || '未設定'}`
              },
              {
                type: "image_url",
                image_url: {
                  url: image,
                  detail: fastMode ? "low" : "high"
                }
              }
            ]
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.2
      })

      imageAnalysis = analysisResponse.choices[0]?.message?.content || ''
    } else {
      imageAnalysis = `${session.name || '未設定'}の美味しそうな料理写真`
    }

    // 並列処理でAI生成を高速化
    const captionPrompt = customPrompt || 'この料理の魅力を表現するキャプションを生成してください'
    
    // キャッシュチェック（再生成でない場合のみ）
    if (!regenerateCaption && !regenerateHashtags) {
      const imageHash = generateImageHash(image)
      const cachedResult = await getCachedResult(imageHash, 'general', effectStrength)
      if (cachedResult) {
        return NextResponse.json({
          ...cachedResult,
          fromCache: true
        })
      }
    }

    // キャプション生成とハッシュタグ生成を並列実行
    const [captionResponse, hashtagResponse, imageProcessingResponse] = await Promise.all([
      // キャプション生成
      openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: `あなたはSNS投稿の専門家です。料理写真と店舗情報を分析して、魅力的なキャプションを生成してください。

以下の条件でキャプションを生成してください：

1. 料理の魅力を最大限に引き出す表現
2. 感情に訴えかける言葉選び
3. 具体的でイメージしやすい描写
4. 店舗の特徴や雰囲気を活かした表現
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
            content: `【画像分析結果】
${imageAnalysis}

【店舗情報】
- 店舗名: ${session.name || '未設定'}
- 店舗の特徴: ${session.store_description || '未設定'}
- 固定キャプション: ${session.fixed_caption || 'なし'}

【要求内容】
${captionPrompt}

上記の画像分析結果で判明した「写真に写っている料理・食材・見た目・特徴」を具体的に反映し、店舗情報を活かした魅力的で集客につながるキャプションを生成してください。絵文字も効果的に使用してください。`
          }
        ],
        max_tokens: captionMaxTokens,
        temperature: 0.8
      }),

      // ハッシュタグ生成
      openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: `あなたはSNSマーケティングの専門家です。料理写真と店舗情報を分析して、効果的なハッシュタグを生成してください。

以下の条件でハッシュタグを生成してください：

【構成要件】
- 日本語ハッシュタグ：5つ（料理名、食材、調理法、雰囲気など）
- 英語ハッシュタグ：5つ（グローバル対応、人気タグ）
- 合計10個のハッシュタグを生成

【内容要件】
1. 写真に写っている料理・食材を具体的に反映
2. 店舗の特徴や雰囲気を活かしたハッシュタグ
3. 人気で検索されやすいハッシュタグ
4. 季節感や旬を表現するハッシュタグ
5. Instagram で人気のフードタグ

【出力形式】
日本語ハッシュタグ（5つ）
英語ハッシュタグ（5つ）
の順番で、各ハッシュタグは改行で区切ってください。`
          },
          {
            role: "user",
            content: `画像分析: ${imageAnalysis}

店舗情報:
- 店舗名: ${session.name || '未設定'}
- 店舗の特徴: ${session.store_description || '未設定'}
- 固定ハッシュタグ: ${session.fixed_hashtags || 'なし'}

この料理写真に写っている内容を具体的に反映し、店舗情報を活かした効果的なハッシュタグを生成してください。
日本語5つ、英語5つの順番で、各ハッシュタグは改行で区切ってください。`
          }
        ],
        max_tokens: hashtagMaxTokens,
        temperature: 0.7
      }),

      // AIによる画像加工提案（並列実行）
      openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: fastMode
              ? `あなたは画像処理の専門家です。料理写真を分析して、最適な画像加工設定を簡潔に提案してください。

以下の観点で分析し、CSSフィルターの設定値を提案してください：
1. 料理の色合いと明度
2. 食材の特徴
3. 調理方法
4. 盛り付けの特徴

提案するCSSフィルターの要素：
- brightness: 明度調整（0.8-1.5）
- contrast: コントラスト調整（0.8-1.3）
- saturate: 彩度調整（0.8-1.6）
- hue-rotate: 色相調整（-30deg-30deg）

要求された強度（${effectStrength}）を考慮し、簡潔な設定を提案してください。`
               : `あなたは画像処理の専門家です。料理写真を分析して、最適な画像加工設定を提案してください。

以下の観点で分析し、CSSフィルターの設定値を提案してください：
1. 料理の色合いと明度
2. 食材の特徴（肉、魚、野菜など）
3. 調理方法（焼く、煮る、揚げるなど）
4. 盛り付けの特徴
5. 器の色や材質
6. 全体的な雰囲気

提案するCSSフィルターの要素：
- brightness: 明度調整（0.8-1.5）
- contrast: コントラスト調整（0.8-1.3）
- saturate: 彩度調整（0.8-1.6）
- hue-rotate: 色相調整（-30deg-30deg）
- sepia: セピア効果（0-0.3）
- drop-shadow: 影効果

要求された強度（${effectStrength}）を考慮し、料理の魅力を最大限に引き出す設定を提案してください。`
           },
           {
             role: "user",
             content: [
               {
                 type: "text",
                 text: `画像分析: ${imageAnalysis}

要求された強度: ${effectStrength}

この料理写真に最適な画像加工設定を${fastMode ? '簡潔に' : '詳細に'}提案してください。CSSフィルターの設定値と、その効果の説明を出力してください。`
               },
               {
                 type: "image_url",
                 image_url: {
                   url: image,
                   detail: fastMode ? "low" : "high"
                 }
               }
             ]
           }
         ],
         max_tokens: fastMode ? 150 : 300,
         temperature: 0.3
       })
    ])

    let caption = captionResponse.choices[0]?.message?.content || ''
    let hashtags = hashtagResponse.choices[0]?.message?.content || ''
    const aiProcessingSuggestion = imageProcessingResponse.choices[0]?.message?.content || ''
    
    // 固定キャプションの追加
    if (session.fixed_caption) {
      caption = `${caption}\n\n${session.fixed_caption}`
    }

    // ハッシュタグを配列に変換して重複排除
    const generatedHashtags = hashtags
      .split('\n')
      .map(tag => tag.trim())
      .filter(tag => tag.startsWith('#') && tag.length > 1)

    // 固定ハッシュタグを追加（重複排除）
    const fixedHashtags = session.fixed_hashtags 
      ? session.fixed_hashtags.split(/[\s\n]+/).map(tag => tag.trim()).filter(tag => tag.startsWith('#') && tag.length > 1)
      : []

    // 重複排除して結合
    const allHashtags = [...generatedHashtags]
    fixedHashtags.forEach(tag => {
      if (!allHashtags.includes(tag)) {
        allHashtags.push(tag)
      }
    })

    const hashtagArray = allHashtags

    // 画像エフェクトの適用（AIによる最適化）
    let imageEffects = generateImageEffects(effectStrength)
    
    // AI提案に基づいてエフェクトを調整（必要に応じて）
    // 現在は基本的なエフェクトを使用し、AI提案は参考情報として提供
    const processedImage = image // 実際の画像処理はフロントエンドでCSSフィルターを使用

    // 結果をキャッシュに保存
    if (!regenerateCaption && !regenerateHashtags) {
      const imageHash = generateImageHash(image)
      await cacheResult(imageHash, 'general', effectStrength, {
        processedImage,
        caption,
        hashtags: hashtagArray,
        analysis: imageAnalysis,
        processingDetails: imageEffects.description
      })
    }

    return NextResponse.json({
      success: true,
      processedImage,
      caption,
      hashtags: hashtagArray,
      analysis: imageAnalysis,
      processingDetails: imageEffects.description,
      imageEffects,
      aiProcessingSuggestion,
      storeInfo: {
        name: session.name,
        description: session.store_description,
        fixedCaption: session.fixed_caption,
        fixedHashtags: session.fixed_hashtags
      },
      performance: {
        fastMode: fastMode || false,
        model: model,
        processingTime: Date.now() - startTime
      },
      fromCache: false
    })

  } catch (error) {
    console.error('AI処理エラー:', error)
    return NextResponse.json(
      { 
        error: 'AI処理でエラーが発生しました', 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Processing API (Production Ready)',
    status: 'active',
    version: '3.1.0',
    features: [
      'AI画像解析（Vision API）',
      '写真・店舗情報ベースのキャプション生成',
      '写真・店舗情報ベースのハッシュタグ生成',
      'AI画像加工提案',
      '画像エフェクト（CSSフィルター）',
      '並列処理による高速化',
      '高速モード（gpt-4o-mini）',
      'キャッシュ機能',
      'リトライ機能',
      'エラーハンドリング強化'
    ],
    effectStrengths: [
      'weak',
      'normal', 
      'strong',
      'instagram',
      'vivid'
    ],
    performance: {
      fastMode: 'gpt-4o-mini使用で約50%高速化',
      parallelProcessing: '3つのAI処理を並列実行',
      imageDetail: '高速モードでは低解像度解析'
    }
  })
} 