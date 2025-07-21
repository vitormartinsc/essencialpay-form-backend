import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do Google Drive
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID
  },
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

async function findFolderStructure() {
  try {
    console.log('🔍 Buscando estrutura de pastas no Google Drive compartilhado...\n');

    // Primeiro, listar todos os drives compartilhados
    console.log('📁 Listando drives compartilhados...');
    const sharedDrivesResponse = await drive.drives.list({
      fields: 'drives(id, name)'
    });

    if (!sharedDrivesResponse.data.drives || sharedDrivesResponse.data.drives.length === 0) {
      console.log('❌ Nenhum drive compartilhado encontrado');
      console.log('💡 Certifique-se de que a service account foi adicionada ao drive compartilhado "Essencial Pay"');
      console.log('   Email: ' + process.env.GOOGLE_CLIENT_EMAIL);
      return;
    }

    console.log('\n📋 Drives compartilhados encontrados:');
    sharedDrivesResponse.data.drives.forEach((drive, index) => {
      console.log(`${index + 1}. ${drive.name} (ID: ${drive.id})`);
    });

    // Buscar o drive "Essencial Pay"
    const essencialPayDrive = sharedDrivesResponse.data.drives.find(d => d.name === 'Essencial Pay');
    
    if (!essencialPayDrive) {
      console.log('\n❌ Drive compartilhado "Essencial Pay" não encontrado');
      console.log('💡 Verifique se:');
      console.log('1. O nome do drive está correto: "Essencial Pay"');
      console.log('2. A service account foi adicionada ao drive compartilhado');
      console.log('3. Email da service account: ' + process.env.GOOGLE_CLIENT_EMAIL);
      return;
    }

    console.log(`\n✅ Drive compartilhado "Essencial Pay" encontrado: ${essencialPayDrive.id}`);

    // Buscar pasta "2. Delivery" dentro do drive compartilhado
    console.log('\n📁 Procurando pasta "2. Delivery"...');
    const deliveryResponse = await drive.files.list({
      q: `name='2. Delivery' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      driveId: essencialPayDrive.id!,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      corpora: 'drive',
      fields: 'files(id, name)'
    });

    if (!deliveryResponse.data.files || deliveryResponse.data.files.length === 0) {
      console.log('❌ Pasta "2. Delivery" não encontrada');
      console.log('💡 Verifique se a pasta existe dentro do drive compartilhado "Essencial Pay"');
      return;
    }

    const deliveryFolder = deliveryResponse.data.files[0];
    console.log(`✅ Pasta "2. Delivery" encontrada: ${deliveryFolder.id}`);

    // Buscar pasta "2. Cadastro" dentro de "2. Delivery"
    console.log('\n📁 Procurando pasta "2. Cadastro"...');
    const cadastroResponse = await drive.files.list({
      q: `name='2. Cadastro' and mimeType='application/vnd.google-apps.folder' and '${deliveryFolder.id}' in parents and trashed=false`,
      driveId: essencialPayDrive.id!,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      corpora: 'drive',
      fields: 'files(id, name)'
    });

    if (!cadastroResponse.data.files || cadastroResponse.data.files.length === 0) {
      console.log('❌ Pasta "2. Cadastro" não encontrada');
      console.log('💡 Verifique se a pasta existe dentro de "2. Delivery"');
      return;
    }

    const cadastroFolder = cadastroResponse.data.files[0];
    console.log(`✅ Pasta "2. Cadastro" encontrada: ${cadastroFolder.id}`);

    console.log('\n🎉 Estrutura de pastas encontrada com sucesso!');
    console.log('\n📋 Estrutura:');
    console.log(`📁 Essencial Pay (Drive Compartilhado - ${essencialPayDrive.id})`);
    console.log(`  └── 📁 2. Delivery (${deliveryFolder.id})`);
    console.log(`      └── 📁 2. Cadastro (${cadastroFolder.id})`);
    
    console.log('\n🔧 Configure no seu arquivo .env:');
    console.log(`GOOGLE_DRIVE_PARENT_FOLDER_ID=${cadastroFolder.id}`);
    
    console.log('\n✨ Agora os documentos serão organizados assim:');
    console.log('📁 2. Cadastro');
    console.log('  ├── 📁 SP - João Silva - 123.456.789-00');
    console.log('  │   ├── � RG_frente.jpg');
    console.log('  │   ├── � RG_verso.jpg');
    console.log('  │   ├── � selfie.jpg');
    console.log('  │   └── � comprovante_residencia.pdf');
    console.log('  └── 📁 RJ - Empresa ABC Ltda - 12.345.678/0001-90');
    console.log('      └── ...');

  } catch (error) {
    console.error('❌ Erro ao buscar estrutura de pastas:', error);
    if (error && typeof error === 'object' && 'code' in error) {
      const gError = error as any;
      if (gError.code === 403) {
        console.log('\n💡 Erro de permissão. Para drives compartilhados:');
        console.log('1. Acesse o drive compartilhado "Essencial Pay"');
        console.log('2. Clique no ícone de configurações (engrenagem)');
        console.log('3. Clique em "Gerenciar membros"');
        console.log('4. Adicione a service account como membro:');
        console.log('   ' + process.env.GOOGLE_CLIENT_EMAIL);
        console.log('5. Defina a permissão como "Editor de conteúdo" ou "Gerenciador"');
      }
    }
  }
}

findFolderStructure();
