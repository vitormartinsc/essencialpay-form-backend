import { Pool } from 'pg';
import { updateKommoLeadWithPersonalData, UserData } from './kommo';
import { uploadFile } from './fileUpload';
import { whatsappNotifier } from './whatsapp';

interface UserDataForUpload {
  state: string;
  fullName: string;
  cpf: string;
  cnpj: string;
  accountCategory: string;
}

interface BackgroundTaskData {
  userId: number;
  userDataForKommo: UserData;
  userDataForUpload: UserDataForUpload;
  files?: { [fieldname: string]: Express.Multer.File[] };
  documentType?: string;
  formDataForNotification: any;
}

/**
 * Processa tarefas em background para não bloquear o frontend
 */
export class BackgroundProcessor {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Executa todas as integrações em background
   */
  async processBackgroundTasks(taskData: BackgroundTaskData): Promise<void> {
    const { 
      userId, 
      userDataForKommo, 
      userDataForUpload, 
      files, 
      documentType, 
      formDataForNotification 
    } = taskData;

    console.log(`🔄 Iniciando processamento em background para usuário ${userId}`);

    // 1. Atualizar dados no Kommo
    await this.updateKommoData(userDataForKommo);

    // 2. Processar uploads para Google Drive
    const { uploadedDocuments, userFolderUrl } = await this.processFileUploads(
      userId, 
      userDataForUpload, 
      files, 
      documentType
    );

    // 3. Enviar notificação WhatsApp (incluindo pasta do Google Drive se criada)
    await this.sendWhatsAppNotification(formDataForNotification, userFolderUrl, uploadedDocuments);

    console.log(`✅ Processamento em background concluído para usuário ${userId}`);
  }

  /**
   * Atualiza dados no Kommo
   */
  private async updateKommoData(userData: UserData): Promise<void> {
    try {
      console.log('🔄 Atualizando dados no Kommo...');
      await updateKommoLeadWithPersonalData(userData);
      console.log('✅ Dados do Kommo atualizados com sucesso');
    } catch (kommoError) {
      console.error('⚠️ Erro ao atualizar dados no Kommo (não crítico):', 
        kommoError instanceof Error ? kommoError.message : 'Erro desconhecido');
    }
  }

  /**
   * Processa uploads para Google Drive
   */
  private async processFileUploads(
    userId: number,
    userDataForUpload: UserDataForUpload,
    files?: { [fieldname: string]: Express.Multer.File[] },
    documentType?: string
  ): Promise<{ uploadedDocuments: any[], userFolderUrl?: string }> {
    const uploadedDocuments: any[] = [];
    let userFolderUrl: string | undefined;

    if (!files) {
      console.log('📁 Nenhum arquivo para upload');
      return { uploadedDocuments, userFolderUrl };
    }

    try {
      console.log('📤 Processando arquivos para Google Drive...');

      // Processar cada tipo de documento
      const fileTypes = ['documentFront', 'documentBack', 'selfie', 'residenceProof'];
      const fileTypeMap = {
        documentFront: 'document_front',
        documentBack: 'document_back',
        selfie: 'selfie',
        residenceProof: 'residence_proof'
      };

      for (const fileType of fileTypes) {
        if (files[fileType]) {
          try {
            const doc = await uploadFile(
              files[fileType][0], 
              userId.toString(), 
              fileTypeMap[fileType as keyof typeof fileTypeMap], 
              this.pool, 
              userDataForUpload, 
              documentType
            );
            
            if (doc) {
              uploadedDocuments.push(doc);
              // Capturar o URL da pasta do primeiro documento uploaded
              if (!userFolderUrl && doc.userFolderUrl) {
                userFolderUrl = doc.userFolderUrl;
                console.log('📁 URL da pasta capturado:', userFolderUrl);
              }
            }
          } catch (uploadError) {
            console.error(`⚠️ Erro ao fazer upload de ${fileType}:`, 
              uploadError instanceof Error ? uploadError.message : 'Erro desconhecido');
          }
        }
      }

      console.log(`✅ Processamento de arquivos concluído: ${uploadedDocuments.length} arquivos enviados`);
    } catch (error) {
      console.error('❌ Erro geral no processamento de arquivos:', 
        error instanceof Error ? error.message : 'Erro desconhecido');
    }

    return { uploadedDocuments, userFolderUrl };
  }

  /**
   * Envia notificação WhatsApp
   */
  private async sendWhatsAppNotification(
    formDataForNotification: any,
    userFolderUrl?: string,
    uploadedDocuments?: any[]
  ): Promise<void> {
    try {
      console.log('📱 Enviando notificação WhatsApp...');
      
      // Adicionar informações da pasta do Google Drive se disponível
      const notificationData = {
        ...formDataForNotification,
        documentsFolder: userFolderUrl ? {
          url: userFolderUrl,
          folderId: uploadedDocuments?.find(doc => doc.userFolderId)?.userFolderId || ''
        } : undefined
      };

            await whatsappNotifier.sendFormNotification(notificationData);
      console.log('✅ Notificação WhatsApp enviada com sucesso');
    } catch (whatsappError) {
      console.error('⚠️ Erro ao enviar notificação WhatsApp (não crítico):', 
        whatsappError instanceof Error ? whatsappError.message : 'Erro desconhecido');
    }
  }
}

export default BackgroundProcessor;
export type { BackgroundTaskData, UserDataForUpload };
