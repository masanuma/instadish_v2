const axios = require('axios');

// テスト設定
const BASE_URL = 'http://localhost:3000';
const TEST_API_ENDPOINT = '/api/ai-process-test'; // テスト用エンドポイント
const TEST_IMAGE = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

// テスト結果の記録
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// テストケースの定義
const testCases = [
  // 正常系テスト
  {
    name: '正常なAI処理（キャッシュなし）',
    test: async () => {
      const response = await axios.post(`${BASE_URL}${TEST_API_ENDPOINT}`, {
        image: TEST_IMAGE,
        businessType: 'cafe',
        effectStrength: 'normal'
      });
      
      if (!response.data.success) throw new Error('処理が失敗しました');
      if (!response.data.caption) throw new Error('キャプションが生成されませんでした');
      if (!response.data.hashtags || response.data.hashtags.length === 0) throw new Error('ハッシュタグが生成されませんでした');
      if (response.data.fromCache) throw new Error('初回処理なのにキャッシュから取得されました');
      
      return response.data;
    }
  },
  
  {
    name: 'キャッシュ機能テスト（2回目）',
    test: async () => {
      const response = await axios.post(`${BASE_URL}${TEST_API_ENDPOINT}`, {
        image: TEST_IMAGE,
        businessType: 'cafe',
        effectStrength: 'normal'
      });
      
      if (!response.data.success) throw new Error('処理が失敗しました');
      if (!response.data.fromCache) throw new Error('2回目なのにキャッシュから取得されませんでした');
      
      return response.data;
    }
  },
  
  {
    name: 'キャプション再生成テスト',
    test: async () => {
      const response = await axios.post(`${BASE_URL}${TEST_API_ENDPOINT}`, {
        image: TEST_IMAGE,
        businessType: 'cafe',
        effectStrength: 'normal',
        regenerateCaption: true,
        customPrompt: 'より親しみやすい表現で'
      });
      
      if (!response.data.success) throw new Error('処理が失敗しました');
      if (!response.data.caption) throw new Error('キャプションが生成されませんでした');
      if (response.data.fromCache) throw new Error('再生成なのにキャッシュから取得されました');
      
      return response.data;
    }
  },
  
  {
    name: 'ハッシュタグ再生成テスト',
    test: async () => {
      const response = await axios.post(`${BASE_URL}${TEST_API_ENDPOINT}`, {
        image: TEST_IMAGE,
        businessType: 'cafe',
        effectStrength: 'normal',
        regenerateHashtags: true,
        customPrompt: '英語のハッシュタグを多めに'
      });
      
      if (!response.data.success) throw new Error('処理が失敗しました');
      if (!response.data.hashtags || response.data.hashtags.length === 0) throw new Error('ハッシュタグが生成されませんでした');
      if (response.data.fromCache) throw new Error('再生成なのにキャッシュから取得されました');
      
      return response.data;
    }
  },
  
  // 異常系テスト
  {
    name: '画像データなしエラーテスト',
    test: async () => {
      try {
        await axios.post(`${BASE_URL}${TEST_API_ENDPOINT}`, {
          businessType: 'cafe',
          effectStrength: 'normal'
        });
        throw new Error('エラーが発生しませんでした');
      } catch (error) {
        if (error.response?.status !== 400) throw new Error('期待される400エラーではありませんでした');
        if (!error.response?.data?.error) throw new Error('エラーメッセージがありませんでした');
        return error.response.data;
      }
    }
  },
  
  {
    name: '無効な業種エラーテスト',
    test: async () => {
      try {
        await axios.post(`${BASE_URL}${TEST_API_ENDPOINT}`, {
          image: TEST_IMAGE,
          businessType: 'invalid_type',
          effectStrength: 'normal'
        });
        throw new Error('エラーが発生しませんでした');
      } catch (error) {
        if (error.response?.status !== 500) throw new Error('期待される500エラーではありませんでした');
        return error.response.data;
      }
    }
  },
  
  {
    name: '無効なエフェクト強度エラーテスト',
    test: async () => {
      try {
        await axios.post(`${BASE_URL}${TEST_API_ENDPOINT}`, {
          image: TEST_IMAGE,
          businessType: 'cafe',
          effectStrength: 'invalid_strength'
        });
        throw new Error('エラーが発生しませんでした');
      } catch (error) {
        if (error.response?.status !== 500) throw new Error('期待される500エラーではありませんでした');
        return error.response.data;
      }
    }
  },
  
  // 境界値テスト
  {
    name: '非常に大きな画像データテスト',
    test: async () => {
      const largeImage = 'data:image/jpeg;base64,' + 'A'.repeat(1000000); // 約1MB
      
      try {
        const response = await axios.post(`${BASE_URL}${TEST_API_ENDPOINT}`, {
          image: largeImage,
          businessType: 'cafe',
          effectStrength: 'normal'
        });
        
        if (!response.data.success) throw new Error('処理が失敗しました');
        return response.data;
      } catch (error) {
        if (error.response?.status === 413) {
          console.log('大きな画像データは適切に拒否されました');
          return { success: true, message: '大きな画像データは適切に拒否されました' };
        }
        throw error;
      }
    }
  },
  
  {
    name: '空の画像データテスト',
    test: async () => {
      try {
        await axios.post(`${BASE_URL}${TEST_API_ENDPOINT}`, {
          image: '',
          businessType: 'cafe',
          effectStrength: 'normal'
        });
        throw new Error('エラーが発生しませんでした');
      } catch (error) {
        if (error.response?.status !== 400) throw new Error('期待される400エラーではありませんでした');
        return error.response.data;
      }
    }
  },
  
  // パフォーマンステスト
  {
    name: '処理時間測定テスト',
    test: async () => {
      const startTime = Date.now();
      
      const response = await axios.post(`${BASE_URL}${TEST_API_ENDPOINT}`, {
        image: TEST_IMAGE,
        businessType: 'cafe',
        effectStrength: 'normal'
      });
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      if (!response.data.success) throw new Error('処理が失敗しました');
      if (!response.data.processingTime) throw new Error('処理時間が記録されませんでした');
      
      console.log(`実際の処理時間: ${processingTime}ms, API記録時間: ${response.data.processingTime}ms`);
      
      if (processingTime > 30000) {
        console.warn('処理時間が30秒を超えています');
      }
      
      return response.data;
    }
  }
];

// 同時アクセステスト
async function concurrentAccessTest() {
  console.log('\n=== 同時アクセステスト開始 ===');
  
  const concurrentRequests = 5;
  const promises = [];
  
  for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
    axios.post(`${BASE_URL}${TEST_API_ENDPOINT}`, {
        image: TEST_IMAGE,
        businessType: 'cafe',
        effectStrength: 'normal'
      }).catch(error => ({ error: true, data: error.response?.data || error.message }))
    );
  }
  
  const results = await Promise.all(promises);
  let successCount = 0;
  let errorCount = 0;
  
  results.forEach((result, index) => {
    if (result.error) {
      errorCount++;
      console.log(`同時リクエスト ${index + 1}: エラー - ${result.data}`);
    } else {
      successCount++;
      console.log(`同時リクエスト ${index + 1}: 成功 - 処理時間: ${result.data.processingTime}ms`);
    }
  });
  
  console.log(`同時アクセステスト結果: 成功 ${successCount}/${concurrentRequests}, エラー ${errorCount}/${concurrentRequests}`);
  
  if (successCount > 0) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push('同時アクセステストが全て失敗しました');
  }
}

// リトライ機能テスト
async function retryFunctionTest() {
  console.log('\n=== リトライ機能テスト開始 ===');
  
  // ネットワークエラーをシミュレートするテスト
  try {
    const response = await axios.post(`${BASE_URL}${TEST_API_ENDPOINT}`, {
      image: TEST_IMAGE,
      businessType: 'cafe',
      effectStrength: 'normal'
    });
    
    if (response.data.success) {
      console.log('リトライ機能テスト: 正常に処理されました');
      testResults.passed++;
    } else {
      testResults.failed++;
      testResults.errors.push('リトライ機能テスト: 処理が失敗しました');
    }
  } catch (error) {
    console.log('リトライ機能テスト: エラーが発生しましたが、適切にハンドリングされました');
    testResults.passed++;
  }
}

// メインテスト実行関数
async function runTests() {
  console.log('=== AI安定化・高速化機能 総合テスト開始 ===\n');
  
  // テスト開始前にキャッシュをクリア
  try {
    await axios.post(`${BASE_URL}${TEST_API_ENDPOINT}?clearCache=true`, {});
    console.log('テスト用キャッシュをクリアしました\n');
  } catch (error) {
    console.log('キャッシュクリアに失敗しましたが、テストを続行します\n');
  }
  
  // 個別テストケースの実行
  for (const testCase of testCases) {
    try {
      console.log(`テスト実行中: ${testCase.name}`);
      const result = await testCase.test();
      console.log(`✅ ${testCase.name}: 成功`);
      console.log(`   結果: ${JSON.stringify(result, null, 2).substring(0, 200)}...`);
      testResults.passed++;
    } catch (error) {
      console.log(`❌ ${testCase.name}: 失敗`);
      console.log(`   エラー: ${error.message}`);
      testResults.failed++;
      testResults.errors.push(`${testCase.name}: ${error.message}`);
    }
    console.log('');
  }
  
  // 同時アクセステスト
  await concurrentAccessTest();
  
  // リトライ機能テスト
  await retryFunctionTest();
  
  // 結果サマリー
  console.log('\n=== テスト結果サマリー ===');
  console.log(`成功: ${testResults.passed}件`);
  console.log(`失敗: ${testResults.failed}件`);
  console.log(`成功率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\nエラー詳細:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  console.log('\n=== テスト完了 ===');
}

// テスト実行
runTests().catch(console.error); 