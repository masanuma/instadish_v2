
import streamlit as st
from processor import process_image
from PIL import Image
import io
import uuid

st.set_page_config(page_title="InstaDish V2 | 写真加工とAI提案", layout="centered")

# === CSS styling
st.markdown("""
    <style>
    .stApp {
        background-color: #fde7dc;
    }
    h1 {
        font-size: clamp(24px, 6vw, 36px);
        margin-bottom: 0.2em;
        text-align: center;
    }
    p.subtitle {
        font-size: clamp(14px, 3.5vw, 20px);
        text-align: center;
        margin-top: 0;
        margin-bottom: 1.5em;
    }
    .block-container {
        padding-top: 1rem;
        padding-bottom: 1rem;
        padding-left: 1rem;
        padding-right: 1rem;
    }
    </style>
""", unsafe_allow_html=True)

# === Header with split lines
st.markdown("""
<div>
    <h1>📸 InstaDish</h1>
    <p class="subtitle">写真加工デモ版（飲食店向けInstagram投稿支援ツール）</p>
</div>
""", unsafe_allow_html=True)

# === 写真アップロード ===
st.subheader("1. 写真をアップロード")
uploaded_files = st.file_uploader("", type=["jpg", "jpeg", "png"], accept_multiple_files=True)

# === 業態とターゲット層 ===
st.subheader("2. 業態・ターゲットを選択")
col1, col2 = st.columns(2)
with col1:
    business_type = st.selectbox("", ["バー", "カフェ", "居酒屋", "和食", "洋食", "中華"])
with col2:
    target_group = st.selectbox("", ["インスタ好き", "観光客", "会社員", "シニア", "OL"])

# === 加工処理とプレビュー ===
if uploaded_files:
    st.subheader("3. 加工とプレビュー")
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
