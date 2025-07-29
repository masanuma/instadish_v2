# InstaDish Pro セットアップ手順

## 1. Supabaseの設定

### 1.1 Supabaseプロジェクトの作成
1. [Supabase](https://supabase.com/)にアクセスしてアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトのURL（NEXT_PUBLIC_SUPABASE_URL）とAPIキー（NEXT_PUBLIC_SUPABASE_ANON_KEY）をメモ

### 1.2 データベーステーブルの作成
Supabaseの「SQL Editor」で`src/lib/database.sql`の内容を実行してテーブルを作成してください。

## 2. 環境変数の設定

`.env.local`ファイルを作成して以下の環境変数を設定してください：

```bash
# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# JWT Secret (ランダムな長い文字列を生成してください)
JWT_SECRET=your-very-long-random-secret-key-here

# Stripe設定（新規追加）
STRIPE_SECRET_KEY=sk_test_...          # テスト環境用
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # テスト環境用
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook署名検証用
```

## 3. アプリケーションの起動

```bash
npm install
npm run dev
```

## 4. 店舗の初期登録

アプリケーション起動後、以下のAPIエンドポイントを使用して店舗を登録：

```bash
curl -X POST http://localhost:3000/api/store/register \
  -H "Content-Type: application/json" \
  -d '{
    "store_code": "TEST001",
    "name": "テスト店舗",
    "password": "testpassword123",
    "fixed_caption": "本日もご来店をお待ちしております！",
    "fixed_hashtags": "#美味しい #地元グルメ",
    "store_description": "地元に愛される家庭料理店です。素材にこだわり、心を込めてお作りしています。"
  }'
```

## 5. 利用開始

1. http://localhost:3000/login でログイン
2. 店舗コード: TEST001、パスワード: testpassword123
3. ダッシュボードで店舗情報管理
4. 画像処理機能を利用 

## データベース設定

### 1. 既存テーブルの更新
```sql
-- stores テーブルにカラム追加
ALTER TABLE stores ADD COLUMN email VARCHAR(255);
ALTER TABLE stores ADD COLUMN stripe_customer_id VARCHAR(255);
```

### 2. 新規テーブル作成
`src/lib/database.sql` の内容をSupabaseで実行してください。

## Stripe設定手順

### 1. Stripeアカウント作成・設定

1. [Stripe Dashboard](https://dashboard.stripe.com/) にログイン
2. **商品・価格の設定:**
   - 商品名: "InstaDish Pro ベーシックプラン"
   - 価格: ¥2,980/月（税込）
   - 無料トライアル: 14日間

3. **APIキーの取得:**
   - 公開可能キー（pk_test_...）
   - シークレットキー（sk_test_...）

### 2. Webhook設定

1. Stripe Dashboard > Webhooks > エンドポイントを追加
2. エンドポイントURL: `https://your-domain.com/api/subscription/webhook`
3. 選択するイベント:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 3. 価格IDの更新

Stripeで作成した価格IDを更新してください：

```typescript
// src/lib/stripe.ts
export const STRIPE_PRICE_IDS = {
  BASIC_MONTHLY: 'price_1234567890abcdef', // 実際の価格IDに更新
}
```

```sql
-- データベースの初期プランも更新
UPDATE subscription_plans 
SET stripe_price_id = 'price_1234567890abcdef' 
WHERE name = 'ベーシックプラン';
```

## 管理者設定

### 初期管理者アカウント

デフォルトの管理者アカウント:
- ユーザー名: `admin`
- パスワード: `admin123`
- メール: `admin@instadish.com`

⚠️ **本番環境では必ずパスワードを変更してください。**

## テスト方法

### 1. サブスクリプション機能テスト

1. 店舗アカウントでログイン
2. ダッシュボード → サブスクリプション
3. 無料トライアル開始をクリック
4. テスト用カード番号: `4242 4242 4242 4242`

### 2. Webhook テスト

```bash
# Stripe CLIでWebhookテスト
stripe listen --forward-to localhost:3000/api/subscription/webhook
```

## 本番環境デプロイ

### 1. 環境変数の更新

本番環境では以下を実際の値に更新:

```env
# 本番用Stripe設定
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. ドメイン設定

- Webhook URL を本番ドメインに更新
- CORS設定の確認
- SSL証明書の設定

## 次期実装予定機能

- [ ] 管理者画面（全ユーザー管理）
- [ ] 利用統計・分析
- [ ] 複数プラン対応
- [ ] 請求書管理
- [ ] メール通知
- [ ] キャンセル・プラン変更機能 