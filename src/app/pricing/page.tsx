import React from 'react'
import Link from 'next/link'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 text-orange-600 hover:text-orange-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-semibold">InstaDish Pro</span>
              </Link>
            </div>
            <nav className="hidden md:flex space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                ホーム
              </Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium bg-gray-100">
                料金プラン
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                ログイン
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* パンくずリスト */}
      <div className="bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-orange-600">
              ホーム
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-900">料金プラン</span>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ヘッダー */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">料金プラン</h1>
            <p className="text-xl text-gray-600 mb-8">
              シンプルで透明性のある料金体系。<br />
              14日間の無料トライアルで、まずはお試しください。
            </p>
            <div className="bg-green-100 text-green-800 py-2 px-4 rounded-lg inline-block">
              ✨ 初回14日間無料トライアル実施中！
            </div>
          </div>

          {/* プランカード */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center">
                <h2 className="text-3xl font-bold mb-2">ベーシックプラン</h2>
                <p className="text-blue-100 mb-6">飲食店向けInstagram画像最適化サービス</p>
                
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">¥5,000</div>
                  <div className="text-blue-100">月額（税込）</div>
                </div>
              </div>

              <div className="p-8">
                {/* 無料トライアル情報 */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">🎯 14日間無料トライアル</h3>
                  <ul className="text-yellow-700 space-y-1">
                    <li>• 登録後すぐに全機能を無料でお試し</li>
                    <li>• クレジットカード登録必要（トライアル中は課金されません）</li>
                    <li>• いつでも解約可能</li>
                    <li>• トライアル終了3日前にメール通知</li>
                  </ul>
                </div>

                {/* 機能一覧 */}
                <h3 className="text-xl font-semibold text-gray-900 mb-6">含まれる機能</h3>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">AI画像自動最適化</h4>
                        <p className="text-gray-600 text-sm">照明・色彩・構図を自動調整</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">AI魅力的キャプション生成</h4>
                        <p className="text-gray-600 text-sm">料理の特徴を分析した投稿文作成</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">最適ハッシュタグ提案</h4>
                        <p className="text-gray-600 text-sm">リーチ拡大に効果的なタグを自動選択</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">処理履歴管理</h4>
                        <p className="text-gray-600 text-sm">過去の加工履歴をいつでも確認</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">店舗情報カスタマイズ</h4>
                        <p className="text-gray-600 text-sm">店舗固有の情報で投稿をパーソナライズ</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">メールサポート</h4>
                        <p className="text-gray-600 text-sm">平日9:00-18:00サポート対応</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                  <Link 
                    href="/register" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition duration-200 inline-block"
                  >
                    14日間無料で始める
                  </Link>
                  <p className="text-sm text-gray-500 mt-3">
                    クレジットカード必要 • いつでも解約可能
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 課金・支払い情報 */}
          <div className="max-w-4xl mx-auto mt-16 bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">💳 お支払いについて</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">支払方法</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• クレジットカード決済のみ</li>
                  <li>• Visa、MasterCard、AMEX、JCB、Diners対応</li>
                  <li>• 安全なStripe決済システム使用</li>
                  <li>• 暗号化通信で情報保護</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">課金タイミング</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• 無料トライアル終了時に初回課金</li>
                  <li>• その後は毎月同日に自動課金</li>
                  <li>• 課金日の3日前にメール通知</li>
                  <li>• いつでも解約可能（即日停止）</li>
                </ul>
              </div>
            </div>
          </div>

          {/* よくある質問 */}
          <div className="max-w-4xl mx-auto mt-16 bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">❓ よくある質問</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">無料トライアル中に解約した場合、料金は発生しますか？</h3>
                <p className="text-gray-600">
                  いいえ、無料トライアル期間中に解約された場合、一切料金は発生しません。
                  解約はダッシュボードからいつでも簡単に行えます。
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">月の途中で解約した場合、返金はありますか？</h3>
                <p className="text-gray-600">
                  デジタルサービスの性質上、原則として返金は行っておりません。
                  ただし、解約後も月末まではサービスをご利用いただけます。
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">処理できる画像に制限はありますか？</h3>
                <p className="text-gray-600">
                  ベーシックプランでは処理回数に制限はありません。
                  ただし、ファイルサイズは1枚あたり10MBまでとなります。
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">領収書は発行されますか？</h3>
                <p className="text-gray-600">
                  はい、Stripeから自動で領収書が発行され、登録メールアドレスに送信されます。
                  ダッシュボードからもダウンロード可能です。
                </p>
              </div>
            </div>
          </div>

          {/* 法的情報リンク */}
          <div className="max-w-4xl mx-auto mt-16 text-center text-gray-600">
            <p className="mb-4">
              サービス利用にあたっては、以下をご確認ください：
            </p>
            <div className="space-x-6">
              <Link href="/terms" className="text-blue-600 hover:underline">利用規約</Link>
              <Link href="/privacy" className="text-blue-600 hover:underline">プライバシーポリシー</Link>
              <Link href="/tokusho" className="text-blue-600 hover:underline">販売条件・返金ポリシー</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}