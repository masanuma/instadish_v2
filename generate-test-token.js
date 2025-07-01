const jwt = require('jsonwebtoken');

// テスト用JWTトークンを生成
function generateTestToken() {
  const JWT_SECRET = 'dev-jwt-secret-key-for-local-development-only';
  const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24時間
  
  const payload = {
    storeId: 'test-store-id',
    exp: Math.floor(Date.now() / 1000) + (SESSION_DURATION / 1000)
  };
  
  const token = jwt.sign(payload, JWT_SECRET);
  
  console.log('=== テスト用認証トークン生成 ===');
  console.log('トークン:', token);
  console.log('有効期限:', new Date(payload.exp * 1000).toISOString());
  console.log('');
  console.log('curlコマンド例:');
  console.log(`curl -X POST http://localhost:3000/api/ai-process \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "Cookie: auth_token=${token}" \\`);
  console.log(`  -d '{"image":"data:image/jpeg;base64,...","businessType":"cafe","effectStrength":"normal"}'`);
  
  return token;
}

generateTestToken(); 