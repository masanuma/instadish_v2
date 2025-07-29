-- 既存プロジェクト用：サブスクリプション機能追加のためのマイグレーション（修正版）
-- https://supabase.com/dashboard/project/prkmqzmramzdolmjsvmq のSQL Editorで実行

-- Step 1: 既存storesテーブルにカラム追加
ALTER TABLE stores ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Step 2: インデックス追加
CREATE INDEX IF NOT EXISTS idx_stores_stripe_customer_id ON stores(stripe_customer_id);

-- Step 3: サブスクリプションプランテーブル
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price_monthly INTEGER NOT NULL, -- 月額料金（円）
  stripe_price_id VARCHAR(255) UNIQUE NOT NULL,
  features TEXT[], -- プランの機能一覧
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: サブスクリプション状況テーブル
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) NOT NULL, -- active, canceled, past_due, unpaid, trialing
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: 支払い履歴テーブル
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255) UNIQUE,
  amount INTEGER NOT NULL, -- 支払い金額（円）
  status VARCHAR(50) NOT NULL, -- paid, failed, pending
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: システム管理者テーブル
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin', -- admin, super_admin
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: インデックス作成
CREATE INDEX IF NOT EXISTS idx_subscriptions_store_id ON subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- Step 8: トリガー設定（PostgreSQL互換版）
-- トリガーが既に存在する場合は削除してから作成
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at 
  BEFORE UPDATE ON subscription_plans 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at 
  BEFORE UPDATE ON admin_users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Step 9: 初期データ挿入
INSERT INTO subscription_plans (name, price_monthly, stripe_price_id, features) 
VALUES ('ベーシックプラン', 2980, 'price_basic_placeholder', ARRAY['AI画像処理', '月100枚まで', 'メール サポート'])
ON CONFLICT (stripe_price_id) DO NOTHING;

-- Step 10: 初期管理者ユーザー（パスワード: admin123）
INSERT INTO admin_users (username, email, password_hash) 
VALUES ('admin', 'admin@instadish.com', '$2a$10$8K1p/a0dUzsXvW5NdvQ7Qu0LDx7FvJUnp9KuIWxC1R8LdlE5r9S6e')
ON CONFLICT (username) DO NOTHING; 