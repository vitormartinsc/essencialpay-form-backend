import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from '../config/aws';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export async function uploadFileToS3(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'documents'
): Promise<UploadResult> {
  try {
    // Gerar um nome único para o arquivo
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${folder}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'private', // Arquivo privado por segurança
    });

    await s3Client.send(command);

    // URL do arquivo no S3
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_S3_REGION_NAME}.amazonaws.com/${uniqueFileName}`;

    return {
      success: true,
      url: fileUrl,
      key: uniqueFileName,
    };
  } catch (error) {
    console.error('Erro ao fazer upload para S3:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
