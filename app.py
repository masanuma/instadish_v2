
import streamlit as st
from ui import render_ui
from processor import process_images

st.set_page_config(page_title="InstaDish | 写真加工デモ版", layout="centered")

def main():
    render_ui(process_images)

if __name__ == "__main__":
    main()
