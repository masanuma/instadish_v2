
import streamlit as st
from ui import render_main_ui

# ページ設定
st.set_page_config(page_title="InstaDish | 写真加工デモ版", layout="centered")

# カスタムCSS適用
with open("theme.css") as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

# UIレンダリング
render_main_ui()
