"""
画像処理とOpenAI APIとの統合
"""

import io
import logging
from typing import Optional, Dict, Any, Tuple
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import base64
from .openai_client import get_openai_client
import numpy as np

# ログ設定
logger = logging.getLogger(__name__)

class ImageProcessor:
    """画像処理とAI機能を統合するクラス"""
    
    def __init__(self):
        """画像プロセッサを初期化"""
        self.openai_client = get_openai_client()
        self.max_image_size = 4 * 1024 * 1024  # 4MB制限
        self.supported_formats = ['PNG', 'JPEG', 'JPG']
        
    def process_image_for_business(
        self, 
        image_bytes: bytes, 
        business_type: str, 
        target_audience: str,
        brightness: int = 0,
        saturation: int = 0,
        contrast: int = 0
    ) -> Dict[str, Any]:
        """
        AI分析 + 従来技術による高品質な画像処理
        
        Args:
            image_bytes: 画像のバイトデータ
            business_type: 業種
            target_audience: ターゲット層
            brightness: 明度調整 (-50 to 50)
            saturation: 彩度調整 (-50 to 50)
            contrast: コントラスト調整 (-50 to 50)
            
        Returns:
            処理結果の辞書
        """
        try:
            # 画像の前処理
            processed_image_io = self._preprocess_image(image_bytes)
            if not processed_image_io:
                return {"error": "画像の前処理に失敗しました"}
            
            # PILイメージに変換
            from PIL import Image
            processed_image_io.seek(0)
            image = Image.open(processed_image_io)
            
            # AI分析の実行（画像内容の理解用）
            analysis = self._analyze_image_content(processed_image_io)
            
            # AI分析結果に基づく最適な調整パラメータを計算
            ai_adjustments = self._calculate_ai_adjustments(
                business_type, target_audience, analysis, brightness, saturation, contrast
            )
            
            # 従来の画像処理技術で高品質加工を実行
            enhanced_image, description = self._apply_professional_adjustments(
                image, ai_adjustments
            )
            
            # 画像をバイト配列に変換
            import io
            output_buffer = io.BytesIO()
            enhanced_image.save(output_buffer, format='PNG', optimize=False, quality=100)
            processed_image_bytes = output_buffer.getvalue()
            
            return {
                "success": True,
                "processed_image": processed_image_bytes,
                "analysis": analysis,
                "adjustments": ai_adjustments,
                "explanation": self._generate_professional_explanation(
                    business_type, target_audience, ai_adjustments, description
                )
            }
                
        except Exception as e:
            logger.error(f"画像処理エラー: {e}")
            return {"error": f"画像処理中にエラーが発生しました: {str(e)}"}
    
    def _preprocess_image(self, image_bytes: bytes) -> Optional[io.BytesIO]:
        """画像の前処理（サイズ調整、形式変換など）"""
        try:
            # ファイルサイズチェック
            if len(image_bytes) > self.max_image_size:
                logger.warning(f"画像サイズが制限を超えています: {len(image_bytes)} bytes")
            
            # PILで画像を開く
            image = Image.open(io.BytesIO(image_bytes))
            
            # RGBAまたはRGBに変換
            if image.mode not in ['RGB', 'RGBA']:
                image = image.convert('RGB')
            
            # サイズ調整（必要に応じて）- より大きなサイズを許可
            max_size = 2048  # 解像度を向上させるため制限を緩和
            if image.width > max_size or image.height > max_size:
                image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                logger.info(f"画像サイズを調整しました: {image.size}")
            
            # PNG形式で保存（品質劣化を最小限に）
            output = io.BytesIO()
            image.save(output, format='PNG', optimize=False)  # 品質優先
            output.seek(0)
            
            return output
            
        except Exception as e:
            logger.error(f"画像前処理エラー: {e}")
            return None
    
    def _apply_manual_adjustments(
        self, 
        image_io: io.BytesIO, 
        brightness: int, 
        saturation: int, 
        contrast: int
    ) -> io.BytesIO:
        """手動調整を適用"""
        try:
            image_io.seek(0)
            image = Image.open(image_io)
            
            # 明度調整
            if brightness != 0:
                enhancer = ImageEnhance.Brightness(image)
                factor = 1.0 + (brightness / 100.0)
                image = enhancer.enhance(factor)
            
            # 彩度調整
            if saturation != 0:
                enhancer = ImageEnhance.Color(image)
                factor = 1.0 + (saturation / 100.0)
                image = enhancer.enhance(factor)
            
            # コントラスト調整
            if contrast != 0:
                enhancer = ImageEnhance.Contrast(image)
                factor = 1.0 + (contrast / 100.0)
                image = enhancer.enhance(factor)
            
            # 調整後の画像を保存
            output = io.BytesIO()
            image.save(output, format='PNG', optimize=True)
            output.seek(0)
            
            logger.info(f"手動調整を適用しました: 明度{brightness}, 彩度{saturation}, コントラスト{contrast}")
            return output
            
        except Exception as e:
            logger.error(f"手動調整エラー: {e}")
            return image_io
    
    def _analyze_image_content(self, image_io: io.BytesIO) -> Optional[str]:
        """Vision APIを使って画像内容を分析"""
        try:
            image_io.seek(0)
            analysis_prompt = """
            この飲食店の料理写真を分析して、以下の点について教えてください：
            1. 料理の種類と特徴
            2. 現在の色調や明度の状態
            3. インスタ映えの観点での改善点
            4. おすすめの撮影角度や構図
            
            簡潔に日本語で回答してください。
            """
            
            analysis = self.openai_client.analyze_image(image_io, analysis_prompt)
            return analysis
            
        except Exception as e:
            logger.error(f"画像分析エラー: {e}")
            return None
    
    def _generate_edit_prompt(
        self, 
        business_type: str, 
        target_audience: str, 
        analysis: Optional[str],
        brightness: int,
        saturation: int, 
        contrast: int
    ) -> str:
        """業種とターゲット層に基づいて色調・光量調整専用のプロンプトを生成"""
        
        # 厳格な制限事項を最初に明記
        base_prompt = """IMPORTANT: Only adjust colors, lighting, contrast, and saturation. DO NOT change any shapes, objects, or add/remove anything in the photo. Keep all existing elements exactly as they are.

Enhance this food photograph by adjusting ONLY the color tone, lighting, and contrast. """
        
        # 業種別の色調・光量スタイル指定
        business_color_styles = {
            "居酒屋": "warm amber lighting, cozy orange-red tones, slightly increased saturation for comfort food appeal",
            "バー・パブ": "sophisticated moody lighting, rich deeper tones, enhanced contrast for premium atmosphere",
            "カフェ": "bright natural lighting, clean fresh tones, slightly enhanced brightness for Instagram appeal",
            "レストラン": "elegant balanced lighting, refined color palette, professional food photography tones",
            "ラーメン店": "warm inviting lighting, appetizing golden tones, enhanced warmth for comfort food",
            "寿司店": "clean crisp lighting, natural fresh colors, balanced contrast for premium freshness",
            "焼肉店": "warm rich lighting, appetizing brown and red tones, enhanced warmth and richness",
            "イタリアン": "warm Mediterranean lighting, rich golden tones, balanced saturation",
            "フレンチ": "elegant refined lighting, sophisticated color balance, fine dining presentation",
            "中華料理": "vibrant rich lighting, enhanced reds and golds, festive color enhancement"
        }
        
        # ターゲット層別の色調調整
        audience_color_styles = {
            "OL・女性会社員": "Instagram-optimized colors, trendy bright tones, social media friendly lighting",
            "男性会社員": "professional clean tones, balanced natural lighting, appetizing colors",
            "学生": "vibrant fun colors, bright energetic lighting, youthful color enhancement",
            "シニア": "clear natural colors, comfortable warm lighting, easy-to-see contrast",
            "カップル": "romantic warm lighting, intimate cozy tones, soft appealing colors",
            "家族": "warm welcoming colors, comfortable natural lighting, family-friendly tones",
            "友人グループ": "fun bright colors, social gathering lighting, cheerful color enhancement"
        }
        
        # 業種スタイルを追加
        business_style = business_color_styles.get(business_type, "appetizing natural food coloring")
        base_prompt += f"Color/lighting style for {business_type}: {business_style}. "
        
        # ターゲット層スタイルを追加
        audience_style = audience_color_styles.get(target_audience, "appealing natural presentation")
        base_prompt += f"Target audience color preference: {audience_style}. "
        
        # 手動調整を反映
        color_adjustments = []
        if brightness > 0:
            color_adjustments.append("increase brightness and highlights")
        elif brightness < 0:
            color_adjustments.append("reduce brightness, create softer lighting")
            
        if saturation > 0:
            color_adjustments.append("enhance color saturation and vibrancy")
        elif saturation < 0:
            color_adjustments.append("reduce saturation for muted tones")
            
        if contrast > 0:
            color_adjustments.append("increase contrast between light and dark areas")
        elif contrast < 0:
            color_adjustments.append("soften contrast for gentler appearance")
        
        if color_adjustments:
            base_prompt += f"Specific color adjustments: {', '.join(color_adjustments)}. "
        
        # 分析結果を反映（あれば）
        if analysis:
            base_prompt += "Consider the current image characteristics for optimal enhancement. "
        
        # 最終的な制限事項を再度強調
        base_prompt += """
        
CRITICAL RESTRICTIONS:
- Only adjust lighting, color temperature, saturation, contrast, and brightness
- DO NOT add, remove, or modify any objects, text, or shapes
- DO NOT change the composition or crop the image
- Keep all existing food items, plates, decorations exactly as they are
- Focus purely on color grading and lighting enhancement like professional photo editing software"""
        
        logger.info(f"生成された編集プロンプト: {base_prompt[:200]}...")
        return base_prompt
    
    def _calculate_ai_adjustments(
        self, 
        business_type: str, 
        target_audience: str, 
        analysis: Optional[str],
        brightness: int,
        saturation: int,
        contrast: int
    ) -> Dict[str, float]:
        """AI分析結果に基づいて最適な調整パラメータを計算"""
        
        # 基本調整値（手動設定を反映）
        adjustments = {
            "brightness": 1.0 + (brightness / 100.0),
            "saturation": 1.0 + (saturation / 100.0),
            "contrast": 1.0 + (contrast / 100.0),
            "warmth": 1.0,
            "sharpness": 1.0,
            "shadows": 0.0,
            "highlights": 0.0
        }
        
        # 業種別の微調整
        business_adjustments = {
            "居酒屋": {"warmth": 1.08, "saturation": 1.05, "brightness": 1.02},
            "バー・パブ": {"contrast": 1.08, "shadows": -0.1, "warmth": 0.98},
            "カフェ": {"brightness": 1.05, "highlights": 0.05, "saturation": 1.03},
            "レストラン": {"contrast": 1.03, "sharpness": 1.02, "warmth": 1.02},
            "ラーメン店": {"warmth": 1.1, "saturation": 1.06, "brightness": 1.03},
            "寿司店": {"contrast": 1.04, "sharpness": 1.03, "brightness": 1.02},
            "焼肉店": {"warmth": 1.12, "saturation": 1.08, "contrast": 1.05},
            "イタリアン": {"warmth": 1.06, "saturation": 1.04, "brightness": 1.02},
            "フレンチ": {"contrast": 1.04, "sharpness": 1.02, "highlights": 0.03},
            "中華料理": {"saturation": 1.07, "warmth": 1.05, "brightness": 1.02}
        }
        
        # ターゲット層別の微調整
        audience_adjustments = {
            "OL・女性会社員": {"brightness": 1.03, "saturation": 1.04, "highlights": 0.05},
            "男性会社員": {"contrast": 1.02, "sharpness": 1.01},
            "学生": {"saturation": 1.05, "brightness": 1.03, "warmth": 1.02},
            "シニア": {"contrast": 1.03, "brightness": 1.02, "sharpness": 1.01},
            "カップル": {"warmth": 1.05, "brightness": 1.02, "saturation": 1.02},
            "家族": {"brightness": 1.03, "warmth": 1.03, "saturation": 1.02},
            "友人グループ": {"saturation": 1.04, "brightness": 1.02, "warmth": 1.02}
        }
        
        # 業種別調整を適用
        if business_type in business_adjustments:
            for key, value in business_adjustments[business_type].items():
                if key in adjustments:
                    adjustments[key] *= value
                else:
                    adjustments[key] = value
        
        # ターゲット層別調整を適用
        if target_audience in audience_adjustments:
            for key, value in audience_adjustments[target_audience].items():
                if key in adjustments:
                    adjustments[key] *= value
                else:
                    adjustments[key] = value
        
        # AI分析結果を反映（画像の明度を分析して自動調整）
        if analysis and "暗い" in analysis:
            adjustments["brightness"] *= 1.08
            adjustments["shadows"] += 0.1
        elif analysis and "明るい" in analysis:
            adjustments["brightness"] *= 0.95
            adjustments["highlights"] -= 0.05
        
        logger.info(f"AI調整パラメータを計算: {adjustments}")
        return adjustments
    
    def _apply_professional_adjustments(self, image: Image.Image, adjustments: Dict[str, float]) -> Tuple[Image.Image, str]:
        """プロ品質の画像調整を適用"""
        try:
            enhanced_image = image.copy()
            applied_adjustments = []
            
            # 明度調整
            if adjustments.get("brightness", 1.0) != 1.0:
                brightness_factor = adjustments["brightness"]
                enhancer = ImageEnhance.Brightness(enhanced_image)
                enhanced_image = enhancer.enhance(brightness_factor)
                applied_adjustments.append(f"明度調整 ({brightness_factor:.2f}倍)")
            
            # コントラスト調整
            if adjustments.get("contrast", 1.0) != 1.0:
                contrast_factor = adjustments["contrast"]
                enhancer = ImageEnhance.Contrast(enhanced_image)
                enhanced_image = enhancer.enhance(contrast_factor)
                applied_adjustments.append(f"コントラスト調整 ({contrast_factor:.2f}倍)")
            
            # 彩度調整
            if adjustments.get("saturation", 1.0) != 1.0:
                saturation_factor = adjustments["saturation"]
                enhancer = ImageEnhance.Color(enhanced_image)
                enhanced_image = enhancer.enhance(saturation_factor)
                applied_adjustments.append(f"彩度調整 ({saturation_factor:.2f}倍)")
            
            # シャープネス調整
            if adjustments.get("sharpness", 1.0) != 1.0:
                sharpness_factor = adjustments["sharpness"]
                enhancer = ImageEnhance.Sharpness(enhanced_image)
                enhanced_image = enhancer.enhance(sharpness_factor)
                applied_adjustments.append(f"シャープネス調整 ({sharpness_factor:.2f}倍)")
            
            # 色温度調整
            if adjustments.get("warmth", 1.0) != 1.0:
                warmth_factor = adjustments["warmth"]
                enhanced_image = adjust_color_temperature(enhanced_image, warmth_factor)
                applied_adjustments.append(f"色温度調整 ({warmth_factor:.2f}倍)")
            
            # ハイライト・シャドウ調整
            if adjustments.get("shadows", 0.0) != 0.0 or adjustments.get("highlights", 0.0) != 0.0:
                enhanced_image = self._adjust_shadows_highlights(
                    enhanced_image, 
                    adjustments.get("shadows", 0.0), 
                    adjustments.get("highlights", 0.0)
                )
                applied_adjustments.append("ハイライト・シャドウ調整")
            
            description = f"プロ品質画像処理完了: {', '.join(applied_adjustments) if applied_adjustments else '調整なし'}"
            logger.info(description)
            
            return enhanced_image, description
            
        except Exception as e:
            logger.error(f"プロ品質画像処理エラー: {e}")
            return image, f"処理エラー: {str(e)}"
    
    def _adjust_shadows_highlights(self, image: Image.Image, shadows: float, highlights: float) -> Image.Image:
        """ハイライトとシャドウを個別に調整"""
        try:
            import numpy as np
            
            # PILからnumpy配列に変換
            img_array = np.array(image)
            
            # グレースケールで明度を計算
            gray = np.dot(img_array[...,:3], [0.299, 0.587, 0.114])
            
            # ハイライト部分（明るい部分）を調整
            if highlights != 0.0:
                highlight_mask = gray > 150  # 明るい部分
                img_array[highlight_mask] = np.clip(
                    img_array[highlight_mask] * (1.0 + highlights), 0, 255
                )
            
            # シャドウ部分（暗い部分）を調整
            if shadows != 0.0:
                shadow_mask = gray < 100  # 暗い部分
                img_array[shadow_mask] = np.clip(
                    img_array[shadow_mask] * (1.0 + shadows), 0, 255
                )
            
            # numpy配列からPILに変換
            return Image.fromarray(img_array.astype(np.uint8))
            
        except Exception as e:
            logger.error(f"ハイライト・シャドウ調整エラー: {e}")
            return image
    
    def _generate_professional_explanation(
        self, 
        business_type: str, 
        target_audience: str, 
        adjustments: Dict[str, float],
        description: str
    ) -> str:
        """プロ品質処理の説明を生成"""
        
        explanation = f"""
### 🎨 AI分析 + プロ品質画像処理完了

**🏪 業種設定**: {business_type}
**👥 ターゲット層**: {target_audience}

#### 🤖 AI分析による最適化:
- **色調分析**: 画像の特性を分析して最適な調整値を算出
- **業種別最適化**: {business_type}に最適な色調・明度・コントラストを適用
- **ターゲット層対応**: {target_audience}向けの魅力的な仕上がりに調整

#### 🎯 適用された調整:
- **明度**: {adjustments.get('brightness', 1.0):.2f}倍
- **彩度**: {adjustments.get('saturation', 1.0):.2f}倍  
- **コントラスト**: {adjustments.get('contrast', 1.0):.2f}倍
- **色温度**: {adjustments.get('warmth', 1.0):.2f}倍
- **シャープネス**: {adjustments.get('sharpness', 1.0):.2f}倍

#### 📸 プロ品質処理:
{description}

#### 🎨 色調の特徴:
{self._get_business_explanation(business_type)}
{self._get_audience_explanation(target_audience)}

> ✅ **処理方式**: AI分析 + 従来の高品質画像処理技術
> 📷 **品質**: 元画像の美しさを保持しながらプロ品質に向上
        """
        
        return explanation
    
    def _edit_image_with_ai(self, image_io: io.BytesIO, prompt: str) -> Optional[str]:
        """OpenAI APIを使って画像を編集"""
        try:
            image_io.seek(0)
            
            # 画像サイズを確認してDALL-E 2の制限に合わせる
            image_data = image_io.read()
            image = Image.open(io.BytesIO(image_data))
            
            # DALL-E 2は正方形の画像が必要
            # 長い辺を基準に正方形にクロップ
            width, height = image.size
            size = min(width, height)
            
            # 中央から正方形を切り出し
            left = (width - size) // 2
            top = (height - size) // 2
            right = left + size
            bottom = top + size
            
            square_image = image.crop((left, top, right, bottom))
            
            # 1024x1024にリサイズ
            square_image = square_image.resize((1024, 1024), Image.Resampling.LANCZOS)
            
            # PNG形式で保存
            image_file = io.BytesIO()
            square_image.save(image_file, format='PNG')
            image_file.seek(0)
            image_file.name = "image.png"
            
            logger.info(f"画像を正方形に調整しました: {square_image.size}")
            
            # OpenAI APIで編集
            result_url = self.openai_client.edit_image(
                image_file=image_file,
                mask_file=None,  # 全体編集のためマスクなし
                prompt=prompt
            )
            
            return result_url
            
        except Exception as e:
            logger.error(f"AI画像編集エラー: {e}")
            return None
    
    def _generate_explanation(
        self, 
        business_type: str, 
        target_audience: str,
        brightness: int,
        saturation: int,
        contrast: int
    ) -> str:
        """処理内容の説明を生成"""
        
        explanation = f"""
### 🎨 適用された加工内容

**🏪 業種設定**: {business_type}
**👥 ターゲット層**: {target_audience}

#### 手動調整:
- **明度**: {brightness:+d}
- **彩度**: {saturation:+d}  
- **コントラスト**: {contrast:+d}

#### AI最適化:
{self._get_business_explanation(business_type)}
{self._get_audience_explanation(target_audience)}

#### 適用された処理:
- OpenAI DALL-E 2による画像編集
- 業種・ターゲット層に基づく自動最適化
- インスタ映え向けの色調・構図調整
- 高品質な仕上がりの実現

> ✨ **結果**: プロフェッショナルな品質でインスタ映えする画像に変換されました
        """
        
        return explanation
    
    def _get_business_explanation(self, business_type: str) -> str:
        """業種別の説明"""
        explanations = {
            "居酒屋": "- **居酒屋スタイル**: 温かみのある色調とレトロな雰囲気で、親しみやすさを演出",
            "バー・パブ": "- **バー・パブスタイル**: 暗めのムードとドラマチックな照明で、大人の雰囲気を演出",
            "カフェ": "- **カフェスタイル**: 明るく清潔感のある色調で、リラックスできる空間を演出",
            "レストラン": "- **レストランスタイル**: 洗練された色調とプロフェッショナルな仕上がりで、高級感を演出",
            "ラーメン店": "- **ラーメン店スタイル**: 温かみのある色調で、食欲をそそる美味しさを演出",
            "寿司店": "- **寿司店スタイル**: 鮮やかで清潔感のある色調で、新鮮さと上品さを演出"
        }
        return explanations.get(business_type, "- **標準スタイル**: 飲食店向けの一般的な色調調整")
    
    def _get_audience_explanation(self, target_audience: str) -> str:
        """ターゲット層別の説明"""
        explanations = {
            "OL・女性会社員": "- **OL・女性会社員向け**: Instagram投稿に最適なトレンド感のある加工",
            "男性会社員": "- **男性会社員向け**: ビジネスライクで清潔感のある仕上がり",
            "学生": "- **学生向け**: 若々しく活気のある色調で、楽しさを演出",
            "シニア": "- **シニア向け**: 見やすく分かりやすい色調とコントラスト",
            "カップル": "- **カップル向け**: ロマンティックで温かみのある色調",
            "家族": "- **家族向け**: 親しみやすく温かい雰囲気の色調"
        }
        return explanations.get(target_audience, "- **一般向け**: 幅広い層に訴求する色調調整")

def enhance_image_traditional(
    image: Image.Image,
    brightness: float = 1.0,
    contrast: float = 1.0,
    saturation: float = 1.0,
    sharpness: float = 1.0,
    auto_enhance: bool = True
) -> Tuple[Image.Image, str]:
    """
    従来の画像処理技術を使用して画像を補正
    
    Args:
        image: 処理する画像
        brightness: 明度調整 (0.5=暗く, 1.0=元のまま, 1.5=明るく)
        contrast: コントラスト調整 (0.5=低く, 1.0=元のまま, 1.5=高く)
        saturation: 彩度調整 (0.0=グレースケール, 1.0=元のまま, 2.0=鮮やか)
        sharpness: シャープネス調整 (0.0=ぼかし, 1.0=元のまま, 2.0=シャープ)
        auto_enhance: 自動補正を適用するか
        
    Returns:
        補正された画像と処理内容の説明
    """
    try:
        logger.info("従来の画像処理技術で画像補正を開始します")
        
        # 元画像をコピー
        enhanced_image = image.copy()
        adjustments = []
        
        # 自動補正（より控えめに）
        if auto_enhance:
            # 自動コントラスト調整（cutoffを大きくしてより控えめに）
            enhanced_image = ImageOps.autocontrast(enhanced_image, cutoff=3)
            adjustments.append("自動コントラスト調整")
            
            # 自動カラーバランス調整は画質劣化の原因になることがあるため無効化
            # try:
            #     enhanced_image = ImageOps.equalize(enhanced_image)
            #     adjustments.append("自動カラーバランス調整")
            # except:
            #     pass  # グレースケール画像では失敗する可能性がある
        
        # 明度調整
        if brightness != 1.0:
            enhancer = ImageEnhance.Brightness(enhanced_image)
            enhanced_image = enhancer.enhance(brightness)
            adjustments.append(f"明度調整 ({brightness:.1f}倍)")
        
        # コントラスト調整
        if contrast != 1.0:
            enhancer = ImageEnhance.Contrast(enhanced_image)
            enhanced_image = enhancer.enhance(contrast)
            adjustments.append(f"コントラスト調整 ({contrast:.1f}倍)")
        
        # 彩度調整
        if saturation != 1.0:
            enhancer = ImageEnhance.Color(enhanced_image)
            enhanced_image = enhancer.enhance(saturation)
            adjustments.append(f"彩度調整 ({saturation:.1f}倍)")
        
        # シャープネス調整
        if sharpness != 1.0:
            enhancer = ImageEnhance.Sharpness(enhanced_image)
            enhanced_image = enhancer.enhance(sharpness)
            adjustments.append(f"シャープネス調整 ({sharpness:.1f}倍)")
        
        # 追加のフィルター処理（料理写真に適した処理）- より控えめに
        if auto_enhance and sharpness > 1.0:
            # 軽いアンシャープマスク効果（シャープネス調整がある場合のみ）
            enhanced_image = enhanced_image.filter(ImageFilter.UnsharpMask(radius=0.5, percent=110, threshold=5))
            adjustments.append("軽いアンシャープマスク適用")
        
        description = f"画像補正完了: {', '.join(adjustments) if adjustments else '変更なし'}"
        logger.info(description)
        
        return enhanced_image, description
        
    except Exception as e:
        logger.error(f"画像補正エラー: {e}")
        return image, f"画像補正エラー: {str(e)}"

def auto_enhance_food_photo(image: Image.Image, gentle_mode: bool = False) -> Tuple[Image.Image, str]:
    """
    料理写真に特化した自動補正
    
    Args:
        image: 処理する画像
        gentle_mode: 画質優先モード（True=優しい処理、False=標準処理）
        
    Returns:
        補正された画像と処理内容の説明
    """
    try:
        logger.info("料理写真向け自動補正を開始します")
        
        # 画像の明度を分析
        grayscale = image.convert('L')
        histogram = grayscale.histogram()
        
        # 平均明度を計算
        total_pixels = sum(histogram)
        weighted_sum = sum(i * count for i, count in enumerate(histogram))
        avg_brightness = weighted_sum / total_pixels / 255.0
        
        # 明度に基づく調整値を決定
        if gentle_mode:
            # 画質優先モード - 極めて控えめな処理
            brightness_adj = 1.01
            contrast_adj = 1.01
            saturation_adj = 1.01
            sharpness_adj = 1.0
        else:
            # 標準モード - より控えめに調整された値
            if avg_brightness < 0.3:
                # 暗い画像
                brightness_adj = 1.15
                contrast_adj = 1.05
                saturation_adj = 1.05
            elif avg_brightness > 0.7:
                # 明るい画像
                brightness_adj = 0.95
                contrast_adj = 1.02
                saturation_adj = 1.05
            else:
                # 適度な明度
                brightness_adj = 1.02
                contrast_adj = 1.05
                saturation_adj = 1.05
            sharpness_adj = 1.02
        
        # 料理写真向けの補正を適用
        enhanced_image, description = enhance_image_traditional(
            image,
            brightness=brightness_adj,
            contrast=contrast_adj,
            saturation=saturation_adj,
            sharpness=sharpness_adj,
            auto_enhance=not gentle_mode  # 画質優先モードでは自動補正を無効化
        )
        
        # 暖色系の色調を強調（料理を美味しそうに見せる）
        warmth_factor = 1.01 if gentle_mode else 1.03
        enhanced_image = adjust_color_temperature(enhanced_image, warmth=warmth_factor)
        
        final_description = f"料理写真自動補正完了: {description}, 暖色調強調"
        logger.info(final_description)
        
        return enhanced_image, final_description
        
    except Exception as e:
        logger.error(f"料理写真自動補正エラー: {e}")
        return image, f"料理写真自動補正エラー: {str(e)}"

def adjust_color_temperature(image: Image.Image, warmth: float = 1.0) -> Image.Image:
    """
    色温度を調整（暖色・寒色の調整）
    
    Args:
        image: 処理する画像
        warmth: 暖色度 (0.5=寒色, 1.0=元のまま, 1.5=暖色)
        
    Returns:
        色温度調整された画像
    """
    try:
        if warmth == 1.0:
            return image
        
        # RGBチャンネルを分離
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        r, g, b = image.split()
        
        # 暖色調整（赤みを強調、青みを抑制）
        if warmth > 1.0:
            # 赤チャンネルを強調
            r_enhancer = ImageEnhance.Brightness(r)
            r = r_enhancer.enhance(min(warmth, 1.3))
            
            # 青チャンネルを抑制
            b_enhancer = ImageEnhance.Brightness(b)
            b = b_enhancer.enhance(max(2.0 - warmth, 0.8))
        
        # 寒色調整（青みを強調、赤みを抑制）
        elif warmth < 1.0:
            # 青チャンネルを強調
            b_enhancer = ImageEnhance.Brightness(b)
            b = b_enhancer.enhance(min(2.0 - warmth, 1.3))
            
            # 赤チャンネルを抑制
            r_enhancer = ImageEnhance.Brightness(r)
            r = r_enhancer.enhance(max(warmth, 0.8))
        
        # チャンネルを再結合
        adjusted_image = Image.merge('RGB', (r, g, b))
        return adjusted_image
        
    except Exception as e:
        logger.error(f"色温度調整エラー: {e}")
        return image

# グローバルプロセッサインスタンス
_processor_instance = None

def get_image_processor() -> ImageProcessor:
    """画像プロセッサのシングルトンインスタンスを取得"""
    global _processor_instance
    if _processor_instance is None:
        _processor_instance = ImageProcessor()
    return _processor_instance 