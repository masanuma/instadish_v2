import streamlit as st

def build_layout():
    st.markdown("### 📸 InstaDish | 写真加工デモ版")
    st.caption("飲食店向けInstagram投稿支援ツール（UI分離構成）")

    st.markdown("#### 1. 写真をアップロード")
    st.file_uploader("画像を選択（複数可）", type=["jpg", "jpeg", "png"], accept_multiple_files=True)

    st.markdown("#### 2. 業態・ターゲットを選択")
    col1, col2 = st.columns(2)
    with col1:
        st.selectbox("業態", ["和食", "洋食", "中華", "居酒屋", "バー", "エスニック", "カフェ"])
    with col2:
        st.selectbox("ターゲット層", ["インスタ好き", "外国人観光客", "会社員", "シニア", "OL"])

    st.button("画像を加工")
