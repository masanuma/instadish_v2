
import streamlit as st

def inject_local_css(file_name):
    with open(file_name) as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

def render_ui():
    inject_local_css("theme.css")

    st.markdown(
        "<h1>📸 InstaDish | 写真加工デモ版</h1><p>飲食店向けInstagram投稿支援ツール（UI分離構成）</p>",
        unsafe_allow_html=True,
    )

    st.markdown("## 1. 写真をアップロード")
    uploaded_files = st.file_uploader("画像を選択（複数可）", type=["jpg", "jpeg", "png"], accept_multiple_files=True)

    st.markdown("## 2. 業態・ターゲットを選択")
    col1, col2 = st.columns(2)
    with col1:
        business_type = st.selectbox("業態", ["和食", "洋食", "カフェ", "バー"])
    with col2:
        target_group = st.selectbox("ターゲット層", ["インスタ好き", "観光客", "地元常連"])

    if uploaded_files and st.button("画像を加工"):
        process_uploaded_images(uploaded_files)
