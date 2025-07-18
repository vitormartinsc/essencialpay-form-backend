/**
 * EXEMPLO DE INTEGRAÇÃO DO GOOGLE DRIVE
 * 
 * Este arquivo mostra como modificar o index.ts para usar Google Drive
 * ao invés de AWS S3 para armazenar os documentos dos usuários.
 * 
 * INSTRUÇÕES:
 * 1. Copie o código abaixo e substitua no seu index.ts
 * 2. Certifique-se de que as variáveis de ambiente estão configuradas
 * 3. Execute o script de atualização do banco de dados
 */

import { Request, Response } from 'express';
import { Pool } from 'pg';
import { uploadFile } from '../utils/fileUpload';

// Exemplo de como usar na rota POST /api/users
export async function handleFileUploads(req: Request, user: any, pool: Pool) {
  const uploadedDocuments: any[] = [];
  
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (files) {
    console.log('📤 Processando arquivos (documento frente, verso, selfie e comprovante de residência)...');
    
    // Processar cada tipo de documento usando a nova função unificada
    if (files.documentFront) {
      const doc = await uploadFile(files.documentFront[0], user.id, 'document_front', pool);
      if (doc) uploadedDocuments.push(doc);
    }
    
    if (files.documentBack) {
      const doc = await uploadFile(files.documentBack[0], user.id, 'document_back', pool);
      if (doc) uploadedDocuments.push(doc);
    }
    
    if (files.selfie) {
      const doc = await uploadFile(files.selfie[0], user.id, 'selfie', pool);
      if (doc) uploadedDocuments.push(doc);
    }
    
    if (files.residenceProof) {
      const doc = await uploadFile(files.residenceProof[0], user.id, 'residence_proof', pool);
      if (doc) uploadedDocuments.push(doc);
    }
  }

  return uploadedDocuments;
}

/**
 * EXEMPLO DE RESPOSTA DA API
 * 
 * A resposta agora incluirá informações extras do Google Drive (se habilitado):
 * 
 * {
 *   "id": 123,
 *   "type": "document_front",
 *   "fileName": "documento.jpg",
 *   "url": "https://drive.google.com/file/d/abc123/view",
 *   "fileId": "abc123",
 *   "viewUrl": "https://drive.google.com/file/d/abc123/view",
 *   "downloadUrl": "https://drive.google.com/uc?id=abc123&export=download"
 * }
 * 
 * CONFIGURAÇÃO NECESSÁRIA NO .env:
 * 
 * GOOGLE_DRIVE_ENABLED=true
 * GOOGLE_PROJECT_ID=your-project-id
 * GOOGLE_PRIVATE_KEY_ID=your-private-key-id
 * GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
 * GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
 * GOOGLE_CLIENT_ID=your-client-id
 * GOOGLE_DRIVE_PARENT_FOLDER_ID=your-documents-folder-id
 */
