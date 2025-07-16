import React from 'react'
import Link from 'next/link'

export default function PrivacyPage() {
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
            <span className="text-gray-900">プライバシーポリシー</span>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-sm text-gray-600 mb-8">
                最終更新日：2025年7月15日<br />
                施行日：2025年7月15日
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第1条（個人情報の定義）</h2>
                <p className="mb-4">
                  本プライバシーポリシーにおいて、「個人情報」とは、個人情報の保護に関する法律にいう「個人情報」を指すものとし、
                  生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により
                  特定の個人を識別できる情報及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から
                  特定の個人を識別できる情報（個人識別情報）を指します。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第2条（個人情報の収集方法）</h2>
                <p className="mb-4">
                  当社は、利用者が利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレス、銀行口座番号、
                  クレジットカード番号、運転免許証番号などの個人情報をお尋ねすることがあります。
                  また、利用者と提携先などとの間でなされた利用者の個人情報を含む取引記録や決済に関する情報を、
                  当社の提携先（情報提供元、広告主、広告配信先などを含みます。以下、「提携先」といいます。）などから
                  収集することがあります。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第3条（個人情報を収集・利用する目的）</h2>
                <p className="mb-4">当社が個人情報を収集・利用する目的は、以下のとおりです。</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>当社サービスの提供・運営のため</li>
                  <li>利用者からのお問い合わせに回答するため（本人確認を行うことを含む）</li>
                  <li>利用者が利用中のサービスの新機能、更新情報、キャンペーン等及び当社が提供する他のサービスの案内のメールを送付するため</li>
                  <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
                  <li>利用規約に違反した利用者や、不正・不当な目的でサービスを利用しようとする利用者の特定をし、ご利用をお断りするため</li>
                  <li>利用者にご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
                  <li>有料サービスにおいて、利用者に利用料金を請求するため</li>
                  <li>上記の利用目的に付随する目的</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第4条（利用目的の変更）</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>当社は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。</li>
                  <li>利用目的の変更を行った場合には、変更後の目的について、当社所定の方法により、利用者に通知し、または本ウェブサイト上に公表するものとします。</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第5条（個人情報の第三者提供）</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>当社は、次に掲げる場合を除いて、あらかじめ利用者の同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                      <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                      <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
                      <li>予め次の事項を告知あるいは公表し、かつ当社が個人情報保護委員会に届出をしたとき
                        <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                          <li>利用目的に第三者への提供を含むこと</li>
                          <li>第三者に提供されるデータの項目</li>
                          <li>第三者への提供の手段または方法</li>
                          <li>本人の求めに応じて個人情報の第三者への提供を停止すること</li>
                          <li>本人の求めを受け付ける方法</li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                  <li>前項の定めにかかわらず、次に掲げる場合には、当該情報の提供先は第三者に該当しないものとします。
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li>当社が利用目的の達成に必要な範囲内において個人情報の取扱いの全部または一部を委託する場合</li>
                      <li>合併その他の事由による事業の承継に伴って個人情報が提供される場合</li>
                      <li>個人情報を特定の者との間で共同して利用する場合であって、その旨並びに共同して利用される個人情報の項目、共同して利用する者の範囲、利用する者の利用目的および当該個人情報の管理について責任を有する者の氏名または名称について、あらかじめ本人に通知し、または本人が容易に知り得る状態に置いた場合</li>
                    </ul>
                  </li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第6条（個人情報の開示）</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>当社は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、開示しない決定をした場合には、その旨を遅滞なく通知します。なお、個人情報の開示に際しては、1件あたり1,000円の手数料を申し受けます。
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li>本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合</li>
                      <li>当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合</li>
                      <li>その他法令に違反することとなる場合</li>
                    </ul>
                  </li>
                  <li>前項の定めにかかわらず、履歴情報および特性情報などの個人情報以外の情報については、原則として開示いたしません。</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第7条（個人情報の訂正および削除）</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>利用者は、当社の保有する自己の個人情報が誤った情報である場合には、当社が定める手続きにより、当社に対して個人情報の訂正、追加または削除（以下、「訂正等」といいます。）を求めることができます。</li>
                  <li>当社は、利用者から前項の請求を受けてその請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の訂正等を行うものとします。</li>
                  <li>当社は、前項の規定に基づき訂正等を行った場合、または訂正等を行わない旨の決定をしたときは遅滞なく、これを利用者に通知します。</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第8条（個人情報の利用停止等）</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>当社は、本人から、個人情報が、利用目的の範囲を超えて取り扱われているという理由、または不正の手段により取得されたものであるという理由により、その利用の停止または消去（以下、「利用停止等」といいます。）を求められた場合には、遅滞なく必要な調査を行います。</li>
                  <li>前項の調査結果に基づき、その請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の利用停止等を行います。</li>
                  <li>当社は、前項の規定に基づき利用停止等を行った場合、または利用停止等を行わない旨の決定をしたときは、遅滞なく、これを利用者に通知します。</li>
                  <li>前2項にかかわらず、利用停止等に多額の費用を有する場合その他利用停止等を行うことが困難な場合であって、利用者の権利利益を保護するために必要なこれに代わるべき措置をとれる場合は、この代替策を講じるものとします。</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第9条（Cookie及び類似技術）</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>当社サービスでは、利用者により良いサービスを提供するため、Cookie及び類似の技術を使用することがあります。</li>
                  <li>Cookie等により個人を特定できる情報を取得することはありません。</li>
                  <li>利用者はブラウザの設定によりCookieを無効にすることが可能ですが、その場合サービスの一部機能がご利用いただけなくなることがあります。</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第10条（プライバシーポリシーの変更）</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、利用者に通知することなく、変更することができるものとします。</li>
                  <li>当社が別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第11条（第三者サービスの利用）</h2>
                <p className="mb-4">当社は、サービス提供のため以下の第三者サービスを利用しております。</p>
                <ul className="list-disc list-inside ml-6 space-y-2">
                  <li><strong>Stripe</strong>: 決済処理サービス - 個人情報は適切に暗号化され、厳格なセキュリティ基準の下で処理されます</li>
                  <li><strong>Supabase</strong>: データベースサービス - ユーザーデータの安全な保存・管理のため利用</li>
                  <li><strong>OpenAI</strong>: AI画像処理サービス - アップロードされた画像の処理・分析のため利用</li>
                </ul>
                <p className="mt-4">
                  これらのサービスは、それぞれ独自のプライバシーポリシーに基づいて個人情報を取り扱います。
                  詳細は各サービスのプライバシーポリシーをご確認ください。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第12条（データの保存期間）</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>アカウント情報：アカウント削除まで保存</li>
                  <li>決済情報：法律で定められた期間（7年間）保存</li>
                  <li>アップロード画像：処理完了後30日間で自動削除</li>
                  <li>ログ情報：6ヶ月間保存後自動削除</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第13条（セキュリティ対策）</h2>
                <p className="mb-4">当社は、個人情報の保護のため以下のセキュリティ対策を講じています。</p>
                <ul className="list-disc list-inside ml-6 space-y-2">
                  <li>SSL/TLS暗号化による通信の保護</li>
                  <li>アクセス制御によるデータベースの保護</li>
                  <li>定期的なセキュリティ監査の実施</li>
                  <li>従業員への定期的なセキュリティ教育</li>
                  <li>侵入検知システムの導入</li>
                </ul>
              </section>

              <div className="border-t pt-8 mt-12">
                <h3 className="text-lg font-semibold mb-4">お問い合わせ</h3>
                <p className="text-gray-600">
                  本ポリシーに関するお問い合わせ、個人情報の開示・訂正・削除等のご請求は、以下までご連絡ください。<br />
                  <br />
                  InstaDish Pro 運営事務局<br />
                  個人情報保護責任者：淺沼 征史<br />
                  メール：asanuma.works@gmail.com<br />
                  受付時間：平日 9:00-18:00
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}