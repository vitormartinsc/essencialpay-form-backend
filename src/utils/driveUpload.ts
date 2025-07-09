import { google } from 'googleapis';
import { Readable } from 'stream';

// Interface para dados do arquivo a ser enviado
interface FileUpload {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

// Interface para dados do cliente
interface ClientData {
  fullName: string;
  email: string;
  cpf: string;
}

class DriveUploadService {
  private drive: any;
  private parentFolderId: string;

  constructor() {
    // Inicializar o Google Drive com autenticação por Service Account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    this.drive = google.drive({ version: 'v3', auth });
    this.parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID || '';
  }

  /**
   * Cria uma pasta para o cliente dentro da pasta "Documentos"
   */
  async createClientFolder(clientData: ClientData): Promise<string> {
    try {
      // Nome da pasta baseado no nome do cliente e CPF para garantir unicidade
      const folderName = `${clientData.fullName} - ${clientData.cpf}`;
      
      console.log(`📁 Criando pasta no Drive: ${folderName}`);

      // Verificar se a pasta já existe
      const existingFolder = await this.findFolder(folderName);
      if (existingFolder) {
        console.log(`📁 Pasta já existe: ${existingFolder.id}`);
        return existingFolder.id;
      }

      // Criar nova pasta
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [this.parentFolderId], // ID da pasta "Documentos"
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id, name',
      });

      console.log(`✅ Pasta criada no Drive: ${folder.data.id}`);
      return folder.data.id;
    } catch (error) {
      console.error('❌ Erro ao criar pasta no Drive:', error);
      throw new Error('Falha ao criar pasta no Google Drive');
    }
  }

  /**
   * Procura por uma pasta existente
   */
  private async findFolder(folderName: string): Promise<any> {
    try {
      const response = await this.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and parents in '${this.parentFolderId}'`,
        fields: 'files(id, name)',
      });

      return response.data.files && response.data.files.length > 0 
        ? response.data.files[0] 
        : null;
    } catch (error) {
      console.error('❌ Erro ao procurar pasta no Drive:', error);
      return null;
    }
  }

  /**
   * Faz upload de um arquivo para a pasta do cliente
   */
  async uploadFile(
    file: FileUpload, 
    clientFolderId: string, 
    documentType: string
  ): Promise<{ id: string; url: string; name: string }> {
    try {
      // Criar nome único para o arquivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileExtension = file.originalName.split('.').pop();
      const fileName = `${documentType}_${timestamp}.${fileExtension}`;

      console.log(`📤 Fazendo upload do arquivo: ${fileName}`);

      // Converter buffer para stream
      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);

      // Metadados do arquivo
      const fileMetadata = {
        name: fileName,
        parents: [clientFolderId],
      };

      // Upload do arquivo
      const uploadResponse = await this.drive.files.create({
        resource: fileMetadata,
        media: {
          mimeType: file.mimeType,
          body: stream,
        },
        fields: 'id, name, webViewLink',
      });

      // Tornar o arquivo visualizável (opcional - remova se quiser manter privado)
      await this.drive.permissions.create({
        fileId: uploadResponse.data.id,
        resource: {
          role: 'reader',
          type: 'anyone',
        },
      });

      console.log(`✅ Arquivo enviado para o Drive: ${uploadResponse.data.id}`);

      return {
        id: uploadResponse.data.id,
        url: uploadResponse.data.webViewLink,
        name: fileName,
      };
    } catch (error) {
      console.error('❌ Erro ao fazer upload do arquivo:', error);
      throw new Error('Falha ao fazer upload para o Google Drive');
    }
  }

  /**
   * Faz upload de múltiplos arquivos para o Drive
   */
  async uploadDocuments(
    files: { [key: string]: FileUpload }, 
    clientData: ClientData
  ): Promise<any[]> {
    try {
      // Criar pasta do cliente
      const clientFolderId = await this.createClientFolder(clientData);

      const uploadedFiles = [];

      // Upload de cada arquivo
      for (const [documentType, file] of Object.entries(files)) {
        if (file) {
          try {
            const uploadedFile = await this.uploadFile(file, clientFolderId, documentType);
            uploadedFiles.push({
              type: documentType,
              ...uploadedFile,
            });
          } catch (error) {
            console.error(`❌ Erro ao fazer upload de ${documentType}:`, error);
            // Continua com os outros arquivos mesmo se um falhar
          }
        }
      }

      return uploadedFiles;
    } catch (error) {
      console.error('❌ Erro geral no upload para Drive:', error);
      throw error;
    }
  }

  /**
   * Verifica se o serviço está configurado corretamente
   */
  isConfigured(): boolean {
    return !!(
      process.env.GOOGLE_PROJECT_ID &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_CLIENT_EMAIL &&
      process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
    );
  }
}

export default DriveUploadService;
