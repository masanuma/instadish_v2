import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <title>InstaDish Pro</title>
      </head>
      <body>{children}</body>
    </html>
  )
} 