-- 本番環境用テストデータ挿入SQL
-- パスワードハッシュ: test123 -> $2a$10$...

-- テスト店舗データの挿入
INSERT INTO stores (
  store_code, 
  name, 
  password_hash, 
  email, 
  address, 
  phone, 
  store_description
) VALUES (
  'TEST001',
  'テスト店舗',
  '$2b$10$OHf0uXc.iOjGpcZCAYg5iOAC4lwMRdQPh93IpiYT0ZdgFhSbviTam', -- test123のハッシュ値
  'asanuma.works@gmail.com',
  '東京都渋谷区テスト町1-1-1',
  '03-1234-5678',
  'InstaDish Pro テスト用店舗です'
) ON CONFLICT (store_code) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  email = EXCLUDED.email,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  store_description = EXCLUDED.store_description,
  updated_at = NOW();

-- サブスクリプションプランの更新
UPDATE subscription_plans 
SET 
  name = 'InstaDish Pro ベーシックプラン',
  price_monthly = 5000,
  stripe_price_id = 'price_1ReBIuFaHkt2FbdwJgctzXU1',
  features = ARRAY['AI画像処理', '月額制', '2週間無料トライアル', 'メールサポート'],
  updated_at = NOW()
WHERE name = 'ベーシックプラン';

-- プランが存在しない場合は挿入
INSERT INTO subscription_plans (name, price_monthly, stripe_price_id, features)
SELECT 'InstaDish Pro ベーシックプラン', 5000, 'price_1ReBIuFaHkt2FbdwJgctzXU1', ARRAY['AI画像処理', '月額制', '2週間無料トライアル', 'メールサポート']
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE stripe_price_id = 'price_1ReBIuFaHkt2FbdwJgctzXU1'
);

-- 確認用クエリ
SELECT 'テスト店舗データ確認:' as info;
SELECT store_code, name, email FROM stores WHERE store_code = 'TEST001';

SELECT 'サブスクリプションプラン確認:' as info;
SELECT name, price_monthly, stripe_price_id FROM subscription_plans; 