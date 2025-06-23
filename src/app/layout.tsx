import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'InstaDish Pro - 飲食店専用AI画像加工サービス',
  description: '料理写真を美味しそうに加工し、SNS投稿用のキャプションとハッシュタグを自動生成するAIサービス',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
} 