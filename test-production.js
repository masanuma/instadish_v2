const axios = require('axios');

async function testProductionAPI() {
  console.log('=== 本番API動作確認テスト開始 ===\n');

  try {
    // 1. API情報取得
    console.log('1. API情報取得テスト...');
    const infoResponse = await axios.get('http://localhost:3000/api/ai-process');
    console.log('✅ API情報取得成功:', infoResponse.data);
    console.log('');

    // 2. 正常なAI処理テスト
    console.log('2. 正常なAI処理テスト...');
    const startTime = Date.now();
    const processResponse = await axios.post('http://localhost:3000/api/ai-process', {
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      businessType: 'cafe',
      effectStrength: 'normal'
    });
    const endTime = Date.now();
    
    console.log('✅ AI処理成功');
    console.log(`   処理時間: ${endTime - startTime}ms`);
    console.log(`   API記録時間: ${processResponse.data.processingTime}ms`);
    console.log(`   キャプション: ${processResponse.data.caption}`);
    console.log(`   ハッシュタグ: ${processResponse.data.hashtags}`);
    console.log('');

    console.log('=== 本番API動作確認テスト完了 ===');
    console.log('✅ 全てのテストが成功しました！');

  } catch (error) {
    console.error('❌ テスト失敗:', error.message);
    if (error.response) {
      console.error('レスポンス:', error.response.data);
    }
  }
}

testProductionAPI(); 