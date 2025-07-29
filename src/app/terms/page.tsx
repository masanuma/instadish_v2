import React from 'react'
import Link from 'next/link'

export default function TermsPage() {
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
            <span className="text-gray-900">利用規約</span>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">利用規約</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-sm text-gray-600 mb-8">
                最終更新日：2025年7月15日<br />
                施行日：2025年7月15日
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第1条（適用）</h2>
                <p className="mb-4">
                  本利用規約（以下「本規約」といいます。）は、InstaDish Pro（以下「本サービス」といいます。）の利用条件を定めるものです。
                  本サービスをご利用になる方（以下「利用者」といいます。）には、本規約に従って、本サービスをご利用いただきます。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第2条（利用登録）</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>本サービスの利用を希望する者は、本規約に同意の上、当社の定める方法によって利用登録を申請するものとします。</li>
                  <li>当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあります。
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                      <li>本規約に違反したことがある者からの申請である場合</li>
                      <li>その他、当社が利用登録を相当でないと判断した場合</li>
                    </ul>
                  </li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第3条（利用料金及び支払方法）</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>利用者は、本サービスの有料プランの対価として、別途当社が定め、本ウェブサイトに表示する利用料金を、当社が指定する方法により支払うものとします。</li>
                  <li>利用者は、初回利用から14日間の無料トライアル期間を利用できます。</li>
                  <li>無料トライアル期間終了後は、自動的に有料プランに移行し、月額利用料金の請求が開始されます。</li>
                  <li>利用料金の支払を遅滞した場合には、利用者は年14.6％の割合による遅延損害金を支払うものとします。</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第4条（禁止事項）</h2>
                <p className="mb-4">利用者は、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>法令または公序良俗に違反する行為</li>
                  <li>犯罪行為に関連する行為</li>
                  <li>当社、ほかの利用者、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                  <li>当社のサービスの運営を妨害するおそれのある行為</li>
                  <li>他の利用者に関する個人情報等を収集または蓄積する行為</li>
                  <li>不正アクセスをし、またはこれを試みる行為</li>
                  <li>他の利用者に成りすます行為</li>
                  <li>当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
                  <li>その他、当社が不適切と判断する行為</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第5条（本サービスの提供の停止等）</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>当社は、以下のいずれかの事由があると判断した場合、利用者に事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                      <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                      <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                      <li>その他、当社が本サービスの提供が困難と判断した場合</li>
                    </ul>
                  </li>
                  <li>当社は、本サービスの提供の停止または中断により、利用者または第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第6条（著作権）</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>利用者は、自ら著作権等の必要な知的財産権を有する、または必要な権利者の許諾を得た文章、画像や映像等の情報に関してのみ、本サービスを利用することができるものとします。</li>
                  <li>利用者が本サービスを利用して投稿ないし送信する文章、画像、映像等について、当社は、本サービスの改良、品質の向上、または不備の補正等とそれらに関する研究開発を目的として、利用、複製、修正、翻案、配布、譲渡、貸与、翻訳、二次的著作物の作成等をすることができるものとします。</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第7条（利用制限および登録抹消）</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>当社は、利用者が以下のいずれかに該当する場合には、事前の通知なく、投稿データを削除し、利用者に対して本サービスの全部もしくは一部の利用を制限しまたは利用者としての登録を抹消することができるものとします。
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li>本規約のいずれかの条項に違反した場合</li>
                      <li>登録事項に虚偽の事実があることが判明した場合</li>
                      <li>料金等の支払債務の不履行があった場合</li>
                      <li>当社からの連絡に対し、一定期間返答がない場合</li>
                      <li>本サービスについて、最後の利用から一定期間利用がない場合</li>
                      <li>その他、当社が本サービスの利用を適当でないと判断した場合</li>
                    </ul>
                  </li>
                  <li>前項各号のいずれかに該当した場合、利用者は、当然に当社に対する一切の債務について期限の利益を失い、その時点において負担する一切の債務を直ちに一括して弁済しなければなりません。</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第8条（退会）</h2>
                <p className="mb-4">
                  利用者は、当社の定める退会手続により、本サービスから退会できるものとします。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第9条（保証の否認および免責事項）</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。</li>
                  <li>当社は、本サービスに起因して利用者に生じたあらゆる損害について、当社の故意又は重過失による場合を除き、一切の責任を負いません。ただし、本サービスに関する当社と利用者との間の契約（本規約を含みます。）が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。</li>
                  <li>前項ただし書に定める場合であっても、当社は、当社の過失（重過失を除きます。）による債務不履行または不法行為により利用者に生じた損害のうち特別な事情から生じた損害（当社または利用者が損害発生につき予見し、または予見し得た場合を含みます。）について一切の責任を負いません。また、当社の過失（重過失を除きます。）による債務不履行または不法行為により利用者に生じた損害の賠償は、利用者から当該損害が発生した月に受領した利用料の額を上限とします。</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第10条（サービス内容の変更等）</h2>
                <p className="mb-4">
                  当社は、利用者への事前の告知をもって、本サービスの内容を変更、追加または廃止することがあり、利用者はこれに同意するものとします。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第11条（利用規約の変更）</h2>
                <p className="mb-4">
                  当社は以下の場合には、利用者の個別の同意を要せず、本規約を変更することができるものとします。
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>本規約の変更が、利用者の一般の利益に適合するとき。</li>
                  <li>本規約の変更が、本サービス利用契約の目的に反せず、かつ、変更の必要性、変更後の内容の相当性その他の変更に係る事情に照らして合理的なものであるとき。</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第12条（個人情報の取扱い）</h2>
                <p className="mb-4">
                  当社は、本サービスの利用によって取得する個人情報については、当社「プライバシーポリシー」に従い適切に取り扱うものとします。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第13条（通知または連絡）</h2>
                <p className="mb-4">
                  利用者と当社との間の通知または連絡は、当社の定める方法によって行うものとします。当社は、利用者から、当社が別途定める方式に従った変更届け出がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは、発信時に利用者へ到達したものとみなします。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第14条（権利義務の譲渡の禁止）</h2>
                <p className="mb-4">
                  利用者は、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">第15条（準拠法・裁判管轄）</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
                  <li>本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。</li>
                </ol>
              </section>

              <div className="border-t pt-8 mt-12">
                <h3 className="text-lg font-semibold mb-4">お問い合わせ</h3>
                <p className="text-gray-600">
                  本規約に関するお問い合わせは、以下までご連絡ください。<br />
                  InstaDish Pro 運営事務局<br />
                  メール：asanuma.works@gmail.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}