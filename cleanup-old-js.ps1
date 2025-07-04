# Script PowerShell para limpar arquivos JS antigos

Write-Host "🧹 Limpando arquivos JS antigos..." -ForegroundColor Yellow

# Remover arquivos JS transpilados na pasta src (manter apenas arquivos TS)
if (Test-Path "src/index.js") {
    Remove-Item "src/index.js" -Force
    Write-Host "📁 Removido: src/index.js" -ForegroundColor Green
}

if (Test-Path "src/utils/s3Upload.js") {
    Remove-Item "src/utils/s3Upload.js" -Force
    Write-Host "📁 Removido: src/utils/s3Upload.js" -ForegroundColor Green
}

if (Test-Path "src/utils/kommo.js") {
    Remove-Item "src/utils/kommo.js" -Force
    Write-Host "📁 Removido: src/utils/kommo.js (versão antiga)" -ForegroundColor Green
}

if (Test-Path "src/config/aws.js") {
    Remove-Item "src/config/aws.js" -Force
    Write-Host "📁 Removido: src/config/aws.js" -ForegroundColor Green
}

Write-Host "✅ Limpeza concluída!" -ForegroundColor Green
Write-Host "📋 Arquivos mantidos:" -ForegroundColor Cyan
Write-Host "  - src/server.js (para compatibilidade)" -ForegroundColor White
Write-Host "  - dist/* (arquivos compilados)" -ForegroundColor White
Write-Host "  - src/*.ts (codigo fonte TypeScript)" -ForegroundColor White
