
import streamlit as st

def render_layout():
    st.markdown(
        '''
        <style>
        body {
            background-color: #ffeadd;
        }
        .title {
            font-size: 2.4rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        .subtitle {
            font-size: 1.1rem;
            color: #666;
            margin-bottom: 2rem;
        }
        .section-title {
            font-size: 1.4rem;
            font-weight: bold;
            margin-top: 1.8rem;
        }
        </style>
        ''',
        unsafe_allow_html=True
    )

    st.markdown("<div class='title'>📸 InstaDish | 写真加工デモ版</div>", unsafe_allow_html=True)
    st.markdown("<div class='subtitle'>飲食店向けInstagram投稿支援ツール（UI分離構成）</div>", unsafe_allow_html=True)

    st.markdown("<div class='section-title'>1. 写真をアップロード</div>", unsafe_allow_html=True)
    uploaded_files = st.file_uploader("画像を選択（複数可）", type=["jpg", "jpeg", "png"], accept_multiple_files=True)

    st.markdown("<div class='section-title'>2. 業態・ターゲットを選択</div>", unsafe_allow_html=True)
    col1, col2 = st.columns(2)
    with col1:
        business_type = st.selectbox("", ["和食", "洋食", "カフェ", "バー"])
    with col2:
        target_audience = st.selectbox("", ["インスタ好き", "観光客", "地元常連", "若者"])

    if uploaded_files:
        if st.button("画像を加工"):
            for uploaded_file in uploaded_files:
                st.image(uploaded_file, caption="アップロード画像", use_container_width=True)
