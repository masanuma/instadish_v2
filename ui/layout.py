import streamlit as st
from processor.image_edit import apply_composition_correction

def show_layout():
    st.markdown('<h1>📸 InstaDish | 写真加工デモ版</h1>', unsafe_allow_html=True)
    st.caption("飲食店向けInstagram投稿支援ツール（UI分離構成）")

    st.markdown("### 1. 写真をアップロード")
    uploaded_files = st.file_uploader("画像を選択（複数可）", type=["jpg", "jpeg", "png"], accept_multiple_files=True)

    st.markdown("### 2. 業態・ターゲットを選択")
    col1, col2 = st.columns(2)
    with col1:
        business_type = st.selectbox("業態", ["和食", "洋食", "中華", "居酒屋", "バー", "エスニック", "カフェ"])
    with col2:
        target_audience = st.selectbox("ターゲット層", ["インスタ好き", "外国人観光客", "会社員", "シニア", "OL"])

    if uploaded_files and st.button("画像を加工"):
        for file in uploaded_files:
            image_bytes = file.read()
            corrected_image, _ = apply_composition_correction(image_bytes)
            st.image(corrected_image, caption="構図補正後の画像", use_container_width=True)
