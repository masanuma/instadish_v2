import streamlit as st
from PIL import Image, ImageEnhance
import io
import uuid
from processor import process_image

st.set_page_config(page_title="インスタディッシュ｜写真加工＋AIハッシュタグ提案", layout="centered")

# lang="ja" + CSS + font size responsive
st.markdown("""
    <script>
    document.addEventListener("DOMContentLoaded", function() {
        document.documentElement.setAttribute("lang", "ja");
    });
    </script>
    <style>
    .stApp {
        background-color: #fde7dc;
        font-family: "Noto Sans JP", sans-serif;
    }
    h1 {
        font-size: clamp(22px, 6vw, 36px);
        margin-bottom: 0.2em;
        text-align: center;
    }
    p.subtitle {
        font-size: clamp(14px, 3vw, 18px);
        text-align: center;
        margin-top: 0;
        margin-bottom: 1.5em;
        color: #555;
    }
    h3 {
        font-size: clamp(18px, 5vw, 28px);
        margin-top: 2rem;
        margin-bottom: 0.5rem;
        font-weight: bold;
    }
    </style>
""", unsafe_allow_html=True)

# Header
st.markdown(""""<h1>📸 InstaDish｜写真加工デモ版</h1><p class='subtitle'>飲食店向けInstagram投稿支援ツール（UI改善＋翻訳抑止対応）</p>""", unsafe_allow_html=True)

# Upload
st.markdown("### 1. 写真をアップロード")
uploaded_files = st.file_uploader("画像を選んでください（複数可）", type=["jpg", "jpeg", "png"], accept_multiple_files=True)

# Business and Target selection
st.markdown("### 2. 業態・ターゲットを選択")
col1, col2 = st.columns(2)
with col1:
    business_type = st.selectbox("", ["バー", "カフェ", "居酒屋", "和食", "洋食", "中華"])
with col2:
    target_group = st.selectbox("", ["インスタ好き", "観光客", "会社員", "シニア", "OL"])

# Processing block
if uploaded_files:
    st.markdown("### 3. 加工とダウンロード")
    if st.button("📸 画像を加工する"):
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