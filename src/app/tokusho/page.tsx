import React from 'react'
import Link from 'next/link'

export default function TokushoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-orange-600">
              ホーム
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-900">販売条件・返金ポリシー</span>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">販売条件・返金ポリシー</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-sm text-gray-600 mb-8">
                最終更新日：2025年7月16日
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <p className="text-blue-800 text-sm">
                  <strong>注記：</strong>当サービスは現在開発・準備段階にあり、まだ売上実績がないため、
                  特定商取引法の適用対象外です。以下の情報は、将来的なサービス提供に向けた
                  任意の情報開示として記載しています。
                </p>
              </div>

              <div className="grid gap-8">
                <section className="border-l-4 border-blue-500 pl-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">事業者情報</h2>
                  <div className="text-gray-700 space-y-2">
                    <p><strong>事業者名：</strong>アサヌマワークス（個人事業主）</p>
                    <p><strong>事業主：</strong>淺沼 征史</p>
                    <p><strong>所在地：</strong>〒160-0005 東京都新宿区愛住町9-4-201101号室</p>
                    <p><strong>連絡先：</strong>asanuma.works@gmail.com</p>
                    <p><strong>対応時間：</strong>平日 9:00～18:00（メールのみ）</p>
                  </div>
                </section>

                <section className="border-l-4 border-blue-500 pl-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">サービス・料金</h2>
                  <div className="text-gray-700">
                    <h3 className="font-semibold mb-2">InstaDish Pro ベーシックプラン</h3>
                    <ul className="list-disc list-inside space-y-1 mb-4">
                      <li>AI画像加工機能</li>
                      <li>AIキャプション自動生成</li>
                      <li>ハッシュタグ提案機能</li>
                      <li>店舗情報管理機能</li>
                      <li>カスタマーサポート</li>
                    </ul>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p><strong>料金：</strong>月額5,000円（税込）</p>
                      <p><strong>無料期間：</strong>14日間</p>
                      <p><strong>支払方法：</strong>クレジットカード（Stripe経由）</p>
                      <p><strong>課金タイミング：</strong>無料期間終了後、毎月同日</p>
                    </div>
                  </div>
                </section>

                <section className="border-l-4 border-blue-500 pl-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">解約・返金ポリシー</h2>
                  <div className="text-gray-700">
                    <h3 className="font-semibold mb-2">解約について</h3>
                    <ul className="list-disc list-inside space-y-1 mb-4">
                      <li>いつでも解約可能です</li>
                      <li>ダッシュボードまたはメールにて受付</li>
                      <li>解約完了後、次回課金日から停止</li>
                      <li>日割り計算による返金は行いません</li>
                    </ul>

                    <h3 className="font-semibold mb-2">返金について</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>原則として返金は行いません</li>
                      <li>ただし、以下の場合は返金対象となります：</li>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                        <li>システム障害により1週間以上利用できない場合</li>
                        <li>当方の責による重大な課金エラーが発生した場合</li>
                      </ul>
                      <li>返金を希望される場合は、メールにてご連絡ください</li>
                    </ul>
                  </div>
                </section>

                <section className="border-l-4 border-blue-500 pl-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">サービス提供について</h2>
                  <div className="text-gray-700">
                    <h3 className="font-semibold mb-2">提供方法</h3>
                    <p>インターネット経由でのオンラインサービス提供</p>
                    
                    <h3 className="font-semibold mb-2 mt-4">利用環境</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>インターネット接続必須</li>
                      <li>推奨ブラウザ：Chrome、Firefox、Safari、Edge（最新版）</li>
                      <li>JavaScript有効</li>
                    </ul>

                    <h3 className="font-semibold mb-2 mt-4">免責事項</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>天災、不可抗力による損害</li>
                      <li>お客様の環境に起因する問題</li>
                      <li>AI処理結果の品質保証は行いません</li>
                    </ul>
                  </div>
                </section>

                <section className="border-l-4 border-blue-500 pl-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">個人情報の取扱い</h2>
                  <div className="text-gray-700">
                    <p>
                      お客様の個人情報の取扱いについては、
                      <a href="/privacy" className="text-blue-600 hover:underline">プライバシーポリシー</a>
                      をご確認ください。
                    </p>
                    <p className="mt-2 text-sm">
                      ※ 当事業は個人情報保護法の適用対象外ですが、
                      適切な情報管理に努めています。
                    </p>
                  </div>
                </section>

                <section className="border-l-4 border-blue-500 pl-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">お問い合わせ・苦情対応</h2>
                  <div className="text-gray-700">
                    <h3 className="font-semibold mb-2">サポート窓口</h3>
                    <p>
                      InstaDish Pro サポート<br />
                      メール：asanuma.works@gmail.com<br />
                      対応時間：平日 9:00～18:00<br />
                      ※ 電話でのお問い合わせは承っておりません
                    </p>
                    
                    <h3 className="font-semibold mb-2 mt-4">対応方針</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>48時間以内の初回返信を目標とします</li>
                      <li>技術的問題については詳細調査後回答いたします</li>
                      <li>ご要望・改善提案も積極的に受け付けています</li>
                    </ul>
                  </div>
                </section>
              </div>

              <div className="border-t pt-8 mt-12">
                <h3 className="text-lg font-semibold mb-4">重要事項</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>サービス開始時期について：</strong><br />
                    InstaDish Proは現在開発段階にあり、正式なサービス開始時期は未定です。
                    本格運用開始時には、あらためて利用規約や販売条件について
                    最新情報をお知らせいたします。
                  </p>
                </div>
                
                <p className="text-gray-600 mt-4">
                  販売条件に関するお問い合わせ：<br />
                  メール：asanuma.works@gmail.com<br />
                  対応時間：平日 9:00-18:00（土日祝日を除く）
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 