import { uploadFileToGoogleDrive } from './googleDrive';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';

// Configuração do storage
const USE_GOOGLE_DRIVE = process.env.GOOGLE_DRIVE_ENABLED === 'true';
const USE_AWS_S3 = process.env.AWS_STORAGE_ENABLED !== 'false'; // Por padrão usa AWS

// Configuração do AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION_NAME || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_STORAGE_BUCKET_NAME || 'essencial-form-files';

export interface UploadResult {
  id?: number;
  type: string;
  fileName: string;
  url: string;
  fileId?: string; // Para Google Drive
  viewUrl?: string; // Para Google Drive
  downloadUrl?: string; // Para Google Drive
  userFolderId?: string; // Para Google Drive
  userFolderUrl?: string; // Para Google Drive
}

/**
 * Faz upload de um arquivo usando AWS S3
 */
async function uploadToS3(
  file: Express.Multer.File,
  userId: string,
  documentType: string
): Promise<UploadResult | null> {
  try {
    const fileExtension = file.originalname.split('.').pop();
    const uniqueFileName = `documents/${userId}/${documentType}_${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private',
    });

    await s3Client.send(command);

    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_S3_REGION_NAME}.amazonaws.com/${uniqueFileName}`;

    return {
      type: documentType,
      fileName: file.originalname,
      url: fileUrl
    };
  } catch (error) {
    console.error(`❌ Erro ao fazer upload para S3 do ${documentType}:`, error);
    return null;
  }
}

/**
 * Faz upload de um arquivo usando Google Drive
 */
async function uploadToGoogleDrive(
  file: Express.Multer.File,
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
  try {
    const result = await uploadFileToGoogleDrive(
      file.buffer,
      file.originalname,
      file.mimetype,
      userId,
      documentType,
      userData
    );

    if (!result) {
      return null;
    }

    return {
      type: documentType,
      fileName: result.fileName,
      url: result.fileUrl,
      fileId: result.fileId,
      viewUrl: result.viewUrl,
      downloadUrl: result.downloadUrl,
      userFolderId: result.userFolderId,
      userFolderUrl: result.userFolderUrl
    };
  } catch (error) {
    console.error(`❌ Erro ao fazer upload para Google Drive do ${documentType}:`, error);
    return null;
  }
}

/**
 * Faz upload de um arquivo (escolhe automaticamente entre S3 e Google Drive)
 */
export async function uploadFile(
  file: Express.Multer.File,
  userId: string,
  documentType: string,
  pool: Pool,
  userData?: {
    state?: string;
    fullName?: string;
    cpf?: string;
    cnpj?: string;
    accountCategory?: string;
  }
): Promise<UploadResult | null> {
  if (!file) return null;

  console.log(`📤 Fazendo upload de ${documentType} usando ${USE_GOOGLE_DRIVE ? 'Google Drive' : 'AWS S3'}...`);

  let uploadResult: UploadResult | null = null;

  // Escolher o método de upload
  if (USE_GOOGLE_DRIVE) {
    uploadResult = await uploadToGoogleDrive(file, userId, documentType, userData);
  } else if (USE_AWS_S3) {
    uploadResult = await uploadToS3(file, userId, documentType);
  } else {
    console.error('❌ Nenhum método de storage configurado!');
    return null;
  }

  if (!uploadResult) {
    return null;
  }

  // Salvar informações do documento no PostgreSQL
  try {
    const docQuery = `
      INSERT INTO user_documents (user_id, document_type, file_name, file_url, file_key, file_size, content_type, drive_file_id, drive_view_url, drive_download_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;
    
    const docValues = [
      userId,
      documentType,
      file.originalname,
      uploadResult.url,
      uploadResult.fileId || `documents/${userId}/${documentType}_${uuidv4()}`, // fallback para S3
      file.size,
      file.mimetype,
      uploadResult.fileId || null, // Google Drive file ID
      uploadResult.viewUrl || null, // Google Drive view URL
      uploadResult.downloadUrl || null // Google Drive download URL
    ];
    
    const docResult = await pool.query(docQuery, docValues);
    
    console.log(`✅ Documento ${documentType} salvo no banco:`, docResult.rows[0].id);
    
    return {
      id: docResult.rows[0].id,
      type: documentType,
      fileName: file.originalname,
      url: uploadResult.url,
      fileId: uploadResult.fileId,
      viewUrl: uploadResult.viewUrl,
      downloadUrl: uploadResult.downloadUrl
    };
  } catch (error) {
    console.error(`❌ Erro ao salvar documento ${documentType} no banco:`, error);
    return null;
  }
}

/**
 * Atualiza a estrutura da tabela user_documents para suportar Google Drive
 */
export const updateUserDocumentsTable = `
  -- Adicionar colunas para Google Drive (se não existirem)
  ALTER TABLE user_documents 
  ADD COLUMN IF NOT EXISTS drive_file_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS drive_view_url TEXT,
  ADD COLUMN IF NOT EXISTS drive_download_url TEXT;
`;

console.log('📁 Storage Config:');
console.log('- USE_GOOGLE_DRIVE:', USE_GOOGLE_DRIVE);
console.log('- USE_AWS_S3:', USE_AWS_S3);
