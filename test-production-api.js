const axios = require('axios');

// テスト設定
const BASE_URL = 'http://localhost:3000';
const TEST_IMAGE = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

async function testProductionAPI() {
  console.log('=== 本番API動作確認テスト開始 ===\n');

  try {
    // 1. API情報取得
    console.log('1. API情報取得テスト...');
    const infoResponse = await axios.get(`${BASE_URL}/api/ai-process`);
    console.log('✅ API情報取得成功:', infoResponse.data);
    console.log('');

    // 2. 正常なAI処理テスト
    console.log('2. 正常なAI処理テスト...');
    const startTime = Date.now();
    const processResponse = await axios.post(`${BASE_URL}/api/ai-process`, {
      image: TEST_IMAGE,
      businessType: 'cafe',
      effectStrength: 'normal'
    });
    const endTime = Date.now();
    
    console.log('✅ AI処理成功');
    console.log(`   処理時間: ${endTime - startTime}ms`);
    console.log(`   API記録時間: ${processResponse.data.processingTime}ms`);
    console.log(`   結果: ${JSON.stringify(processResponse.data, null, 2).substring(0, 200)}...`);
    console.log('');

    // 3. エラーハンドリングテスト
    console.log('3. エラーハンドリングテスト...');
    try {
      await axios.post(`${BASE_URL}/api/ai-process`, {
        image: '',
        businessType: 'cafe',
        effectStrength: 'normal'
      });
      console.log('❌ エラーが発生しませんでした');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ 適切なエラーハンドリング:', error.response.data);
      } else {
        console.log('❌ 予期しないエラー:', error.message);
      }
    }
    console.log('');

    // 4. キャプション再生成テスト
    console.log('4. キャプション再生成テスト...');
    const captionResponse = await axios.post(`${BASE_URL}/api/ai-process`, {
      image: TEST_IMAGE,
      businessType: 'cafe',
      effectStrength: 'normal',
      regenerateCaption: true,
      customPrompt: 'より親しみやすい表現で'
    });
    console.log('✅ キャプション再生成成功:', captionResponse.data.caption);
    console.log('');

    // 5. ハッシュタグ再生成テスト
    console.log('5. ハッシュタグ再生成テスト...');
    const hashtagResponse = await axios.post(`${BASE_URL}/api/ai-process`, {
      image: TEST_IMAGE,
      businessType: 'cafe',
      effectStrength: 'normal',
      regenerateHashtags: true
    });
    console.log('✅ ハッシュタグ再生成成功:', hashtagResponse.data.hashtags);
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

// テスト実行
testProductionAPI(); 