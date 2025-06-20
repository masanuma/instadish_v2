"""
OpenAI APIクライアントの設定と管理
"""

import os
import logging
from typing import Optional, Dict, Any
from openai import OpenAI
from dotenv import load_dotenv

# 環境変数を読み込み
load_dotenv()

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OpenAIClient:
    """OpenAI APIクライアントのラッパークラス"""
    
    def __init__(self):
        """OpenAI APIクライアントを初期化"""
        self.api_key = os.getenv('OPENAI_API_KEY')
        if not self.api_key or self.api_key == 'your_openai_api_key_here':
            raise ValueError("OpenAI APIキーが設定されていません。.envファイルでOPENAI_API_KEYを設定してください。")
        
        try:
            self.client = OpenAI(api_key=self.api_key)
            logger.info("OpenAI APIクライアントが正常に初期化されました")
        except Exception as e:
            logger.error(f"OpenAI APIクライアントの初期化に失敗しました: {e}")
            raise
    
    def test_connection(self) -> bool:
        """API接続をテスト"""
        try:
            # モデル一覧を取得してAPI接続をテスト
            models = self.client.models.list()
            logger.info("OpenAI API接続テスト成功")
            return True
        except Exception as e:
            logger.error(f"OpenAI API接続テスト失敗: {e}")
            return False
    
    def generate_enhanced_image(self, prompt: str, **kwargs) -> Optional[str]:
        """
        DALL-E 3を使用して新しい画像を生成（編集の代替）
        
        Args:
            prompt: 画像生成のプロンプト
            **kwargs: その他のパラメータ
            
        Returns:
            生成された画像URL、エラーの場合はNone
        """
        try:
            params = {
                "model": "dall-e-3",
                "prompt": prompt,
                "response_format": "url",
                "size": "1024x1024",
                "quality": "standard",
                "style": "vivid",
                "n": 1
            }
            
            logger.info(f"DALL-E 3で画像生成中... プロンプト: {prompt[:100]}...")
            response = self.client.images.generate(**params)
            
            if response.data and len(response.data) > 0:
                image_url = response.data[0].url
                revised_prompt = response.data[0].revised_prompt
                logger.info("画像生成が成功しました")
                logger.info(f"修正されたプロンプト: {revised_prompt}")
                return image_url
            else:
                logger.error("画像生成のレスポンスが空です")
                return None
                
        except Exception as e:
            logger.error(f"画像生成エラー: {e}")
            # クォータエラーの特別処理
            if "insufficient_quota" in str(e):
                logger.error("OpenAI APIクレジットが不足しています。https://platform.openai.com/account/billing でクレジットを購入してください。")
            return None
    
    def edit_image(self, image_file, mask_file, prompt: str, **kwargs) -> Optional[str]:
        """
        画像編集APIを呼び出し（DALL-E 2の問題により、DALL-E 3生成に代替）
        
        Args:
            image_file: 元画像ファイル（参考用）
            mask_file: マスク画像ファイル（未使用）
            prompt: 編集指示のプロンプト
            **kwargs: その他のパラメータ
            
        Returns:
            生成された画像URL、エラーの場合はNone
        """
        logger.warning("DALL-E 2の画像編集に問題があるため、DALL-E 3での新規生成に切り替えます")
        
        # 元の画像を参考にした新しいプロンプトを生成
        enhanced_prompt = f"Create a professional food photograph with the following style: {prompt}. Make it Instagram-worthy with perfect lighting, composition, and color balance."
        
        return self.generate_enhanced_image(enhanced_prompt, **kwargs)
    
    def analyze_image(self, image_file, prompt: str = "この画像について詳しく説明してください") -> Optional[str]:
        """
        Vision APIを使用して画像を分析
        
        Args:
            image_file: 分析する画像ファイル
            prompt: 分析指示のプロンプト
            
        Returns:
            分析結果のテキスト、エラーの場合はNone
        """
        try:
            # 画像をbase64エンコード
            import base64
            import io
            
            if hasattr(image_file, 'read'):
                image_data = image_file.read()
            else:
                image_data = image_file
                
            base64_image = base64.b64encode(image_data).decode('utf-8')
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500
            )
            
            if response.choices and len(response.choices) > 0:
                analysis = response.choices[0].message.content
                logger.info("画像分析が成功しました")
                return analysis
            else:
                logger.error("画像分析のレスポンスが空です")
                return None
                
        except Exception as e:
            logger.error(f"画像分析エラー: {e}")
            return None
    
    def get_usage_info(self) -> Dict[str, Any]:
        """API使用量情報を取得（実装予定）"""
        # OpenAI APIの使用量取得は別途実装が必要
        return {
            "status": "実装予定",
            "message": "API使用量の監視機能は今後実装予定です"
        }

# グローバルクライアントインスタンス
_client_instance = None

def get_openai_client() -> OpenAIClient:
    """OpenAIクライアントのシングルトンインスタンスを取得"""
    global _client_instance
    if _client_instance is None:
        _client_instance = OpenAIClient()
    return _client_instance 