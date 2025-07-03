const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123';
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('パスワード:', password);
    console.log('ハッシュ:', hash);
    console.log('ソルトラウンド:', saltRounds);
    
    // 検証テスト
    const isValid = await bcrypt.compare(password, hash);
    console.log('検証結果:', isValid);
    
    return hash;
  } catch (error) {
    console.error('ハッシュ生成エラー:', error);
  }
}

generateHash(); 