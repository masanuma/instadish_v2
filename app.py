import streamlit as st
from processor import process_image
from PIL import Image
import io
import uuid

st.set_page_config(page_title="InstaDish V2 | 写真加工とAI提案", layout="centered")

# === 背景と全体スタイル設定 ===
st.markdown(
    """
    <style>
    body {
        background-color: #f8f4ee;
    }
    .block-container {
        padding-top: 1rem;
        padding-bottom: 2rem;
    }
    .stTextInput, .stSelectbox, .stButton, .stFileUploader {
        margin-bottom: 0.5rem !important;
    }
    .card {
        background-color: white;
        border-radius: 20px;
        padding: 1.2rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        margin-bottom: 1.5rem;
    }
    .small-space {
        margin-top: -10px;
        margin-bottom: -5px;
    }
    </style>
    """,
    unsafe_allow_html=True
)

st.markdown("<div class='card'>", unsafe_allow_html=True)
st.title("📸 InstaDish | 写真加工デモ版")
st.caption("飲食店向けInstagram投稿支援ツール（UIデモ版）")
st.markdown("</div>", unsafe_allow_html=True)

# === 写真アップロード ===
st.markdown("<div class='card'>", unsafe_allow_html=True)
st.subheader("1. 写真をアップロード")
uploaded_files = st.file_uploader(
    "画像を選択（複数可）", type=["jpg", "jpeg", "png"], accept_multiple_files=True
)
st.markdown("</div>", unsafe_allow_html=True)

# === 業態とターゲット層 ===
st.markdown("<div class='card'>", unsafe_allow_html=True)
st.subheader("2. 業態・ターゲットを選択")
col1, col2 = st.columns(2)
with col1:
    business_type = st.selectbox("業態", ["バー", "カフェ", "居酒屋", "和食", "洋食", "中華"])
with col2:
    target_group = st.selectbox("ターゲット層", ["インスタ好き", "観光客", "会社員", "シニア", "OL"])
st.markdown("</div>", unsafe_allow_html=True)

# === 加工処理とプレビュー ===
if uploaded_files:
    st.markdown("<div class='card'>", unsafe_allow_html=True)
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
    st.markdown("</div>", unsafe_allow_html=True)
