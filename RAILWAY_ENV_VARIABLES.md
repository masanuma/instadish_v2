# Railway.app 環境変数設定

## 🔥 緊急対応必要

以下の環境変数をRailway.appのダッシュボードで設定してください：

### 必須環境変数

```bash
# JWT設定
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Stripe設定（テスト用キー）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key-here
```

## 🎯 設定手順

1. [railway.app](https://railway.app) にログイン
2. プロジェクト選択
3. **Variables** タブをクリック
4. **New Variable** で上記の変数を一つずつ追加
5. **Deploy** ボタンで再デプロイ

## ✅ 設定完了後の確認

以下のURLでテスト：
- https://your-app-url.up.railway.app/api/health
- https://your-app-url.up.railway.app/

## 🔄 次のステップ

環境変数設定後：
1. 自動デプロイされるまで待機（約2-3分）
2. 上記URLでテスト
3. Stripe Webhook設定完了 