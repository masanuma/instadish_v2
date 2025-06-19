
import streamlit as st
from ui import render_ui
from processor import process_uploaded_images

st.set_page_config(page_title="InstaDish | 写真加工デモ版", layout="centered")
render_ui()
