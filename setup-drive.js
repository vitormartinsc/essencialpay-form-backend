#!/usr/bin/env node

/**
 * Script para configurar automaticamente o Google Drive
 * 
 * Uso: node setup-drive.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupGoogleDrive() {
  console.log('🔧 Configurador do Google Drive para EssencialPay');
  console.log('================================================\n');

  console.log('1. Primeiro, você precisa ter as credenciais do Google Cloud Console');
  console.log('2. Siga o guia em docs/GOOGLE_DRIVE_SETUP.md para obter as credenciais');
  console.log('3. Este script ajudará você a configurar as variáveis de ambiente\n');

  const hasCredentials = await question('Você já tem o arquivo JSON de credenciais? (s/n): ');
  
  if (hasCredentials.toLowerCase() !== 's') {
    console.log('\n❌ Primeiro obtenha as credenciais seguindo o guia em docs/GOOGLE_DRIVE_SETUP.md');
    process.exit(1);
  }

  const jsonPath = await question('Caminho para o arquivo JSON de credenciais: ');
  
  if (!fs.existsSync(jsonPath)) {
    console.log('❌ Arquivo não encontrado:', jsonPath);
    process.exit(1);
  }

  try {
    const credentials = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log('\n✅ Credenciais carregadas com sucesso!');
    console.log('📧 Service Account:', credentials.client_email);
    
    const folderId = await question('\nID da pasta "documentos" no Google Drive: ');
    
    if (!folderId.trim()) {
      console.log('❌ ID da pasta é obrigatório');
      process.exit(1);
    }

    // Ler arquivo .env atual
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Remover configurações antigas do Google Drive (se existirem)
    envContent = envContent.replace(/^GOOGLE_.*$/gm, '').replace(/\n\n+/g, '\n\n');

    // Adicionar novas configurações
    const googleConfig = `
# Google Drive Configuration
GOOGLE_PROJECT_ID=${credentials.project_id}
GOOGLE_PRIVATE_KEY_ID=${credentials.private_key_id}
GOOGLE_PRIVATE_KEY="${credentials.private_key}"
GOOGLE_CLIENT_EMAIL=${credentials.client_email}
GOOGLE_CLIENT_ID=${credentials.client_id}
GOOGLE_DRIVE_PARENT_FOLDER_ID=${folderId.trim()}
`;

    envContent += googleConfig;

    // Salvar arquivo .env
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Configuração do Google Drive salva no arquivo .env');
    
    // Testar configuração
    console.log('\n🧪 Testando configuração...');
    
    try {
      // Importar o serviço do Drive
      require('dotenv').config();
      const DriveUploadService = require('./dist/utils/driveUpload').default;
      
      const driveService = new DriveUploadService();
      
      if (driveService.isConfigured()) {
        console.log('✅ Configuração válida! O Google Drive está pronto para uso.');
      } else {
        console.log('❌ Algo está errado com a configuração. Verifique as variáveis de ambiente.');
      }
    } catch (error) {
      console.log('⚠️ Não foi possível testar a configuração. Execute npm run build primeiro.');
    }

    console.log('\n📋 Próximos passos:');
    console.log('1. Reinicie o servidor: npm run dev');
    console.log('2. Teste enviando um formulário com documentos');
    console.log('3. Verifique se a pasta foi criada no Google Drive');
    
    console.log('\n🔗 Lembre-se:');
    console.log(`- Compartilhe a pasta "documentos" com: ${credentials.client_email}`);
    console.log('- Dê permissão de "Editor" para a Service Account');
    
  } catch (error) {
    console.log('❌ Erro ao processar arquivo de credenciais:', error.message);
    process.exit(1);
  }
  
  rl.close();
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  setupGoogleDrive().catch(console.error);
}

module.exports = { setupGoogleDrive };
