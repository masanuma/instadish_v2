import streamlit as st
import requests
from PIL import Image
import io


def show_layout():
    st.title("\U0001F4F8 InstaDish | インスタ映え画像補正")

    with st.container():
        uploaded_files = st.file_uploader(
            "",  
            type=["jpg", "jpeg", "png"],
            accept_multiple_files=True,
            label_visibility="collapsed"
        )

        if uploaded_files:
            for file in uploaded_files:
                image_bytes = file.read()

                with st.spinner("AIが画像を解析・補正中です…"):
                    result = call_external_ai_api(image_bytes)

                if result:
                    corrected_image = result.get("processed_image")
                    explanation = result.get("explanation", "")

                    if corrected_image:
                        image_data = io.BytesIO(corrected_image)
                        image = Image.open(image_data)
                        st.image(image, caption="AI加工後の画像", use_container_width=True)

                    if explanation:
                        st.markdown(f"### 加工内容の説明")
                        st.markdown(explanation)
                else:
                    st.error("画像の加工に失敗しました。もう一度お試しください。")


def call_external_ai_api(image_bytes):
    try:
        response = requests.post(
            "https://your-api-endpoint.com/process-image",
            files={"file": ("image.jpg", image_bytes, "image/jpeg")}
        )
        if response.status_code == 200:
            result = response.json()
            processed_image = requests.get(result["image_url"]).content
            return {
                "processed_image": processed_image,
                "explanation": result.get("explanation", "")
            }
    except Exception as e:
        print("API呼び出しエラー:", e)
    return None
