import streamlit as st
import requests
from PIL import Image
import io


def show_layout():
    st.title("\U0001F4F8 InstaDish | インスタ映え画像補正")
    
    # モバイル対応のサイドバー設定
    with st.sidebar:
        st.header("📋 加工設定")
        
        # 業種選択（モバイル対応）
        business_type = st.selectbox(
            "🏪 飲食店の業種",
            [
                "居酒屋",
                "バー・パブ",
                "カフェ",
                "レストラン",
                "ラーメン店",
                "寿司店",
                "焼肉店",
                "イタリアン",
                "フレンチ",
                "中華料理",
                "その他"
            ],
            help="お店の業種を選択してください"
        )
        
        # ターゲット層選択（モバイル対応）
        target_audience = st.selectbox(
            "👥 ターゲット層",
            [
                "OL・女性会社員",
                "男性会社員",
                "学生",
                "シニア",
                "カップル",
                "家族",
                "友人グループ",
                "その他"
            ],
            help="主なターゲット層を選択してください"
        )
        
        # 加工スタイルの詳細設定（モバイル対応）
        st.subheader("🎨 加工スタイル")
        
        # スライダーをモバイルに最適化
        col1, col2 = st.columns(2)
        with col1:
            brightness = st.slider("明度", -50, 50, 0, help="画像の明るさを調整")
        with col2:
            saturation = st.slider("彩度", -50, 50, 0, help="色の鮮やかさを調整")
        
        contrast = st.slider("コントラスト", -50, 50, 0, help="明暗の差を調整")
        
        # 加工実行ボタン（モバイル対応）
        process_button = st.button("🚀 画像を加工する", type="primary", use_container_width=True)
        
        # ヘルプ情報
        with st.expander("💡 使い方"):
            st.markdown("""
            1. **業種とターゲット層を選択**
            2. **画像をアップロード**（複数選択可能）
            3. **加工スタイルを調整**（必要に応じて）
            4. **「画像を加工する」ボタンを押す**
            
            📱 **モバイル対応**: スマホでも快適に使用できます
            """)

    # メインコンテンツ（モバイル対応）
    with st.container():
        # ファイルアップローダー（モバイル対応）
        uploaded_files = st.file_uploader(
            "📸 画像をアップロードしてください",  
            type=["jpg", "jpeg", "png"],
            accept_multiple_files=True,
            help="複数の画像を選択できます（JPG、PNG形式）"
        )

        if uploaded_files and process_button:
            # 処理状況の表示
            st.subheader(f"🏪 {business_type} | 👥 {target_audience} 向け加工")
            
            # プログレスバー
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            # 画像処理
            for i, file in enumerate(uploaded_files):
                status_text.text(f"画像 {i+1}/{len(uploaded_files)} を処理中...")
                
                image_bytes = file.read()
                
                # 元画像を表示（モバイル対応）
                st.subheader(f"📷 元画像: {file.name}")
                original_image = Image.open(io.BytesIO(image_bytes))
                st.image(original_image, caption="元画像", use_container_width=True)

                with st.spinner(f"AIが画像を解析・補正中です…（{business_type}向け）"):
                    result = call_external_ai_api(
                        image_bytes, 
                        business_type, 
                        target_audience,
                        brightness,
                        saturation,
                        contrast
                    )

                if result:
                    corrected_image = result.get("processed_image")
                    explanation = result.get("explanation", "")

                    if corrected_image:
                        image_data = io.BytesIO(corrected_image)
                        image = Image.open(image_data)
                        st.image(image, caption="AI加工後の画像", use_container_width=True)

                    if explanation:
                        st.markdown(f"### 加工内容の説明")
                        st.markdown(explanation)
                        
                        # 加工設定の詳細表示（モバイル対応）
                        st.markdown("#### 適用された設定")
                        
                        # モバイルでは縦並び、デスクトップでは横並び
                        if st.session_state.get('is_mobile', False):
                            st.metric("明度", f"{brightness:+d}")
                            st.metric("彩度", f"{saturation:+d}")
                            st.metric("コントラスト", f"{contrast:+d}")
                        else:
                            col1, col2, col3 = st.columns(3)
                            with col1:
                                st.metric("明度", f"{brightness:+d}")
                            with col2:
                                st.metric("彩度", f"{saturation:+d}")
                            with col3:
                                st.metric("コントラスト", f"{contrast:+d}")
                else:
                    st.error("画像の加工に失敗しました。もう一度お試しください。")
                
                # プログレスバー更新
                progress_bar.progress((i + 1) / len(uploaded_files))
                
                # 区切り線
                if i < len(uploaded_files) - 1:
                    st.divider()
            
            status_text.text("✅ 全ての画像の処理が完了しました！")
            
            # ダウンロードボタン（将来的な機能）
            st.info("💡 将来的には加工後の画像をダウンロードする機能も追加予定です")
            
        elif uploaded_files:
            st.info("👆 サイドバーの「画像を加工する」ボタンを押して加工を開始してください")
            
            # アップロードされた画像のプレビュー（モバイル対応）
            st.subheader("📸 アップロードされた画像")
            
            # モバイルでは1列、デスクトップでは3列
            num_cols = 1 if st.session_state.get('is_mobile', False) else min(3, len(uploaded_files))
            cols = st.columns(num_cols)
            
            for i, file in enumerate(uploaded_files):
                col_idx = i % num_cols
                with cols[col_idx]:
                    image_bytes = file.read()
                    image = Image.open(io.BytesIO(image_bytes))
                    st.image(image, caption=file.name, use_container_width=True)
                    
                    # ファイル情報
                    file_size = len(image_bytes) / 1024  # KB
                    st.caption(f"サイズ: {file_size:.1f} KB")
        
        else:
            # 初期画面（モバイル対応）
            st.markdown("""
            ### 📱 モバイル対応の画像加工アプリ
            
            **InstaDish**は、スマートフォンでも快適に使用できる画像加工アプリです。
            
            #### 🚀 主な機能:
            - 📸 **複数画像の一括アップロード**
            - 🏪 **業種別の最適化加工**
            - 👥 **ターゲット層別のスタイル調整**
            - 🎨 **手動での細かい調整**
            - 📱 **モバイルファーストデザイン**
            
            #### 💡 使い方:
            1. サイドバーで業種とターゲット層を選択
            2. 画像をアップロード
            3. 必要に応じて加工スタイルを調整
            4. 「画像を加工する」ボタンを押す
            
            > **PWA対応**: ホーム画面に追加して、ネイティブアプリのように使用できます
            """)
            
            # サンプル画像の表示（将来的な機能）
            st.info("💡 将来的にはサンプル画像での加工デモ機能も追加予定です")


def call_external_ai_api(image_bytes, business_type, target_audience, brightness, saturation, contrast):
    try:
        # 加工パラメータを設定
        processing_params = {
            "business_type": business_type,
            "target_audience": target_audience,
            "brightness": brightness,
            "saturation": saturation,
            "contrast": contrast
        }
        
        # 業種とターゲット層に基づく加工スタイルの自動調整
        style_adjustments = get_style_adjustments(business_type, target_audience)
        processing_params.update(style_adjustments)
        
        response = requests.post(
            "https://your-api-endpoint.com/process-image",
            files={"file": ("image.jpg", image_bytes, "image/jpeg")},
            data=processing_params
        )
        if response.status_code == 200:
            result = response.json()
            processed_image = requests.get(result["image_url"]).content
            return {
                "processed_image": processed_image,
                "explanation": result.get("explanation", "")
            }
    except Exception as e:
        print("API呼び出しエラー:", e)
        # デモ用のダミーレスポンス（実際のAPIが設定されるまで）
        return create_demo_response(business_type, target_audience, brightness, saturation, contrast)
    return None


def get_style_adjustments(business_type, target_audience):
    """業種とターゲット層に基づく自動スタイル調整"""
    adjustments = {}
    
    # 業種別の調整
    if business_type == "居酒屋":
        adjustments.update({"warm_tone": True, "vintage_filter": True})
    elif business_type == "バー・パブ":
        adjustments.update({"dark_mood": True, "dramatic_lighting": True})
    elif business_type == "カフェ":
        adjustments.update({"bright_clean": True, "soft_lighting": True})
    elif business_type == "レストラン":
        adjustments.update({"elegant": True, "professional": True})
    elif business_type == "ラーメン店":
        adjustments.update({"warm_tone": True, "appetizing": True})
    elif business_type == "寿司店":
        adjustments.update({"fresh_vibrant": True, "minimalist": True})
    
    # ターゲット層別の調整
    if target_audience == "OL・女性会社員":
        adjustments.update({"instagram_ready": True, "trendy": True})
    elif target_audience == "男性会社員":
        adjustments.update({"professional": True, "clean": True})
    elif target_audience == "学生":
        adjustments.update({"vibrant": True, "fun": True})
    elif target_audience == "シニア":
        adjustments.update({"clear": True, "easy_to_read": True})
    elif target_audience == "カップル":
        adjustments.update({"romantic": True, "warm": True})
    elif target_audience == "家族":
        adjustments.update({"friendly": True, "welcoming": True})
    
    return adjustments


def create_demo_response(business_type, target_audience, brightness, saturation, contrast):
    """デモ用のレスポンス（実際のAPIが設定されるまで）"""
    explanation = f"""
### 🎨 適用された加工内容

**🏪 業種設定**: {business_type}
**👥 ターゲット層**: {target_audience}

#### 自動調整されたスタイル:
- **明度**: {brightness:+d}
- **彩度**: {saturation:+d}  
- **コントラスト**: {contrast:+d}

#### 業種・ターゲット層に基づく最適化:
{get_style_explanation(business_type, target_audience)}

> 💡 **注意**: 現在はデモモードです。実際の画像加工を行うには、外部AI APIの設定が必要です。
    """
    
    return {
        "processed_image": None,  # 実際のAPIが設定されるまで
        "explanation": explanation
    }


def get_style_explanation(business_type, target_audience):
    """スタイル説明の生成"""
    explanations = {
        "居酒屋": "温かみのある色調とレトロな雰囲気で、親しみやすさを演出",
        "バー・パブ": "暗めのムードとドラマチックな照明で、大人の雰囲気を演出",
        "カフェ": "明るく清潔感のある色調で、リラックスできる空間を演出",
        "レストラン": "洗練された色調とプロフェッショナルな仕上がりで、高級感を演出",
        "ラーメン店": "温かみのある色調で、食欲をそそる美味しさを演出",
        "寿司店": "鮮やかで清潔感のある色調で、新鮮さと上品さを演出"
    }
    
    audience_explanations = {
        "OL・女性会社員": "Instagram投稿に最適なトレンド感のある加工",
        "男性会社員": "ビジネスライクで清潔感のある仕上がり",
        "学生": "若々しく活気のある色調で、楽しさを演出",
        "シニア": "見やすく分かりやすい色調とコントラスト",
        "カップル": "ロマンティックで温かみのある色調",
        "家族": "親しみやすく温かい雰囲気の色調"
    }
    
    business_exp = explanations.get(business_type, "標準的な飲食店向けの色調調整")
    audience_exp = audience_explanations.get(target_audience, "一般的なターゲット向けの調整")
    
    return f"- **{business_type}**: {business_exp}\n- **{target_audience}**: {audience_exp}"
