import React from 'react'
import Link from 'next/link'

export default function CompanyPage() {
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
            <span className="text-gray-900">事業者情報</span>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">事業者情報</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-sm text-gray-600 mb-8">
                最終更新日：2025年7月16日
              </p>

              <div className="grid gap-8">
                {/* 事業者概要 */}
                <section className="border-l-4 border-orange-500 pl-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">事業者概要</h2>
                  <div className="overflow-hidden">
                    <table className="w-full">
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-3 text-sm font-medium text-gray-900 w-32">屋号</td>
                          <td className="py-3 text-sm text-gray-700">アサヌマワークス</td>
                        </tr>
                        <tr>
                          <td className="py-3 text-sm font-medium text-gray-900">事業主</td>
                          <td className="py-3 text-sm text-gray-700">淺沼 征史</td>
                        </tr>
                        <tr>
                          <td className="py-3 text-sm font-medium text-gray-900">事業形態</td>
                          <td className="py-3 text-sm text-gray-700">個人事業主</td>
                        </tr>
                        <tr>
                          <td className="py-3 text-sm font-medium text-gray-900">開業</td>
                          <td className="py-3 text-sm text-gray-700">2024年4月1日</td>
                        </tr>
                        <tr>
                          <td className="py-3 text-sm font-medium text-gray-900">事業所得区分</td>
                          <td className="py-3 text-sm text-gray-700">青色申告事業者</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 所在地・連絡先 */}
                <section className="border-l-4 border-orange-500 pl-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">所在地・連絡先</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">事業所</h3>
                      <p className="text-gray-700">
                        〒160-0005<br />
                        東京都新宿区愛住町9-4-201101号室
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">連絡先</h3>
                      <div className="text-gray-700 space-y-1">
                        <p><strong>メール：</strong>asanuma.works@gmail.com</p>
                        <p><strong>サポート：</strong>asanuma.works@gmail.com</p>
                        <p><strong>対応時間：</strong>平日 9:00-18:00（メールのみ）</p>
                        <p className="text-sm text-gray-600 mt-2">
                          ※ 電話でのお問い合わせは承っておりません。<br />
                          　 すべてメールにてお問い合わせください。
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 事業内容 */}
                <section className="border-l-4 border-orange-500 pl-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">事業内容</h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>飲食店向けAI画像加工サービスの開発・運営</li>
                    <li>SNSマーケティング支援ツールの提供</li>
                    <li>AI技術を活用したコンテンツ生成サービス</li>
                    <li>デジタルマーケティング支援事業</li>
                    <li>ソフトウェア開発・保守</li>
                  </ul>
                </section>

                {/* 事業沿革 */}
                <section className="border-l-4 border-orange-500 pl-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">事業沿革</h2>
                  <div className="space-y-4">
                    <div className="flex">
                      <div className="w-24 text-sm font-medium text-gray-900">2024年4月</div>
                      <div className="text-sm text-gray-700">個人事業主として開業</div>
                    </div>
                    <div className="flex">
                      <div className="w-24 text-sm font-medium text-gray-900">2024年8月</div>
                      <div className="text-sm text-gray-700">InstaDish Pro サービス開発開始</div>
                    </div>
                    <div className="flex">
                      <div className="w-24 text-sm font-medium text-gray-900">2025年2月</div>
                      <div className="text-sm text-gray-700">InstaDish Pro ベータ版リリース</div>
                    </div>
                    <div className="flex">
                      <div className="w-24 text-sm font-medium text-gray-900">2025年6月</div>
                      <div className="text-sm text-gray-700">InstaDish Pro 正式版サービス開始</div>
                    </div>
                    <div className="flex">
                      <div className="w-24 text-sm font-medium text-gray-900">2025年7月</div>
                      <div className="text-sm text-gray-700">サービス機能大幅アップデート</div>
                    </div>
                  </div>
                </section>

                {/* ミッション・ビジョン */}
                <section className="border-l-4 border-orange-500 pl-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">ミッション・ビジョン</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">ミッション</h3>
                      <p className="text-gray-700">
                        AI技術を活用して、飲食店の魅力的な情報発信を支援し、
                        より多くの人に美味しい体験を提供する機会を創出します。
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">ビジョン</h3>
                      <p className="text-gray-700">
                        すべての飲食店が簡単にプロ品質のコンテンツを作成できる世界を実現し、
                        食文化の発展と地域経済の活性化に貢献します。
                      </p>
                    </div>
                  </div>
                </section>

                {/* 許可・届出 */}
                <section className="border-l-4 border-orange-500 pl-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">許可・届出</h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>個人事業主開業届出済み</li>
                    <li>青色申告承認申請済み</li>
                  </ul>
                  <p className="mt-4 text-sm text-gray-600">
                    ※ 当事業は個人情報保護法および特定商取引法の適用対象外です。
                  </p>
                </section>

                {/* 主要パートナー */}
                <section className="border-l-4 border-orange-500 pl-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">主要パートナー</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">技術パートナー</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>OpenAI（AI技術提供）</li>
                        <li>Supabase（データベース基盤）</li>
                        <li>Railway（インフラストラクチャ）</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">決済パートナー</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>Stripe（決済処理）</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 事業資金・運営 */}
                <section className="border-l-4 border-orange-500 pl-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">事業資金・運営</h2>
                  <p className="text-gray-700">
                    個人事業主として自己資金による運営を行っております。
                    必要に応じて、サービス拡大に向けた資金調達を検討しています。
                  </p>
                </section>

                {/* 社会貢献活動 */}
                <section className="border-l-4 border-orange-500 pl-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">社会貢献活動</h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>地域飲食店のデジタル化支援プログラム</li>
                    <li>スタートアップ飲食店向け無料相談会の開催</li>
                    <li>食品ロス削減を目指すSNS啓発活動</li>
                    <li>地域経済活性化への貢献</li>
                  </ul>
                </section>
              </div>

              <div className="border-t pt-8 mt-12">
                <h3 className="text-lg font-semibold mb-4">お問い合わせ</h3>
                <p className="text-gray-600">
                  事業に関するお問い合わせは、以下までご連絡ください。<br />
                  <br />
                  アサヌマワークス（個人事業主）<br />
                  事業主：淺沼 征史<br />
                  〒160-0005 東京都新宿区愛住町9-4-201101号室<br />
                  メール：asanuma.works@gmail.com<br />
                  対応時間：平日 9:00-18:00（メールのみ）<br />
                  <br />
                  ※ 電話でのお問い合わせは承っておりません。<br />
                  　 すべてメールにてお問い合わせください。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 