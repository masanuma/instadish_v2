import streamlit as st
from ui import build_layout

def apply_css():
    with open("theme.css", "r", encoding="utf-8") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

st.set_page_config(page_title="InstaDish | 写真加工デモ", layout="centered")
apply_css()
build_layout()
