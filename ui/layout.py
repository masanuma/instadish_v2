import streamlit as st
import requests
from PIL import Image
import io


def show_layout():
    st.title("\U0001F4F8 InstaDish | インスタ映え画像補正")
    
    # モバイル対応のサイドバー設定
    with st.sidebar:
        st.header("📋 加工設定")
        
        # AI処理の設定
        st.subheader("🤖 AI処理設定")
        use_ai = st.checkbox(
            "AI画像処理を使用", 
            value=True, 
            help="OpenAI APIを使用した高品質なAI画像処理"
        )
        
        if use_ai:
            # OpenAI APIキーの設定状況を確認
            try:
                from processor.openai_client import get_openai_client
                client = get_openai_client()
                st.success("✅ OpenAI API設定済み")
            except ValueError as e:
                st.error("❌ OpenAI APIキーが未設定です")
                st.info("""
                **AI処理を使用するには:**
                1. OpenAI APIキーを取得してください
                2. プロジェクトフォルダに`.env`ファイルを作成
                3. `OPENAI_API_KEY=your_key_here`を追加
                """)
                use_ai = False
            except Exception as e:
                st.warning(f"⚠️ API接続エラー: {str(e)}")
                use_ai = False
        
        if not use_ai:
            st.info("🔄 従来の画像処理技術を使用します")
        
        st.divider()
        
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
            
            # 加工結果を保存するためのリスト
            processed_results = []
            
            # 画像処理
            for i, file in enumerate(uploaded_files):
                status_text.text(f"画像 {i+1}/{len(uploaded_files)} を処理中...")
                
                image_bytes = file.read()
                
                # 元画像を表示（モバイル対応）
                st.subheader(f"📷 元画像: {file.name}")
                original_image = Image.open(io.BytesIO(image_bytes))
                st.image(original_image, caption="元画像", use_container_width=True)

                # 処理方法に応じてメッセージを変更
                if use_ai:
                    spinner_message = f"🤖 AIが画像を色調補正中です…（{business_type}向け・形状変更なし）"
                else:
                    spinner_message = f"🎨 従来技術で画像を補正中です…（{business_type}向け）"
                
                with st.spinner(spinner_message):
                    if use_ai:
                        result = call_external_ai_api(
                            image_bytes, 
                            business_type, 
                            target_audience,
                            brightness,
                            saturation,
                            contrast
                        )
                    else:
                        result = call_traditional_processing_fallback(
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
                        
                        # 加工結果を保存（日時を含むファイル名）
                        from datetime import datetime
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        base_name = file.name.split('.')[0]
                        download_filename = f"instadish_{base_name}_{timestamp}.png"
                        processed_results.append({
                            'filename': download_filename,
                            'data': corrected_image,
                            'original_name': file.name
                        })
                        
                        # ダウンロードボタンを追加
                        st.download_button(
                            label=f"💾 {file.name} をダウンロード",
                            data=corrected_image,
                            file_name=download_filename,
                            mime="image/png",
                            use_container_width=True,
                            type="secondary"
                        )

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
            
            # 全体のダウンロードオプション表示
            if processed_results:
                st.divider()
                st.subheader("📥 ダウンロードオプション")
                
                # 統計情報の表示
                success_count = len(processed_results)
                total_count = len(uploaded_files)
                
                col1, col2 = st.columns(2)
                with col1:
                    st.metric("処理成功", f"{success_count}/{total_count}")
                with col2:
                    st.metric("ファイル形式", "PNG")
                
                # 一括ダウンロード用のZIPファイル作成
                if len(processed_results) > 1:
                    st.markdown("#### 📦 一括ダウンロード")
                    zip_data = create_zip_file(processed_results)
                    if zip_data:
                        st.download_button(
                            label=f"📦 全ての画像をZIPでダウンロード ({len(processed_results)}枚)",
                            data=zip_data,
                            file_name=f"instadish_processed_images_{business_type.replace('・','-')}.zip",
                            mime="application/zip",
                            use_container_width=True,
                            type="primary"
                        )
                        st.info("💡 複数の画像を一度にダウンロードできます")
            
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
    """
    OpenAI APIを使用したAI画像補正処理を実行
    色調・コントラスト・光量のみを調整（形状変更は厳禁）
    """
    try:
        # ImageProcessorを使用してAI処理を実行
        from processor.image_processor import get_image_processor
        
        processor = get_image_processor()
        
        # AI画像処理を実行
        result = processor.process_image_for_business(
            image_bytes=image_bytes,
            business_type=business_type,
            target_audience=target_audience,
            brightness=brightness,
            saturation=saturation,
            contrast=contrast
        )
        
        if result.get("success"):
            # 新しい処理方式：AI分析 + 従来技術による処理
            processed_image_bytes = result.get("processed_image")
            
            return {
                "processed_image": processed_image_bytes,
                "explanation": result.get("explanation", ""),
                "analysis": result.get("analysis", ""),
                "edit_prompt": result.get("adjustments", {})
            }
        else:
            # AI処理が失敗した場合は従来処理にフォールバック
            st.warning("⚠️ AI処理に失敗したため、従来の画像処理で補正します")
            return call_traditional_processing_fallback(
                image_bytes, business_type, target_audience, brightness, saturation, contrast
            )
        
    except Exception as e:
        print(f"AI画像処理エラー: {e}")
        st.error(f"AI画像処理中にエラーが発生しました: {str(e)}")
        # エラーの場合も従来処理にフォールバック
        return call_traditional_processing_fallback(
            image_bytes, business_type, target_audience, brightness, saturation, contrast
        )

def call_traditional_processing_fallback(image_bytes, business_type, target_audience, brightness, saturation, contrast):
    """
    従来の画像処理技術によるフォールバック処理
    AI処理が失敗した場合に使用
    """
    try:
        from processor.image_processor import enhance_image_traditional, auto_enhance_food_photo
        from PIL import Image
        import io
        
        # 画像を読み込み
        image = Image.open(io.BytesIO(image_bytes))
        
        # 調整値を正規化（-50〜50の範囲を0.5〜1.5の範囲に変換）
        brightness_factor = 1.0 + (brightness / 100.0)
        saturation_factor = 1.0 + (saturation / 100.0)
        contrast_factor = 1.0 + (contrast / 100.0)
        
        # 手動調整が指定されている場合は手動調整を適用
        if brightness != 0 or saturation != 0 or contrast != 0:
            enhanced_image, description = enhance_image_traditional(
                image=image,
                brightness=brightness_factor,
                contrast=contrast_factor,
                saturation=saturation_factor,
                sharpness=1.0,  # シャープ化は最小限に
                auto_enhance=False  # 画質優先
            )
        else:
            # 手動調整がない場合は料理写真向け自動補正を適用（画質優先モード）
            enhanced_image, description = auto_enhance_food_photo(image, gentle_mode=True)
        
        # 業種・ターゲット層に基づく追加調整
        business_adjustments = get_business_specific_adjustments(business_type, target_audience)
        if business_adjustments:
            enhanced_image = apply_business_adjustments(enhanced_image, business_adjustments)
            description += f"\n業種別調整: {business_adjustments['description']}"
        
        # 画像をバイト配列に変換
        output_buffer = io.BytesIO()
        enhanced_image.save(output_buffer, format='PNG', optimize=False)  # 品質優先
        processed_image_bytes = output_buffer.getvalue()
        
        # 詳細な説明を生成
        explanation = generate_detailed_explanation(
            business_type, target_audience, brightness, saturation, contrast, description
        )
        
        return {
            "processed_image": processed_image_bytes,
            "explanation": explanation + "\n\n🔄 **処理方式**: 従来の画像処理技術を使用",
            "analysis": f"従来処理による画像補正が完了しました。業種: {business_type}, ターゲット: {target_audience}",
            "edit_prompt": description
        }
        
    except Exception as e:
        print(f"従来処理エラー: {e}")
        return create_demo_response(business_type, target_audience, brightness, saturation, contrast)

def get_business_specific_adjustments(business_type, target_audience):
    """業種とターゲット層に基づく特別な調整を返す"""
    adjustments = {
        "warmth": 1.0,  # 色温度調整
        "description": ""
    }
    
    # 業種別調整
    if business_type in ["居酒屋", "ラーメン店", "焼肉店"]:
        adjustments["warmth"] = 1.15  # 暖色調強化
        adjustments["description"] = "暖色調を強化して食欲をそそる色合いに調整"
    elif business_type in ["バー・パブ"]:
        adjustments["warmth"] = 0.9  # 少し寒色調
        adjustments["description"] = "落ち着いた大人の雰囲気を演出する色調に調整"
    elif business_type in ["カフェ"]:
        adjustments["warmth"] = 1.05  # 軽い暖色調
        adjustments["description"] = "明るく清潔感のある色調に調整"
    elif business_type in ["寿司店", "フレンチ"]:
        adjustments["warmth"] = 1.0  # 自然な色調
        adjustments["description"] = "上品で洗練された色調を保持"
    
    return adjustments

def apply_business_adjustments(image, adjustments):
    """業種別の調整を画像に適用"""
    try:
        from processor.image_processor import adjust_color_temperature
        
        # 色温度調整
        if adjustments["warmth"] != 1.0:
            image = adjust_color_temperature(image, adjustments["warmth"])
        
        return image
    except Exception as e:
        print(f"業種別調整エラー: {e}")
        return image

def generate_detailed_explanation(business_type, target_audience, brightness, saturation, contrast, processing_description):
    """詳細な説明を生成"""
    explanation = f"""
### 🎨 画像補正が完了しました

**🏪 業種設定**: {business_type}
**👥 ターゲット層**: {target_audience}

#### 適用された調整:
- **明度**: {brightness:+d} {'(明るく調整)' if brightness > 0 else '(暗く調整)' if brightness < 0 else '(変更なし)'}
- **彩度**: {saturation:+d} {'(鮮やかに調整)' if saturation > 0 else '(落ち着いた色調に調整)' if saturation < 0 else '(変更なし)'}
- **コントラスト**: {contrast:+d} {'(コントラストを強化)' if contrast > 0 else '(コントラストを抑制)' if contrast < 0 else '(変更なし)'}

#### 処理内容:
{processing_description}

#### 業種・ターゲット層に基づく最適化:
{get_style_explanation(business_type, target_audience)}

> ✅ **実際の画像補正**: Pillow（PIL）を使用した高品質な画像処理技術により、明度・彩度・コントラストを精密に調整しました。
    """
    
    return explanation


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


def create_zip_file(processed_results):
    """
    加工された画像をZIPファイルにまとめる関数
    
    Args:
        processed_results: 処理結果のリスト
    
    Returns:
        ZIP ファイルのバイナリデータ
    """
    try:
        import zipfile
        import io
        from datetime import datetime
        
        # ZIPファイル用のバイト列バッファ
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for result in processed_results:
                # ファイル名を作成（重複を避けるため）
                filename = result['filename']
                
                # ZIPファイルに画像を追加
                zip_file.writestr(filename, result['data'])
                
                # ファイル情報を追加（txt形式）
                info_filename = filename.replace('.png', '_info.txt')
                info_content = f"""InstaDish 加工画像情報
                
元ファイル名: {result['original_name']}
加工後ファイル名: {filename}
加工日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
ファイル形式: PNG
処理方式: InstaDish AI画像処理

このファイルは InstaDish で加工された画像です。
"""
                zip_file.writestr(info_filename, info_content.encode('utf-8'))
        
        zip_buffer.seek(0)
        return zip_buffer.getvalue()
        
    except Exception as e:
        print(f"ZIP作成エラー: {e}")
        return None
