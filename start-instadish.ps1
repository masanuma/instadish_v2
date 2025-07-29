# InstaDish v2 専用起動スクリプト
# 作成日: 2025-07-09

Write-Host "=== InstaDish v2 起動スクリプト ===" -ForegroundColor Green

# 1. プロジェクトディレクトリに移動
Set-Location "C:\Users\asanu\Documents\Sources\instadish_v2"
Write-Host "プロジェクトディレクトリ: $(Get-Location)" -ForegroundColor Yellow

# 2. 既存のNode.jsプロセス確認
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "既存のNode.jsプロセスを発見:" -ForegroundColor Red
    $nodeProcesses | Format-Table Id, ProcessName, StartTime
    
    $confirm = Read-Host "既存プロセスを終了しますか？ (y/N)"
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        Stop-Process -Name "node" -Force
        Write-Host "Node.jsプロセスを終了しました" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
}

# 3. ポート3001の使用状況確認
$portCheck = netstat -ano | Select-String ":3001"
if ($portCheck) {
    Write-Host "ポート3001が使用中です:" -ForegroundColor Red
    Write-Host $portCheck
    exit 1
}

# 4. 環境変数確認
if (-not (Test-Path ".env.local")) {
    Write-Host "警告: .env.localファイルが見つかりません" -ForegroundColor Red
}

# 5. 依存関係確認
if (-not (Test-Path "node_modules")) {
    Write-Host "依存関係をインストール中..." -ForegroundColor Yellow
    npm install
}

# 6. 開発サーバー起動
Write-Host "InstaDish v2 開発サーバーを起動中... (ポート: 3001)" -ForegroundColor Green
Write-Host "URL: http://localhost:3001" -ForegroundColor Cyan
Write-Host "管理画面: http://localhost:3001/admin/login" -ForegroundColor Cyan

npm run dev 