import streamlit as st
from streamlit_option_menu import option_menu
from processor.image_edit import apply_composition_correction
from PIL import Image
import io
import uuid

def render_layout():
    st.markdown('<div class="app-background">', unsafe_allow_html=True)

    st.markdown("""
        <style>
            .app-background {
                background-color: #fef8f5;
                padding: 1.5rem;
                border-radius: 2xl;
            }
            .section-card {
                background-color: white;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                border-radius: 1rem;
                box-shadow: 0px 4px 10px rgba(0,0,0,0.1);
            }
            .stDownloadButton > button {
                background-color: #ff8a65;
                color: white;
                border: none;
                border-radius: 0.5rem;
                padding: 0.5rem 1rem;
            }
        </style>
    """, unsafe_allow_html=True)

    st.markdown('<div class="section-card">', unsafe_allow_html=True)
    st.markdown("### 📸 InstaDish | インスタ映え画像補正")
    uploaded_files = st.file_uploader("", type=["jpg", "jpeg", "png"], accept_multiple_files=True, label_visibility="collapsed")
    st.markdown('</div>', unsafe_allow_html=True)

    if uploaded_files:
        for file in uploaded_files:
            image_bytes = file.read()
            corrected_image, msg = apply_composition_correction(image_bytes)

            st.markdown('<div class="section-card">', unsafe_allow_html=True)
            st.image(corrected_image, caption=msg or "構図補正後の画像", use_container_width=True)

            img_bytes = io.BytesIO()
            corrected_image.save(img_bytes, format="JPEG")
            st.download_button(
                label=f"📥 加工画像をダウンロード（{file.name}）",
                data=img_bytes.getvalue(),
                file_name=f"processed_{file.name}",
                mime="image/jpeg",
                key=str(uuid.uuid4())
            )
            st.markdown('</div>', unsafe_allow_html=True)

    st.markdown('</div>', unsafe_allow_html=True)
