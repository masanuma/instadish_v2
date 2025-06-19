
import streamlit as st
from PIL import Image
from processor import auto_crop_and_rotate
import io
import uuid

st.set_page_config(page_title="InstaDish | 構図補正デモ", layout="centered")
st.title("📸 InstaDish | 構図補正デモ版")

st.markdown("画像をアップロードすると、構図補正（回転・トリミング）を自動的に行います。")

uploaded_files = st.file_uploader("画像をアップロード", type=["jpg", "jpeg", "png"], accept_multiple_files=True)

if uploaded_files:
    for uploaded_file in uploaded_files:
        img = Image.open(uploaded_file).convert("RGB")
        st.image(img, caption=f"元の画像: {uploaded_file.name}", use_container_width=True)

        corrected_img, message = auto_crop_and_rotate(img)
        st.image(corrected_img, caption="📸 構図補正後の画像", use_container_width=True)
        st.success(message)

        img_bytes = io.BytesIO()
        corrected_img.save(img_bytes, format="JPEG")

        st.download_button(
            label=f"📥 加工画像をダウンロード（{uploaded_file.name}）",
            data=img_bytes.getvalue(),
            file_name=f"corrected_{uploaded_file.name}",
            mime="image/jpeg",
            key=str(uuid.uuid4())
        )
