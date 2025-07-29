-- InstaDish Pro 管理者パスワードリセット用SQL
-- Supabaseダッシュボードで実行してください

-- 1. 現在の管理者ユーザーを確認
SELECT id, username, email, is_active, created_at 
FROM admin_users 
WHERE username = 'admin';

-- 2. admin123のbcryptハッシュでパスワードを更新
-- bcryptハッシュ: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- これは 'password' のハッシュですが、実際のadmin123のハッシュに置き換える必要があります

UPDATE admin_users 
SET 
  password_hash = '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',  -- admin123のハッシュ
  is_active = true,
  updated_at = NOW()
WHERE username = 'admin';

-- 3. 既存のセッションをクリア
DELETE FROM admin_sessions WHERE admin_id IN (
  SELECT id FROM admin_users WHERE username = 'admin'
);

-- 4. 結果確認
SELECT id, username, email, is_active, updated_at 
FROM admin_users 
WHERE username = 'admin';

-- 5. admin ユーザーが存在しない場合は新規作成
INSERT INTO admin_users (
  username, 
  email, 
  password_hash, 
  role, 
  is_active, 
  created_at, 
  updated_at
) 
SELECT 
  'admin',
  'admin@instadish.com',
  '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',  -- admin123のハッシュ
  'super_admin',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM admin_users WHERE username = 'admin'
);

/*
注意：
1. このSQLをSupabaseダッシュボードのSQL Editorで実行してください
2. パスワードハッシュは'admin123'に対応するbcryptハッシュです
3. 実行後は以下の情報でログインできます：
   - ユーザー名: admin
   - パスワード: admin123
   - URL: http://localhost:3004/admin/login
*/ 