# InstaDish v2 専用停止スクリプト
# 作成日: 2025-07-09

Write-Host "=== InstaDish v2 停止スクリプト ===" -ForegroundColor Red

# 1. ポート3001を使用中のプロセス確認
Write-Host "ポート3001の使用状況を確認中..." -ForegroundColor Yellow
$port3001Process = netstat -ano | Select-String ":3001"

if ($port3001Process) {
    Write-Host "ポート3001使用中のプロセス:" -ForegroundColor Red
    Write-Host $port3001Process
    
    # プロセスIDを抽出
    $processIds = $port3001Process | ForEach-Object {
        ($_ -split '\s+')[-1]
    }
    
    foreach ($processId in $processIds) {
        if ($processId -match '^\d+$') {
            try {
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "プロセス終了中: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
                    Stop-Process -Id $processId -Force
                }
            }
            catch {
                Write-Host "プロセス $processId は既に終了済みです" -ForegroundColor Gray
            }
        }
    }
} else {
    Write-Host "ポート3001は使用されていません" -ForegroundColor Green
}

# 2. InstaDish関連のNode.jsプロセスを確認・終了
Write-Host "Node.jsプロセスを確認中..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Node.jsプロセス一覧:" -ForegroundColor Red
    $nodeProcesses | Format-Table Id, ProcessName, StartTime, Path
    
    $confirm = Read-Host "すべてのNode.jsプロセスを終了しますか？ (y/N)"
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        Stop-Process -Name "node" -Force
        Write-Host "すべてのNode.jsプロセスを終了しました" -ForegroundColor Green
    }
} else {
    Write-Host "Node.jsプロセスは実行されていません" -ForegroundColor Green
}

# 3. キャッシュクリア（オプション）
$clearCache = Read-Host "Next.jsキャッシュをクリアしますか？ (y/N)"
if ($clearCache -eq "y" -or $clearCache -eq "Y") {
    Set-Location "C:\Users\asanu\Documents\Sources\instadish_v2"
    if (Test-Path ".next") {
        Remove-Item -Recurse -Force ".next"
        Write-Host ".nextディレクトリを削除しました" -ForegroundColor Green
    }
    if (Test-Path "node_modules/.cache") {
        Remove-Item -Recurse -Force "node_modules/.cache"
        Write-Host "node_modules/.cacheを削除しました" -ForegroundColor Green
    }
}

Write-Host "InstaDish v2 停止処理が完了しました" -ForegroundColor Green 