-- 管理者セッションテーブル追加のためのマイグレーション
-- https://supabase.com/dashboard/project/prkmqzmramzdolmjsvmq のSQL Editorで実行

-- Step 1: 管理者セッションテーブル作成
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: インデックス作成
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);

-- Step 3: 初期管理者ユーザー作成（パスワード: admin123）
-- bcryptでハッシュ化したパスワード（salt rounds: 10）
INSERT INTO admin_users (username, email, password_hash, role) 
VALUES (
  'admin',
  'admin@instadish.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin'
) ON CONFLICT (username) DO NOTHING;

-- Step 4: 初期サブスクリプションプラン作成
INSERT INTO subscription_plans (name, price_monthly, stripe_price_id, features, is_active) 
VALUES (
  'ベーシックプラン',
  2980,
  'price_1ReBIuFaHkt2FbdwJgctzXU1',
  ARRAY[
    'AI画像加工',
    'AIキャプション生成',
    'ハッシュタグ提案',
    '処理履歴管理',
    '店舗情報管理'
  ],
  true
) ON CONFLICT (stripe_price_id) DO NOTHING;

-- Step 5: 既存の店舗にメールアドレスカラムが存在しない場合は追加
ALTER TABLE stores ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Step 6: 既存の店舗にStripe顧客IDカラムが存在しない場合は追加
ALTER TABLE stores ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Step 7: 期限切れセッション削除のための関数作成（既に存在する場合はスキップ）
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  -- 一般ユーザーセッション削除
  DELETE FROM auth_sessions 
  WHERE expires_at < NOW();
  
  -- 管理者セッション削除
  DELETE FROM admin_sessions 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Step 8: 定期的なセッションクリーンアップのためのスケジュール設定
-- 注意: Supabaseの無料プランではcronが利用できないため、手動で実行するか、
-- アプリケーション側で定期的に実行する必要があります

-- 確認用クエリ
SELECT 'admin_sessions table created successfully' as status;
SELECT COUNT(*) as admin_users_count FROM admin_users;
SELECT COUNT(*) as subscription_plans_count FROM subscription_plans; 