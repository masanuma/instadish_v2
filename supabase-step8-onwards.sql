-- Step 8以降：トリガー設定と初期データ挿入
-- https://supabase.com/dashboard/project/prkmqzmramzdolmjsvmq のSQL Editorで実行

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