# UTF-8文字コードでテストを実行するPowerShellスクリプト

# 出力文字コードをUTF-8に設定
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=== AI安定化・高速化機能 総合テスト開始（UTF-8） ===" -ForegroundColor Green

# テスト実行
node test-ai-stability.js

Write-Host "=== テスト完了 ===" -ForegroundColor Green 