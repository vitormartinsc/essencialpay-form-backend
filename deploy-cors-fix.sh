#!/bin/bash

echo "🚀 Fazendo deploy do backend com correções de CORS..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório do backend"
    exit 1
fi

# Fazer commit das mudanças
echo "📝 Fazendo commit das mudanças..."
git add .
git commit -m "Fix CORS configuration and add debug endpoints"

# Fazer push para triggerar o deploy do Railway
echo "🚀 Fazendo push para o Railway..."
git push origin main

echo "✅ Deploy iniciado!"
echo "🔍 Aguarde alguns minutos e teste:"
echo "   - https://essencialpay-form-backend-production.up.railway.app/health"
echo "   - https://essencialpay-form-backend-production.up.railway.app/debug/env"
echo ""
echo "📋 Próximos passos:"
echo "1. Verificar se as variáveis de ambiente estão corretas no Railway"
echo "2. Configurar FRONTEND_URL e CORS_ALLOWED_ORIGINS"
echo "3. Testar o CORS novamente"
