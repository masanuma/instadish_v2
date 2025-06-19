import streamlit as st
from PIL import Image
import io
import uuid
from processor import process_image  # auto_crop_and_rotate は不要

st.set_page_config(page_title="InstaDish | 写真加工デモ", layout="centered")
st.title("📸 InstaDish | 写真加工デモ版")

st.markdown("写真をアップロードすると、AIが自動で構図補正（トリミング・回転など）を行います。")

uploaded_files = st.file_uploader(
    "画像を選択（複数可）", type=["jpg", "jpeg", "png"], accept_multiple_files=True
)

if uploaded_files:
    for file in uploaded_files:
        img = Image.open(file).convert("RGB")
        st.image(img, caption=f"元の画像: {file.name}", use_container_width=True)

        processed_img, message = process_image(img)

        st.image(processed_img, caption="📸 加工済み画像", use_container_width=True)
        st.markdown(f"📝 **加工内容:** {message}")

        img_bytes = io.BytesIO()
        processed_img.save(img_bytes, format="JPEG")

        st.download_button(
            label=f"📥 加工画像をダウンロード（{file.name}）",
            data=img_bytes.getvalue(),
            file_name=f"processed_{file.name}",
            mime="image/jpeg",
            key=str(uuid.uuid4())
        )
