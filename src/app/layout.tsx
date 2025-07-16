import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'InstaDish Pro - 飲食店専用AI画像加工サービス',
  description: '料理写真を美味しそうに加工し、SNS投稿用のキャプションとハッシュタグを自動生成するAIサービス',
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 会社情報 */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">InstaDish Pro</h3>
            <p className="text-gray-300 mb-4">
              飲食店専用AI画像加工サービス<br />
              料理写真を美味しそうに加工し、SNS投稿を最適化
            </p>
            <div className="text-gray-400 text-sm">
              <p>アサヌマワークス（個人事業主）</p>
              <p>〒160-0005 東京都新宿区愛住町9-4</p>
              <p>Email: asanuma.works@gmail.com</p>
            </div>
          </div>

          {/* サービス */}
          <div>
            <h4 className="text-md font-semibold mb-4">サービス</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/pricing" className="hover:text-white transition-colors">料金プラン</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">新規登録</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">ログイン</Link></li>
            </ul>
          </div>

          {/* 法的情報・会社情報 */}
          <div>
            <h4 className="text-md font-semibold mb-4">会社・法的情報</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/company" className="hover:text-white transition-colors">事業者情報</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">利用規約</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link></li>
              <li><Link href="/tokusho" className="hover:text-white transition-colors">販売条件・返金ポリシー</Link></li>
            </ul>
          </div>
        </div>

        {/* コピーライト */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 アサヌマワークス（個人事業主）. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <div className="min-h-screen flex flex-col">
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
} 