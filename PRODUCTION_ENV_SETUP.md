# 本番環境 環境変数設定

## Railway.app ダッシュボードで設定する環境変数

### 1. Supabase設定
```
NEXT_PUBLIC_SUPABASE_URL=https://prkmqzmramzdolmjsvmq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya21xem1yYW16ZG9sbWpzdm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjY4MTMsImV4cCI6MjA2NjQ0MjgxM30.4vZTOPOJ1Z8VFr2qKr8wJZGQ1mDR5K2Xw8nQZGQ1mDR
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya21xem1yYW16ZG9sbWpzdm1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg2NjgxMywiZXhwIjoyMDY2NDQyODEzfQ.EXAMPLE_SERVICE_ROLE_KEY
```

### 2. Stripe設定（本番用キーに変更）
```
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### 3. JWT設定
```
JWT_SECRET=your-super-secure-jwt-secret-key-for-production
```

### 4. OpenAI設定
```
OPENAI_API_KEY=your-openai-api-key
```

## 本番環境での注意事項

1. **Stripeキーを本番用に変更**
   - テスト用キー（sk_test_、pk_test_）から本番用キー（sk_live_、pk_live_）に変更
   - Stripe Webhookエンドポイントを本番URLに設定

2. **JWT_SECRETを強力なものに変更**
   - 32文字以上のランダムな文字列を使用
   - 例：`openssl rand -base64 32` で生成

3. **データベースマイグレーション**
   - 本番Supabaseで必要なテーブルとトリガーが設定されているか確認

## デプロイ後の確認項目

- [ ] ヘルスチェックエンドポイント（/api/health）が正常に応答
- [ ] ログイン機能が正常に動作
- [ ] サブスクリプション作成が正常に動作
- [ ] Stripe Webhookが正常に受信される
- [ ] データベース接続が正常 