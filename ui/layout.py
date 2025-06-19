
import streamlit as st
from processor.image_edit import apply_composition_correction
import io
import uuid

def show_layout():
    st.markdown('<div class="app-container">', unsafe_allow_html=True)

    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.markdown("### 📸 InstaDish | インスタ映え画像補正")
    uploaded_files = st.file_uploader("", type=["jpg", "jpeg", "png"], accept_multiple_files=True)
    st.markdown('</div>', unsafe_allow_html=True)

    if uploaded_files:
        for file in uploaded_files:
            image_bytes = file.read()
            corrected_image, info = apply_composition_correction(image_bytes)

            st.markdown('<div class="card">', unsafe_allow_html=True)
            st.image(corrected_image, caption="構図補正後の画像", use_container_width=True)
            st.markdown(f"<p style='color: gray'>{info}</p>", unsafe_allow_html=True)

            img_bytes = io.BytesIO()
            corrected_image.save(img_bytes, format="JPEG")
            st.download_button(
                label="📥 加工画像をダウンロード",
                data=img_bytes.getvalue(),
                file_name=f"instadish_processed_{uuid.uuid4().hex[:8]}.jpg",
                mime="image/jpeg",
                key=str(uuid.uuid4())
            )
            st.markdown('</div>', unsafe_allow_html=True)

    st.markdown('</div>', unsafe_allow_html=True)
