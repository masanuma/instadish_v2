# app.py（修正後）

import streamlit as st
from PIL import Image, ImageEnhance
import io
import uuid
from processor import process_image

st.set_page_config(page_title="InstaDish | 写真加工デモ", layout="centered")
st.markdown("""
    <style>
        .main {
            background-color: #f9f9f9;
        }
        .section {
            background-color: white;
            padding: 1rem;
            border-radius: 1rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .section h3 {
            margin-bottom: 0.5rem;
        }
        .upload-block, .business-block, .action-block {
            margin-bottom: 1rem;
        }
    </style>
""", unsafe_allow_html=True)

st.markdown("<div class='section'>", unsafe_allow_html=True)
st.title("📸 InstaDish | 写真加工デモ版")
st.markdown("写真をアップロードし、ジャンルを選んでから加工を行ってください。")
st.markdown("</div>", unsafe_allow_html=True)

st.markdown("<div class='section'>", unsafe_allow_html=True)
st.markdown("<h3>1. 写真をアップロード</h3>", unsafe_allow_html=True)
uploaded_files = st.file_uploader("画像を選択（複数可）", type=["jpg", "jpeg", "png"], accept_multiple_files=True)
st.markdown("</div>", unsafe_allow_html=True)

st.markdown("<div class='section'>", unsafe_allow_html=True)
st.markdown("<h3>2. 業態・ターゲット選択</h3>", unsafe_allow_html=True)
business_type = st.selectbox("業態", ["和食", "洋食", "中華", "居酒屋", "バー", "カフェ", "エスニック"])
target_audience = st.selectbox("ターゲット層", ["インスタ好き", "外国人観光客", "会社員", "シニア", "OL"])
st.markdown("</div>", unsafe_allow_html=True)

# ジャンル選択用セクションをここに追加
st.markdown("<div class='section'>", unsafe_allow_html=True)
st.markdown("<h3>3. ジャンル選択（AI未使用時）</h3>", unsafe_allow_html=True)
category = st.selectbox("ジャンルを選んでください", ["ドリンク", "料理", "スイーツ", "店舗内装", "看板", "その他"])
st.markdown("</div>", unsafe_allow_html=True)

st.markdown("<div class='section'>", unsafe_allow_html=True)
st.markdown("<h3>4. 加工開始</h3>", unsafe_allow_html=True)
if uploaded_files and st.button("📸 加工する"):
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

if not uploaded_files:
    st.info("まず画像をアップロードしてください。")
