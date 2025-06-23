export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            InstaDish Pro
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            飲食店専用AI画像加工サービス
          </p>
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
            <p className="text-gray-600">
              料理写真を美味しそうに加工し、SNS投稿用のキャプションとハッシュタグを自動生成するAIサービスです。
            </p>
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-green-800 font-medium">
                ✅ Railway デプロイ成功！
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 