const { S3Client, CreateBucketCommand, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION_NAME || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_STORAGE_BUCKET_NAME || 'essencial-form-files';

async function createBucket() {
  try {
    console.log('🪣 Criando bucket S3:', BUCKET_NAME);
    
    // Criar o bucket
    const createCommand = new CreateBucketCommand({
      Bucket: BUCKET_NAME,
      CreateBucketConfiguration: {
        LocationConstraint: process.env.AWS_S3_REGION_NAME || 'us-east-2'
      }
    });
    
    await s3Client.send(createCommand);
    console.log('✅ Bucket criado com sucesso!');
    
    // Configurar CORS para permitir uploads do frontend
    const corsCommand = new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['PUT', 'POST', 'GET', 'DELETE'],
            AllowedOrigins: ['*'],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    });
    
    await s3Client.send(corsCommand);
    console.log('✅ CORS configurado com sucesso!');
    
    console.log('🎉 Bucket pronto para uso!');
    console.log(`📍 Região: ${process.env.AWS_S3_REGION_NAME || 'us-east-2'}`);
    console.log(`📦 Nome: ${BUCKET_NAME}`);
    
  } catch (error) {
    if (error.name === 'BucketAlreadyOwnedByYou') {
      console.log('ℹ️  Bucket já existe e pertence a você!');
    } else if (error.name === 'BucketAlreadyExists') {
      console.log('❌ Bucket já existe (pertence a outra pessoa)');
    } else {
      console.error('❌ Erro ao criar bucket:', error.message);
    }
  }
}

createBucket();
