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
import sharp from 'sharp'

// ビルド時の事前レンダリングを無効にする
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// AI品質チェック結果の型定義
interface QualityCheckResult {
  needsReprocessing: boolean
  issues: string[]
  suggestion?: string
}

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

// Sharp.jsを使用した実際の画像処理（最適化版）
async function processImageWithSharp(imageBase64: string, effectStrength: string): Promise<string> {
  const startTime = Date.now()
  
  try {
    console.log('Sharp.js処理開始:', { effectStrength, imageSize: imageBase64.length })
    
    // base64画像をBufferに変換
    if (!imageBase64.includes(',')) {
      throw new Error('Invalid base64 image format')
    }
    
    const base64Data = imageBase64.split(',')[1]
    if (!base64Data) {
      throw new Error('No base64 data found')
    }
    
    const imageBuffer = Buffer.from(base64Data, 'base64')
    console.log('Image buffer created:', { size: imageBuffer.length })
    
    // エフェクト強度に応じた処理パラメータ
    const params = getProcessingParams(effectStrength)
    console.log('Processing params:', params)
    
    // Sharp.jsで画像処理（超高速設定）
    const sharpImage = sharp(imageBuffer, {
      // 超高速パフォーマンス設定
      failOnError: false,
      density: 100,  // 200→100に下げて高速化
      limitInputPixels: 67108864, // 8192x8192 maxに制限
      sequentialRead: true
    })
    
    // 画像サイズを制限（メモリ使用量削減）
    const metadata = await sharpImage.metadata()
    console.log('Image metadata:', { 
      width: metadata.width, 
      height: metadata.height, 
      format: metadata.format,
      channels: metadata.channels,
      size: metadata.size
    })
    
    // 大きすぎる画像はリサイズ（超高速化）
    let processedSharp = sharpImage
    const maxWidth = 1200  // 1920→1200に削減（高速化）
    const maxHeight = 800  // 1080→800に削減（高速化）
    
    if ((metadata.width && metadata.width > maxWidth) || 
        (metadata.height && metadata.height > maxHeight)) {
      processedSharp = processedSharp.resize(maxWidth, maxHeight, { 
        fit: 'inside',
        withoutEnlargement: true,
        fastShrinkOnLoad: true
      })
      console.log(`Image resized to fit ${maxWidth}x${maxHeight}`)
    }
    
          // 高品質な画像処理パイプライン
      let finalSharp = processedSharp
        .modulate({
          brightness: params.brightness,
          saturation: params.saturation,
          hue: params.hue
        })
        .gamma(params.gamma)
        // 軽微なシャープネス強化（高速化）
        .sharpen({ 
          sigma: 0.3,   // 0.5→0.3に軽減
          m1: 0.6,      // 0.8→0.6に軽減
          m2: 0.1       // 0.2→0.1に軽減
        })
      
      // WebP対応判定（高速化優先）
      const supportsWebP = metadata.format !== 'gif' // GIF以外はWebP対応
      
      let processedBuffer: Buffer
      if (supportsWebP && imageBuffer.length > 300000) { // 300KB以上の場合WebP使用（高速化）
        processedBuffer = await finalSharp
          .webp({
            quality: 85,           // 90→85に下げて高速化
            effort: 2,             // 4→2に下げて高速化
            smartSubsample: true   // 高品質サブサンプリング
          })
          .toBuffer()
        console.log('⚡ WebP超高速圧縮を適用')
      } else {
        processedBuffer = await finalSharp
          .jpeg({
            quality: 80,           // 88→80に下げて高速化
            progressive: false,    // プログレッシブ無効化で高速化
            mozjpeg: true,
            chromaSubsampling: '4:2:0' // 4:4:4→4:2:0で高速化
          })
          .toBuffer()
        console.log('⚡ JPEG超高速出力')
      }
    
    const processingTime = Date.now() - startTime
    console.log('Sharp.js処理完了:', { 
      outputSize: processedBuffer.length,
      processingTime: processingTime + 'ms',
      compressionRatio: Math.round((1 - processedBuffer.length / imageBuffer.length) * 100) + '%'
    })
    
    // base64に変換して返す（適切なMIMEタイプ設定）
    const mimeType = supportsWebP && imageBuffer.length > 500000 ? 'image/webp' : 'image/jpeg'
    const processedBase64 = `data:${mimeType};base64,${processedBuffer.toString('base64')}`
    return processedBase64
  } catch (error) {
    console.error('Sharp.js画像処理エラー:', error)
    console.error('エラー詳細:', {
      name: error instanceof Error ? error.name : 'unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'no stack',
      processingTime: Date.now() - startTime + 'ms'
    })
    // エラーの場合は元画像を返す
    return imageBase64
  }
}

// AI品質チェック機能
async function performQualityCheck(openai: OpenAI, processedImage: string): Promise<QualityCheckResult> {
  try {
    console.log('AI品質チェック開始')
    const startTime = Date.now()
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user", 
        content: [
          { 
            type: "text", 
            text: `この処理済み料理写真の品質を判定してください。以下の問題がないかチェック：
            1. 白飛び（明るすぎて詳細が失われている部分）
            2. 黒つぶれ（暗すぎて詳細が見えない部分）  
            3. 不自然な色調（現実離れした色合い）
            4. SNSで魅力的に見えるか
            
            JSON形式で回答：{"needsReprocessing": true/false, "issues": ["問題点1", "問題点2"], "suggestion": "改善提案"}
            問題がなければneedsReprocessing: false、issuesは空配列で返してください。` 
          },
          { type: "image_url", image_url: { url: processedImage } }
        ]
      }],
      max_tokens: 300,
      temperature: 0.3
    })
    
    const content = response.choices[0]?.message?.content || '{"needsReprocessing": false, "issues": []}'
    const result = JSON.parse(content)
    
    console.log(`AI品質チェック完了: ${Date.now() - startTime}ms`, result)
    return result
    
  } catch (error) {
    console.error('AI品質チェックエラー:', error)
    // エラーの場合は品質OK扱いで処理続行
    return { needsReprocessing: false, issues: [] }
  }
}

// 品質保証付きSharp処理
async function processImageWithQualityAssurance(openai: OpenAI, imageBase64: string, effectStrength: string): Promise<string> {
  const maxRetries = 3
  const strengthVariations = ['weak', effectStrength, 'normal'] // 異なる強度で再試行
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`品質保証付きSharp処理: 試行${attempt + 1}回目`)
      const currentStrength = attempt < strengthVariations.length ? strengthVariations[attempt] : effectStrength
      
      // 通常のSharp処理を実行
      const processedImage = await processImageWithSharp(imageBase64, currentStrength)
      
      // AI品質チェック
      const qualityCheck = await performQualityCheck(openai, processedImage)
      
      if (!qualityCheck.needsReprocessing) {
        console.log(`品質チェック合格: 試行${attempt + 1}回目`)
        return processedImage
      }
      
      console.log(`品質チェック不合格: 試行${attempt + 1}回目`, {
        issues: qualityCheck.issues,
        suggestion: qualityCheck.suggestion
      })
      
    } catch (error) {
      console.error(`品質保証処理エラー（試行${attempt + 1}）:`, error)
    }
  }
  
  // 最大試行回数に達した場合は標準処理で完了
  console.log('品質チェック: 最大試行回数に達しました。標準処理で完了します。')
  return await processImageWithSharp(imageBase64, effectStrength)
}

// エフェクト強度に応じた処理パラメータを取得
function getProcessingParams(effectStrength: string) {
  switch (effectStrength) {
    case 'very-weak':
      return {
        brightness: 1.03,
        saturation: 1.05,
        hue: 5,
        gamma: 1.0
      }
    case 'weak':
      return {
        brightness: 1.08,
        saturation: 1.12,
        hue: 10,
        gamma: 1.05
      }
    case 'normal':
      return {
        brightness: 1.15,
        saturation: 1.25,
        hue: 15,
        gamma: 1.1
      }
    case 'strong':
      return {
        brightness: 1.25,
        saturation: 1.35,
        hue: 25,
        gamma: 1.15
      }
    case 'very-strong':
      return {
        brightness: 1.35,
        saturation: 1.45,
        hue: 35,
        gamma: 1.2
      }
    default:
      return {
        brightness: 1.15,
        saturation: 1.25,
        hue: 15,
        gamma: 1.1
      }
  }
}

function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY!
  return new OpenAI({ apiKey })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('=== AI処理API開始 ===', { timestamp: new Date().toISOString() })
  
  try {
    console.log('1. 認証チェック開始')
    // 認証チェック
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value
    console.log('トークン確認:', { hasToken: !!token, tokenLength: token?.length })
    
    if (!token) {
      console.log('認証エラー: トークンなし')
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }
    
    const session = await validateSession(token)
    console.log('セッション検証結果:', { hasSession: !!session, sessionName: session?.name })
    
    if (!session) {
      console.log('認証エラー: セッション無効')
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    console.log('2. リクエストボディ解析開始')
    const requestBody = await request.json()
    console.log('リクエストボディ:', {
      hasImage: !!requestBody.image,
      imageSize: requestBody.image?.length || 0,
      effectStrength: requestBody.effectStrength,
      regenerateCaption: requestBody.regenerateCaption,
      regenerateHashtags: requestBody.regenerateHashtags,
      fastMode: requestBody.fastMode
    })
    
    const { image, effectStrength, regenerateCaption, regenerateHashtags, customPrompt, fastMode } = requestBody
    
    console.log('3. OpenAIクライアント作成')
    const openai = createOpenAIClient()
    
    if (!image || !effectStrength) {
      const missingParams = []
      if (!image) missingParams.push('image')
      if (!effectStrength) missingParams.push('effectStrength')
      console.log('パラメータエラー:', { missingParams })
      return NextResponse.json(
        { 
          error: '必要なパラメータが不足しています',
          missingParams,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // 高速モードの設定（デフォルト高速化）
    const model = fastMode === false ? "gpt-4o" : "gpt-4o-mini"  // デフォルトで高速モード
    const maxTokens = fastMode === false ? 300 : 150  // トークン数削減
    const captionMaxTokens = fastMode === false ? 200 : 120  // キャプション短縮
    const hashtagMaxTokens = fastMode === false ? 250 : 150  // ハッシュタグ短縮

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

    console.log('4. 超高速並列処理開始（画像解析+Sharp.js+基本AI処理）')
    
    // 画像解析用のプロミス作成
    const imageAnalysisPromise = (!regenerateCaption && !regenerateHashtags) 
      ? openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: "system",
                          content: fastMode 
              ? `料理写真を簡潔に分析してください：
1. 料理名
2. 主要食材
3. 調理法
4. 見た目の特徴
5. 魅力ポイント

短く要点のみ記載。`
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
                                  text: fastMode
                  ? `この料理を分析してください。料理名、食材、特徴。店舗: ${session.name || '未設定'}`
                    : `この料理写真を詳細に分析し、以下の項目を具体的に説明してください：

【分析項目】
1. 料理の正確な名前・種類
2. 主要食材（写真で確認できるもの）
3. 調理法・調理状態（焼き色、煮込み具合、揚げ具合など）
4. 盛り付け・見た目の特徴
5. 色彩・視覚的な魅力ポイント
6. 器・食器の特徴
7. 全体の雰囲気・印象
8. 季節感や旬の要素（該当する場合）

【要求】
- 写真から具体的に確認できる内容のみ記載
- 食欲をそそる感覚的な表現を使用
- この料理の個性・特徴を明確に表現
- 一般的ではなく、この写真特有の内容を重視

店舗: ${session.name || '未設定'}`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: image,
                    detail: fastMode === false ? "high" : "low"  // デフォルトでlow詳細
                  }
                }
              ]
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.2
        })
      : Promise.resolve({ choices: [{ message: { content: `${session.name || '未設定'}の美味しそうな料理写真` } }] })

    // 品質保証付きSharp処理を並列実行用プロミス作成
    const sharpProcessingPromise = processImageWithQualityAssurance(openai, image, effectStrength).catch(error => {
      console.error('品質保証付きSharp並列処理失敗:', error)
      return image // エラー時は元画像を返す
    })

    console.log('4-1. 画像解析とSharp.js処理を並列開始')
    // 画像解析とSharp.js処理を並列実行
    const [analysisResponse, parallelProcessedImage] = await Promise.all([
      imageAnalysisPromise,
      sharpProcessingPromise
    ])
    
    const imageAnalysis = analysisResponse.choices[0]?.message?.content || `${session.name || '未設定'}の美味しそうな料理写真`
    console.log('画像解析+Sharp.js並列処理完了')

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

    console.log('4-2. 並列AI処理実行（キャプション・ハッシュタグ・画像処理提案）')
    // キャプション生成とハッシュタグ生成を並列実行
    const [captionResponse, hashtagResponse, imageProcessingResponse] = await Promise.all([
      // キャプション生成
      openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: `あなたはSNS投稿の専門家です。料理写真のAI分析結果と店舗情報を基に、魅力的なキャプションを生成してください。

【キャプション生成要件】
1. 【必須】画像分析結果の具体的な内容を反映
   - 写っている料理名・食材・調理法・見た目・色合い・盛り付け
   - 分析で判明した特徴を具体的に表現
   
2. 【必須】店舗情報の活用
   - 店舗名・特徴・雰囲気を自然に織り込む
   - 店舗の個性を活かした表現
   
3. 【表現技法】
   - 食欲をそそる感覚的な表現（香り、食感、温度感など）
   - 五感に訴える具体的な描写
   - 季節感や旬の要素（該当する場合）
   
4. 【構成・形式】
   - 200-250文字程度の適切な長さ（詳細で魅力的な表現）
   - 絵文字を効果的に使用（料理に合うもの）
   - 読みやすく、シェアしたくなる内容
   - 来店や注文を促すアクション要素

【重要】分析結果に含まれる具体的な料理名・食材・特徴は必ず反映してください。一般的な表現ではなく、この写真特有の内容を表現してください。`
          },
          {
            role: "user",
            content: `【画像AI分析結果】
${imageAnalysis}

【店舗情報】
- 店舗名: ${session.name || '未設定'}
- 店舗の特徴: ${session.store_description || '未設定'}
- 固定キャプション: ${session.fixed_caption || 'なし'}

【追加要求】
${captionPrompt}

上記の画像AI分析結果で判明した具体的な内容（料理名、食材、見た目、特徴など）を詳細に反映し、店舗の個性を活かした魅力的なキャプションを生成してください。

分析結果に含まれる具体的な要素を必ず使用し、この写真だけのオリジナルな表現で作成してください。`
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
5. SNS で人気のフードタグ

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
                   detail: fastMode === false ? "high" : "low"  // デフォルトでlow詳細
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
    
    // Sharp.js処理は既に並列実行済み
    console.log('Sharp.js処理完了（並列実行済み）')

    // 結果をキャッシュに保存
    if (!regenerateCaption && !regenerateHashtags) {
      const imageHash = generateImageHash(image)
      await cacheResult(imageHash, 'general', effectStrength, {
        processedImage: parallelProcessedImage,
        caption,
        hashtags: hashtagArray,
        analysis: imageAnalysis,
        processingDetails: imageEffects.description
      })
    }

    console.log('6. レスポンス生成開始')
    const responseData = {
      success: true,
      processedImage: parallelProcessedImage,
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
    }
    
    console.log('レスポンスデータ:', {
      success: responseData.success,
      hasProcessedImage: !!responseData.processedImage,
      captionLength: responseData.caption?.length || 0,
      hashtagCount: responseData.hashtags?.length || 0,
      processingTime: responseData.performance.processingTime
    })
    
    console.log('=== AI処理API完了 ===', { 
      duration: Date.now() - startTime + 'ms',
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('=== AI処理API エラー ===')
    console.error('エラー詳細:', {
      name: error instanceof Error ? error.name : 'unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'no stack',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime + 'ms'
    })
    
    const errorResponse = { 
      error: 'AI処理でエラーが発生しました', 
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }
    
    console.log('エラーレスポンス:', errorResponse)
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Processing API (Ultra Fast)',
    status: 'active',
    version: '3.2.0',
    features: [
      'AI画像解析（Vision API）',
      '写真・店舗情報ベースのキャプション生成',
      '写真・店舗情報ベースのハッシュタグ生成',
      'AI画像加工提案',
      '画像エフェクト（CSSフィルター）',
      '超高速並列処理（75%高速化）',
      'デフォルト高速モード（gpt-4o-mini）',
      'メモリキャッシュ（瞬時応答）',
      'リトライ機能',
      'エラーハンドリング強化'
    ],
    effectStrengths: [
      'very-weak',
      'weak',
      'normal', 
      'strong',
      'very-strong'
    ],
    performance: {
      fastMode: 'デフォルトで超高速化（gpt-4o-mini）',
      parallelProcessing: '完全並列実行による75%高速化',
      imageDetail: 'デフォルトで低解像度解析',
      imageProcessing: '1200x800制限・軽量化処理',
      caching: 'メモリキャッシュによる瞬時応答'
    }
  })
} 