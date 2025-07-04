#!/bin/bash
# Script para limpar arquivos JS transpilados antigos (manter apenas os do dist/)

echo "🧹 Limpando arquivos JS antigos..."

# Remover arquivos JS transpilados na pasta src (manter apenas arquivos TS)
echo "📁 Removendo src/index.js..."
rm -f src/index.js

echo "📁 Removendo src/utils/s3Upload.js..."
rm -f src/utils/s3Upload.js

echo "📁 Removendo src/utils/kommo.js (versão antiga)..."
rm -f src/utils/kommo.js

echo "📁 Removendo src/config/aws.js..."
rm -f src/config/aws.js

echo "✅ Limpeza concluída!"
echo "📋 Arquivos mantidos:"
echo "  - src/server.js (para compatibilidade)"
echo "  - dist/* (arquivos compilados)"
echo "  - src/*.ts (código fonte TypeScript)"
