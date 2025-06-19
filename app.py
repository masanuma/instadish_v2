import streamlit as st
from ui import load_custom_css

st.set_page_config(page_title="InstaDish | 写真加工デモ版", layout="centered")
load_custom_css()

st.markdown("## 📸 InstaDish | 写真加工デモ版")
st.caption("飲食店向けInstagram投稿支援ツール（UI分離構成）")

st.markdown("### 1. 写真をアップロード")
st.markdown("画像を選択（複数可）")
st.file_uploader("画像をアップロード", type=["jpg", "jpeg", "png"], accept_multiple_files=True)

st.markdown("### 2. 業態・ターゲットを選択")
col1, col2 = st.columns(2)
with col1:
    st.selectbox("業態", ["和食", "洋食", "カフェ", "バー"])
with col2:
    st.selectbox("ターゲット層", ["インスタ好き", "外国人観光客", "会社員", "シニア", "OL"])

st.button("画像を加工")