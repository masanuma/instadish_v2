
import streamlit as st
from PIL import Image, ImageEnhance
import io
import uuid
from processor import process_image

st.set_page_config(page_title="インスタディッシュ｜写真加工＋AIハッシュタグ提案", layout="centered")

# lang="ja" を <html> に挿入するJS
st.markdown(
    "<script>document.addEventListener('DOMContentLoaded', function() {document.documentElement.setAttribute('lang', 'ja');});</script>",
    unsafe_allow_html=True,
)

st.markdown("## InstaDish 🍽️｜写真加工デモ（スマホ対応）")

uploaded_files = st.file_uploader("画像を選んでください", type=["jpg", "jpeg", "png"], accept_multiple_files=True, label_visibility="collapsed")

if uploaded_files:
    for file in uploaded_files:
        img = Image.open(file).convert("RGB")
        st.image(img, caption=f"元の画像: {file.name}", use_container_width=True)

        processed = process_image(img)
        st.image(processed, caption="加工済み画像", use_container_width=True)

        img_bytes = io.BytesIO()
        processed.save(img_bytes, format="JPEG")

        st.download_button(
            label=f"📥 加工画像をダウンロード（{file.name}）",
            data=img_bytes.getvalue(),
            file_name=f"processed_{file.name}",
            mime="image/jpeg",
            key=str(uuid.uuid4())
        )
