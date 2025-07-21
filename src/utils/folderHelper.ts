import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do Google Drive
const GOOGLE_DRIVE_ENABLED = process.env.GOOGLE_DRIVE_ENABLED === 'true';
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PARENT_FOLDER_ID = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;

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
    
    const response = await drive.files.list({
      q: searchQuery,
      fields: 'files(id, name)',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true
    });

    if (response.data.files && response.data.files.length > 0) {
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

    return folder.data.id!;
  } catch (error) {
    console.error(`❌ Erro ao criar pasta '${folderName}':`, error);
    throw error;
  }
}

/**
 * Cria ou obtém o link da pasta do usuário no Google Drive
 */
export async function getUserFolderUrl(userData: {
  userId: string;
  state?: string;
  fullName?: string;
  cpf?: string;
  cnpj?: string;
  accountCategory?: string;
}): Promise<string | null> {
  if (!GOOGLE_DRIVE_ENABLED) {
    return null;
  }

  if (!GOOGLE_PROJECT_ID || !GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PARENT_FOLDER_ID) {
    return null;
  }

  try {
    // Criar nome da pasta seguindo o mesmo padrão do googleDrive.ts
    let userFolderName = '';
    
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

    // Limpar caracteres inválidos para nomes de pasta no Google Drive
    userFolderName = userFolderName
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/'/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const userFolderId = await createFolderIfNotExists(
      userFolderName,
      GOOGLE_PARENT_FOLDER_ID
    );

    return `https://drive.google.com/drive/folders/${userFolderId}`;
  } catch (error) {
    console.error('❌ Erro ao obter URL da pasta do usuário:', error);
    return null;
  }
}
