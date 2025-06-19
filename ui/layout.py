import streamlit as st
from processor.image_edit import apply_composition_correction

def show_layout():
    st.title("📸 InstaDish | インスタ映え画像補正")

    uploaded_files = st.file_uploader("画像をアップロード", type=["jpg", "jpeg", "png"], accept_multiple_files=True)

    if uploaded_files:
        for file in uploaded_files:
            image_bytes = file.read()
            corrected_image, _ = apply_composition_correction(image_bytes)
            st.image(corrected_image, caption="構図補正後の画像", use_container_width=True)