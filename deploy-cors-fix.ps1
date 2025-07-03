# Script para fazer deploy com correções de CORS

Write-Host "🚀 Fazendo deploy do backend com correções de CORS..." -ForegroundColor Green

# Verificar se estamos no diretório correto
if (!(Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script no diretório do backend" -ForegroundColor Red
    exit 1
}

# Fazer commit das mudanças
Write-Host "📝 Fazendo commit das mudanças..." -ForegroundColor Yellow
git add .
git commit -m "Fix CORS configuration and add debug endpoints"

# Fazer push para triggerar o deploy do Railway
Write-Host "🚀 Fazendo push para o Railway..." -ForegroundColor Yellow
git push origin main

Write-Host "✅ Deploy iniciado!" -ForegroundColor Green
Write-Host "🔍 Aguarde alguns minutos e teste:" -ForegroundColor Cyan
Write-Host "   - https://essencialpay-form-backend-production.up.railway.app/health"
Write-Host "   - https://essencialpay-form-backend-production.up.railway.app/debug/env"
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Verificar se as variáveis de ambiente estão corretas no Railway"
Write-Host "2. Configurar FRONTEND_URL e CORS_ALLOWED_ORIGINS"
Write-Host "3. Testar o CORS novamente"

# Aguardar um pouco e testar
Write-Host "`n⏳ Aguardando 30 segundos para o deploy..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "`n🧪 Testando endpoint de debug..." -ForegroundColor Yellow
try {
    $debugResponse = Invoke-RestMethod -Uri "https://essencialpay-form-backend-production.up.railway.app/debug/env" -Method Get
    Write-Host "✅ Variáveis de ambiente:" -ForegroundColor Green
    $debugResponse.environment | Format-List
} catch {
    Write-Host "❌ Erro ao testar endpoint de debug: $($_.Exception.Message)" -ForegroundColor Red
}
