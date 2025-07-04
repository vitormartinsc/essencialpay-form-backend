@echo off
echo 🚀 Iniciando servidor em modo DEV com banco externo...
set DATABASE_URL=postgresql://postgres:LZIjjUhtSyUllFmChEPrImDOuOOwFtkI@hopper.proxy.rlwy.net:57099/railway
set NODE_ENV=development
set PORT=8080
node dist/index.js
