
import streamlit as st
from processor import process_image
from PIL import Image
import io
import uuid

st.set_page_config(page_title="InstaDish V2 | 写真加工とAI提案", layout="centered")

# === 背景色ラッパーで囲う ===
st.markdown("""
    <style>
    .app-wrapper {
        background-color: #fde7dc;
        padding: 2rem;
        border-radius: 1rem;
    }
    </style>
    <div class="app-wrapper">
""", unsafe_allow_html=True)

# === ヘッダー ===
st.markdown("""
<div style='text-align: center; margin-bottom: 1.5rem;'>
    <h1 style='margin-bottom: 0.2rem;'>📸 InstaDish | 写真加工デモ版</h1>
    <p style='color: #555;'>飲食店向けInstagram投稿支援ツール（UIデモ版）</p>
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

# ラッパー閉じタグ
st.markdown("</div>", unsafe_allow_html=True)
