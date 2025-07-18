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
    // Verificar se a pasta já existe
    const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const searchQuery = parentFolderId ? `${query} and '${parentFolderId}' in parents` : query;
    
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
  documentType: string
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
    // Criar pasta do usuário se não existir
    const userFolderId = await createFolderIfNotExists(
      `user_${userId}`, 
      GOOGLE_PARENT_FOLDER_ID
    );

    // Criar pasta do tipo de documento se não existir
    const documentFolderId = await createFolderIfNotExists(
      documentType,
      userFolderId
    );

    // Preparar o arquivo para upload
    const fileMetadata = {
      name: fileName,
      parents: [documentFolderId]
    };

    const media = {
      mimeType: mimeType,
      body: Readable.from(fileBuffer)
    };

    console.log(`📤 Fazendo upload de ${fileName} para Google Drive...`);

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

    // Tornar o arquivo público (opcional)
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      },
      supportsAllDrives: true
    });

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
