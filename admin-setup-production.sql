-- 本番環境用管理者ユーザー設定
-- 実行前にbcryptjsでハッシュを生成: admin123 -> $2a$10$...

-- 管理者ユーザーテーブルの作成（存在しない場合）
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 管理者セッションテーブルの作成（存在しない場合）
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 既存の管理者ユーザーを削除（クリーンアップ）
DELETE FROM admin_users WHERE username = 'admin';

-- 新しい管理者ユーザーを作成
-- パスワード: admin123
-- ハッシュ: $2a$10$3f7cgYPECWs5rLM2rw17a.KrxLQ43EHjTfYRndMMXb6lEHbMwPqSC
INSERT INTO admin_users (username, email, password_hash, role, is_active) 
VALUES (
  'admin',
  'admin@instadish.com',
  '$2a$10$3f7cgYPECWs5rLM2rw17a.KrxLQ43EHjTfYRndMMXb6lEHbMwPqSC',
  'admin',
  true
);

-- 確認用クエリ
SELECT id, username, email, role, is_active, created_at 
FROM admin_users 
WHERE username = 'admin'; 