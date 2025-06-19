
import streamlit as st
from processor.image_edit import auto_crop_and_rotate, enhance_image
from PIL import Image
import io

def show_layout():
    st.title("📸 InstaDish | インスタ映え画像補正")
    st.markdown("業種やターゲットに応じた最適な補正をAIが行います。")

    uploaded_files = st.file_uploader("画像をアップロード", type=["jpg", "jpeg", "png"], accept_multiple_files=True)

    if uploaded_files:
        for uploaded_file in uploaded_files:
            image = Image.open(uploaded_file).convert("RGB")
            img_bytes_io = io.BytesIO()
            image.save(img_bytes_io, format="JPEG")
            img_bytes = img_bytes_io.getvalue()

            with st.spinner("🛠️ 画像を補正しています... しばらくお待ちください"):
                corrected_image, correction_msg = auto_crop_and_rotate(img_bytes)
                final_image, enhancement_msg = enhance_image(corrected_image)

            st.success("✅ 補正完了！")
            st.image(final_image, caption="補正後の画像", use_container_width=True)
            st.markdown(f"🌀 **構図補正ポイント：** {correction_msg}")
            st.markdown(f"🎨 **色味補正ポイント：** {enhancement_msg}")
