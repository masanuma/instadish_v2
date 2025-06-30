# InstaDish Pro

**飲食店専用AI画像加工サービス**

料理写真をAIで美味しそうに加工し、SNS投稿用のキャプションとハッシュタグを自動生成するWebアプリケーションです。

## 🚀 主な機能

### ✨ AI画像加工
- 料理写真をアップロードして自動で美味しそうに加工
- 明度、彩度、コントラストの最適化（デモ版では模擬実装）

### 📝 キャプション自動生成
- 画像内容に基づいた魅力的なSNS投稿用キャプションを自動作成
- 料理の種類を自動認識して適切な文章を生成

### #️⃣ ハッシュタグ提案
- 効果的で人気のハッシュタグを自動で提案
- インスタ映えを狙った最適なタグの組み合わせ

### 📋 コンテンツ管理
- 生成されたキャプションとハッシュタグのワンクリックコピー
- Twitter/X等のSNSへの直接シェア機能

### 📚 処理履歴管理
- 過去の画像処理結果を最大50件まで保存
- 履歴から過去のコンテンツを再利用可能
- ローカルストレージを使用したデータ永続化

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **デプロイ**: Railway
- **状態管理**: React Hooks
- **データ保存**: Local Storage

## 📦 インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバーの起動
npm start
```

## 🎯 使用方法

1. **画像アップロード**
   - メイン画面で「画像を選択」ボタンをクリック
   - 料理の写真を選択してアップロード

2. **AI処理実行**
   - 「AI加工・キャプション生成」ボタンをクリック
   - 数秒でAI処理が完了し、結果が表示されます

3. **コンテンツ活用**
   - 生成されたキャプションとハッシュタグを編集可能
   - 「コンテンツをコピー」でクリップボードにコピー
   - 「SNSでシェア」で直接SNSに投稿

4. **履歴管理**
   - 右上の「履歴」ボタンで過去の処理結果を確認
   - 履歴から任意の項目を選択して再利用

## 🎨 画面構成

### メイン画面
- 画像アップロード・加工エリア（左側）
- SNS投稿用コンテンツ表示エリア（右側）
- 機能説明セクション（下部）

### 履歴モーダル
- 処理済み画像の一覧表示
- 日時、料理タイプでの識別
- 個別削除・一括削除機能

## 🔧 設定・カスタマイズ

### AI処理のカスタマイズ
現在はデモ版として模擬データを使用していますが、以下の箇所で実際のAI APIと連携可能です：

- `src/app/api/process-image/route.ts` - 画像処理API
- `enhanceImageForDemo()` - 画像加工処理
- `estimateFoodType()` - 料理タイプ判定
- `generateCaption()` - キャプション生成
- `generateHashtags()` - ハッシュタグ生成

### 外部AI API連携例
```typescript
// OpenAI Vision API、Google Cloud Vision、AWS Rekognition などと連携
const response = await fetch('YOUR_AI_API_ENDPOINT', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
  body: JSON.stringify({ image: imageBase64 })
});
```

## 🚀 デプロイ

### Railway（推奨）
```bash
# Railway CLI をインストール
npm install -g @railway/cli

# デプロイ
railway deploy
```

### Vercel
```bash
# Vercel CLI をインストール
npm install -g vercel

# デプロイ
vercel
```

## 📋 環境変数

実際のAI APIを使用する場合は、以下の環境変数を設定してください：

```env
# AI API設定
AI_API_KEY=your_ai_api_key
AI_API_ENDPOINT=https://api.your-ai-service.com

# その他の設定
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

## 🔄 今後の機能拡張予定

- [ ] ユーザー認証・ログイン機能
- [ ] 複数画像の一括処理
- [ ] 画像フィルター・エフェクトの選択機能
- [ ] SNSプラットフォーム別最適化
- [ ] 投稿スケジューリング機能
- [ ] 分析・統計機能
- [ ] 多言語対応

## 🤝 貢献

プルリクエストや Issue の投稿を歓迎します。大きな変更を行う場合は、まず Issue を作成して議論してください。

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 📞 サポート

ご質問やサポートが必要な場合は、GitHub Issues をご利用ください。

---

**InstaDish Pro** - あなたの料理写真を最高の投稿に変換します 🍽️✨ 