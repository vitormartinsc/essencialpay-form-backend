#!/bin/bash
echo "🚀 Iniciando deployment do backend..."

# Instalar dependências
npm ci

# Compilar TypeScript
npm run build

# Inicializar banco de dados
node init-database.js

# Adicionar colunas se necessário
node add-columns.js

# Criar bucket S3 se necessário
node create-bucket.js

echo "✅ Deployment concluído!"
