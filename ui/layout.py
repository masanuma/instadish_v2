import streamlit as st
from PIL import Image, ImageEnhance
import io
import uuid
from processor.image_edit import apply_composition_correction, apply_color_enhancement


def show_layout():
    st.markdown("""
        <h1 style='font-size:2.2em'>📸 InstaDish | 写真加工デモ版</h1>
        <p style='color: gray;'>飲食店向けInstagram投稿支援ツール（UI分離構成）</p>
    """, unsafe_allow_html=True)

    uploaded_files = st.file_uploader("画像をアップロード", type=["jpg", "jpeg", "png"], accept_multiple_files=True)

    col1, col2 = st.columns(2)
    with col1:
        genre = st.selectbox("", ["カフェ", "バー", "和食", "洋食"], index=0, label_visibility="collapsed")
    with col2:
        target = st.selectbox("", ["インスタ好き", "観光客", "ファミリー"], index=0, label_visibility="collapsed")

    if st.button("画像を加工") and uploaded_files:
        for file in uploaded_files:
            st.subheader(f"📷 加工結果: {file.name}")
            image = Image.open(file).convert("RGB")

            # 構図補正
            corrected_image, composition_info = apply_composition_correction(image)
            st.image(corrected_image, caption="構図補正済み", use_container_width=True)
            st.info("🖼 構図補正の内容:\n" + composition_info)

            # 色味補正
            color_enhanced = apply_color_enhancement(corrected_image)
            st.image(color_enhanced, caption="色味補正済み", use_container_width=True)
            st.info("🎨 色味補正の内容:\n全体の明るさとコントラストを分析し、視認性と鮮やかさを高めるために明るさを20%、コントラストを30%、シャープネスを2倍に調整しました。\nこれにより、Instagramで映える印象的な仕上がりになっています。")

            # ダウンロード
            img_bytes = io.BytesIO()
            color_enhanced.save(img_bytes, format="JPEG")
            st.download_button(
                label=f"📥 加工画像をダウンロード（{file.name}）",
                data=img_bytes.getvalue(),
                file_name=f"processed_{file.name}",
                mime="image/jpeg",
                key=str(uuid.uuid4())
            )
