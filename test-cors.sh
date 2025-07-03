#!/bin/bash

echo "🧪 Testando CORS do Backend Railway..."

# Health check
echo "1. Testando Health Check..."
curl -s https://essencialpay-form-backend-production.up.railway.app/health | jq .

echo ""
echo "2. Testando CORS com Origin www.essencialpay.com.br..."

# Teste de CORS
curl -s -H "Origin: https://www.essencialpay.com.br" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://essencialpay-form-backend-production.up.railway.app/api/cep/30140080 \
     -w "\nStatus: %{http_code}\n" \
     -D -

echo ""
echo "3. Testando requisição GET com Origin..."

curl -s -H "Origin: https://www.essencialpay.com.br" \
     -X GET \
     https://essencialpay-form-backend-production.up.railway.app/api/cep/30140080 \
     -w "\nStatus: %{http_code}\n" \
     -D -

echo ""
echo "✅ Teste concluído!"
