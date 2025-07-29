/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 14以降では app directory はデフォルトで有効
  experimental: {
    // ビルド時のAPIルート事前レンダリングを無効化
    serverComponentsExternalPackages: ['openai']
  },
  // APIルートの静的解析を制限
  staticPageGenerationTimeout: 60,
}

module.exports = nextConfig 