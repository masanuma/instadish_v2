// テスト用環境変数設定スクリプト

// 必要な環境変数を設定
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-service-role-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_stripe_secret_key';
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_dummy_stripe_publishable_key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_dummy_webhook_secret';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-development-only';
process.env.OPENAI_API_KEY = 'sk-test-dummy-openai-api-key';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'development';

console.log('テスト用環境変数が設定されました');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '設定済み' : '未設定');
console.log('NODE_ENV:', process.env.NODE_ENV); 