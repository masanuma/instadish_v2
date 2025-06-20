import streamlit as st
from ui.layout import show_layout
import base64

# PWA対応のページ設定
st.set_page_config(
    page_title="InstaDish | インスタ映え画像補正",
    page_icon="📸",
    layout="wide",
    initial_sidebar_state="collapsed",  # モバイルではサイドバーを初期状態で閉じる
    menu_items={
        'Get Help': None,
        'Report a bug': None,
        'About': "InstaDish - 飲食店向けインスタ映え画像加工アプリ"
    }
)

# カスタムCSSとJavaScriptの読み込み
def load_custom_css():
    with open('ui/theme.css', 'r', encoding='utf-8') as f:
        st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)
    
    # PWA用のメタタグとマニフェスト
    pwa_meta = """
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#ff6666">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="InstaDish">
    <link rel="manifest" href="data:application/manifest+json;base64,{}">
    """.format(base64.b64encode(create_manifest().encode()).decode())
    
    st.markdown(pwa_meta, unsafe_allow_html=True)

def create_manifest():
    """PWAマニフェストの作成"""
    manifest = {
        "name": "InstaDish",
        "short_name": "InstaDish",
        "description": "飲食店向けインスタ映え画像加工アプリ",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#fdf4f4",
        "theme_color": "#ff6666",
        "orientation": "portrait-primary",
        "icons": [
            {
                "src": "data:image/svg+xml;base64,{}".format(
                    base64.b64encode(create_icon_svg().encode()).decode()
                ),
                "sizes": "192x192",
                "type": "image/svg+xml"
            }
        ]
    }
    import json
    return json.dumps(manifest, ensure_ascii=False)

def create_icon_svg():
    """アプリアイコンのSVG作成"""
    return '''
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
        <rect width="192" height="192" fill="#ff6666" rx="24"/>
        <path d="M96 48c-26.5 0-48 21.5-48 48s21.5 48 48 48 48-21.5 48-48-21.5-48-48-48zm0 80c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z" fill="white"/>
        <circle cx="96" cy="96" r="16" fill="white"/>
    </svg>
    '''

# カスタムCSSとPWA設定を読み込み
load_custom_css()

# メインアプリケーション
show_layout()
