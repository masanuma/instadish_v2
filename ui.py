
import streamlit as st
from PIL import Image
import io
import uuid

def render_ui(process_images_callback):
    with open("theme.css") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

    st.markdown("### 📸 InstaDish | 写真加工デモ版")
    st.caption("飲食店向けInstagram投稿支援ツール（UI分離構成）")

    st.markdown("### 1. 写真をアップロード")
    uploaded_files = st.file_uploader("画像を選択（複数可）", type=["jpg", "jpeg", "png"], accept_multiple_files=True)

    st.markdown("### 2. 業態・ターゲットを選択")
    col1, col2 = st.columns(2)
    with col1:
        business_type = st.selectbox("", ["和食", "洋食", "カフェ", "バー", "中華"])
    with col2:
        audience_type = st.selectbox("", ["インスタ好き", "観光客", "ビジネスマン"])

    if uploaded_files and st.button("画像を加工"):
        results = process_images_callback(uploaded_files)
        for name, img in results:
            st.image(img, caption=f"加工済み画像: {name}", use_column_width=True)
