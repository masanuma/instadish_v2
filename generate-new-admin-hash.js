const bcrypt = require('bcryptjs')

async function generateHash() {
  const password = 'admin123'
  const saltRounds = 10
  
  try {
    const hash = await bcrypt.hash(password, saltRounds)
    console.log('パスワード:', password)
    console.log('新しいハッシュ:', hash)
    
    // 検証
    const isValid = await bcrypt.compare(password, hash)
    console.log('検証結果:', isValid)
    
    console.log('\n=== Supabaseで実行するSQL ===')
    console.log(`DELETE FROM admin_users WHERE username = 'admin';`)
    console.log(`DELETE FROM admin_sessions;`)
    console.log(`INSERT INTO admin_users (username, email, password_hash, role, is_active) VALUES ('admin', 'admin@instadish.com', '${hash}', 'admin', true);`)
    
  } catch (error) {
    console.error('エラー:', error)
  }
}

generateHash() 