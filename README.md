
# InstaDish UI V2

飲食店向けInstagram投稿支援アプリ（UIバージョン）

## 内容物

- `app.py` : Streamlitアプリ本体（UI構築済）
- `processor.py` : 加工ロジック（明るさ・コントラスト調整）
- `requirements.txt` : 必要なPythonパッケージ
- `README.md` : 本ファイル

## 利用方法

### 1. GitHubにこのフォルダをアップロード
```
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/instadish-ui-v2.git
git push -u origin main
```

### 2. Streamlit Cloudでデプロイ
- Deploy from GitHub を選択
- `main` ブランチ / `app.py` をentry pointに指定
