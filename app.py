
import streamlit as st
from PIL import Image
import io
import uuid
from image_utils import process_image
from model_logic import classify_image_clip, generate_caption, generate_hashtags

st.set_page_config(page_title="InstaDish V2 | 画像加工＋AI解析", layout="centered")
st.title("📸 InstaDish V2")

uploaded_files = st.file_uploader("画像をアップロード（複数可）", type=["jpg", "jpeg", "png"], accept_multiple_files=True)

if uploaded_files:
    business_type = st.selectbox("業態を選択", ["バー", "カフェ", "レストラン"])
    audience_type = st.selectbox("ターゲット層を選択", ["インスタ好き", "外国人観光客", "OL"])

    for file in uploaded_files:
        image = Image.open(file).convert("RGB")
        st.image(image, caption=f"元画像: {file.name}", use_container_width=True)

        processed = process_image(image)
        st.image(processed, caption="加工画像", use_container_width=True)

        label, confidence = classify_image_clip(image)
        st.markdown(f"**ジャンル判定**: {label}（信頼度: {confidence:.2f}）")

        caption = generate_caption(label)
        st.markdown(f"**キャプション案**: {caption}")

        hashtags = generate_hashtags(business_type, audience_type)
        st.markdown("**おすすめハッシュタグ**")
        st.code(" ".join(hashtags))

        img_bytes = io.BytesIO()
        processed.save(img_bytes, format="JPEG")
        st.download_button(
            label="📥 加工画像をダウンロード",
            data=img_bytes.getvalue(),
            file_name=f"processed_{file.name}",
            mime="image/jpeg",
            key=str(uuid.uuid4())
        )
