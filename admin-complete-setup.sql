-- 完全な管理者セットアップ（2025年7月28日版）
-- 既存のテーブルとデータを削除して、クリーンな状態から作成

-- 既存テーブルの削除（依存関係のため順序重要）
DROP TABLE IF EXISTS admin_sessions CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- 管理者ユーザーテーブルの作成
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 管理者セッションテーブルの作成
CREATE TABLE admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);
CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);

-- 管理者ユーザーを作成（パスワード: admin123）
-- ※ハッシュは新しく生成したものに後で置き換えてください
INSERT INTO admin_users (username, email, password_hash, role, is_active) 
VALUES (
  'admin',
  'admin@instadish.com',
  '$2a$10$3f7cgYPECWs5rLM2rw17a.KrxLQ43EHjTfYRndMMXb6lEHbMwPqSC',
  'admin',
  true
);

-- 確認用クエリ
SELECT 
  id, 
  username, 
  email, 
  role, 
  is_active, 
  created_at,
  LENGTH(password_hash) as hash_length
FROM admin_users;

-- テーブル存在確認
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('admin_users', 'admin_sessions')
ORDER BY table_name, ordinal_position; 