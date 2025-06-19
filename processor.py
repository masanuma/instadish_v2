
import streamlit as st
from PIL import Image, ImageEnhance
import io

def enhance_image(image):
    image = ImageEnhance.Brightness(image).enhance(1.1)
    image = ImageEnhance.Contrast(image).enhance(1.2)
    image = ImageEnhance.Sharpness(image).enhance(1.3)
    return image

def process_uploaded_images(uploaded_files):
    for file in uploaded_files:
        img = Image.open(file).convert("RGB")
        st.image(img, caption="元画像", use_column_width=True)

        processed = enhance_image(img)
        st.image(processed, caption="加工済み画像", use_column_width=True)

        img_bytes = io.BytesIO()
        processed.save(img_bytes, format="JPEG")

        st.download_button(
            label=f"{file.name} をダウンロード",
            data=img_bytes.getvalue(),
            file_name=f"processed_{file.name}",
            mime="image/jpeg",
        )
