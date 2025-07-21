import { google } from 'googleapis';
import { Readable } from 'stream';
import dotenv from 'dotenv';

// Carregar .env
dotenv.config();

// Configuração do Google Drive
const GOOGLE_DRIVE_ENABLED = process.env.GOOGLE_DRIVE_ENABLED === 'true';
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PARENT_FOLDER_ID = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;

console.log('🔧 Google Drive Config:');
console.log('- GOOGLE_DRIVE_ENABLED:', GOOGLE_DRIVE_ENABLED);
console.log('- Has PROJECT_ID:', !!GOOGLE_PROJECT_ID);
console.log('- Has PRIVATE_KEY:', !!GOOGLE_PRIVATE_KEY);
console.log('- Has CLIENT_EMAIL:', !!GOOGLE_CLIENT_EMAIL);
console.log('- Has PARENT_FOLDER_ID:', !!GOOGLE_PARENT_FOLDER_ID);

// Configurar autenticação
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: GOOGLE_PRIVATE_KEY,
    client_email: GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID
  },
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

interface UploadResult {
  fileId: string;
  fileName: string;
  fileUrl: string;
  viewUrl: string;
  downloadUrl: string;
}

/**
 * Cria uma pasta no Google Drive (se não existir)
 */
async function createFolderIfNotExists(folderName: string, parentFolderId?: string): Promise<string> {
  try {
    // Escapar aspas simples no nome da pasta para a query
    const escapedFolderName = folderName.replace(/'/g, "\\'");
    
    // Verificar se a pasta já existe
    const query = `name='${escapedFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const searchQuery = parentFolderId ? `${query} and '${parentFolderId}' in parents` : query;
    
    console.log(`🔍 Buscando pasta: ${folderName}`);
    
    const response = await drive.files.list({
      q: searchQuery,
      fields: 'files(id, name)',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true
    });

    if (response.data.files && response.data.files.length > 0) {
      console.log(`📁 Pasta '${folderName}' já existe:`, response.data.files[0].id);
      return response.data.files[0].id!;
    }

    // Criar a pasta
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined
    };

    console.log(`📁 Criando pasta: ${folderName}`);
    
    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id',
      supportsAllDrives: true
    });

    console.log(`✅ Pasta '${folderName}' criada:`, folder.data.id);
    return folder.data.id!;
  } catch (error) {
    console.error(`❌ Erro ao criar pasta '${folderName}':`, error);
    throw error;
  }
}

/**
 * Faz upload de um arquivo para o Google Drive
 */
export async function uploadFileToGoogleDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  userId: string,
  documentType: string,
  userData?: {
    state?: string;
    fullName?: string;
    cpf?: string;
    cnpj?: string;
    accountCategory?: string;
  }
): Promise<UploadResult | null> {
  if (!GOOGLE_DRIVE_ENABLED) {
    console.log('Google Drive desabilitado - pulando upload');
    return null;
  }

  if (!GOOGLE_PROJECT_ID || !GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL) {
    console.log('Credenciais do Google Drive não configuradas');
    return null;
  }

  try {
    // Estrutura de pastas: GOOGLE_PARENT_FOLDER_ID já aponta para "2. Cadastro"
    // Então criamos diretamente a pasta do usuário no formato: ESTADO - Nome CPF/CNPJ
    
    // 1. Pasta raiz já é "2. Cadastro" (configurada via GOOGLE_DRIVE_PARENT_FOLDER_ID)
    if (!GOOGLE_PARENT_FOLDER_ID) {
      throw new Error('GOOGLE_DRIVE_PARENT_FOLDER_ID não configurado');
    }

    // 2. Criar pasta do usuário no formato: ESTADO - Nome CPF/CNPJ
    let userFolderName = '';
    
    if (userData) {
      const state = userData.state || 'XX';
      const name = userData.fullName || 'Usuario';
      
      // Determinar se usa CPF ou CNPJ baseado no accountCategory ou nos dados disponíveis
      let documento = '';
      if (userData.accountCategory === 'pessoa_fisica' && userData.cpf) {
        documento = userData.cpf;
      } else if (userData.accountCategory === 'pessoa_juridica' && userData.cnpj) {
        documento = userData.cnpj;
      } else if (userData.cpf) {
        documento = userData.cpf;
      } else if (userData.cnpj) {
        documento = userData.cnpj;
      } else {
        documento = 'SEM_DOC';
      }
      
      userFolderName = `${state} - ${name} ${documento}`;
    } else {
      userFolderName = `user_${userId}`;
    }

    // Limpar caracteres inválidos para nomes de pasta no Google Drive
    // Remover caracteres especiais e simplificar aspas
    userFolderName = userFolderName
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/'/g, '')  // Remover aspas simples que podem causar problemas na query
      .replace(/\s+/g, ' ')  // Normalizar espaços múltiplos
      .trim();

    const userFolderId = await createFolderIfNotExists(
      userFolderName,
      GOOGLE_PARENT_FOLDER_ID  // Agora criamos diretamente dentro de "2. Cadastro"
    );

    // Preparar o arquivo para upload (diretamente na pasta do usuário)
    const fileMetadata = {
      name: fileName,
      parents: [userFolderId]
    };

    const media = {
      mimeType: mimeType,
      body: Readable.from(fileBuffer)
    };

    console.log(`📤 Fazendo upload de ${fileName} para Google Drive na pasta: ${userFolderName}...`);

    // Fazer upload
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink',
      supportsAllDrives: true
    });

    const fileId = response.data.id!;
    const webViewLink = response.data.webViewLink!;
    const webContentLink = response.data.webContentLink!;

    // Em drives compartilhados, não podemos criar permissões públicas
    // Os arquivos herdam as permissões do drive compartilhado

    const result: UploadResult = {
      fileId: fileId,
      fileName: fileName,
      fileUrl: webContentLink,
      viewUrl: webViewLink,
      downloadUrl: `https://drive.google.com/uc?id=${fileId}&export=download`
    };

    console.log(`✅ Upload concluído - File ID: ${fileId}`);
    return result;

  } catch (error) {
    console.error('❌ Erro ao fazer upload para Google Drive:', error);
    
    // Log adicional para debugging
    if (error && typeof error === 'object') {
      const gError = error as any;
      if (gError.response && gError.response.data) {
        console.error('❌ Detalhes do erro:', JSON.stringify(gError.response.data, null, 2));
      }
      if (gError.code) {
        console.error('❌ Código do erro:', gError.code);
      }
    }
    
    return null;
  }
}

/**
 * Deleta um arquivo do Google Drive
 */
export async function deleteFileFromGoogleDrive(fileId: string): Promise<boolean> {
  if (!GOOGLE_DRIVE_ENABLED) {
    console.log('Google Drive desabilitado - pulando exclusão');
    return false;
  }

  try {
    await drive.files.delete({ 
      fileId,
      supportsAllDrives: true 
    });
    console.log(`✅ Arquivo ${fileId} deletado do Google Drive`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao deletar arquivo ${fileId} do Google Drive:`, error);
    return false;
  }
}

/**
 * Lista arquivos em uma pasta do Google Drive
 */
export async function listFilesInFolder(folderId: string): Promise<any[]> {
  if (!GOOGLE_DRIVE_ENABLED) {
    console.log('Google Drive desabilitado');
    return [];
  }

  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, createdTime, webViewLink, webContentLink)',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true
    });

    return response.data.files || [];
  } catch (error) {
    console.error('❌ Erro ao listar arquivos:', error);
    return [];
  }
}

export { GOOGLE_DRIVE_ENABLED };
