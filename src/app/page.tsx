export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            InstaDish Pro
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            飲食店専用AI画像加工サービス
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">サービス準備中</h2>
            <p className="text-gray-600 mb-4">
              料理写真を美味しそうに加工し、SNS投稿用のキャプションとハッシュタグを自動生成するAIサービスです。
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800">
                現在、サービスの準備を進めております。<br />
                もうしばらくお待ちください。
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 