const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const pool = require('./config/database');
require('dotenv').config();

// Configuração do AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION_NAME || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_STORAGE_BUCKET_NAME || 'essencial-form-files';

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limite
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas JPG, PNG, WEBP e PDF
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Apenas JPG, PNG, WEBP e PDF são aceitos.'));
    }
  },
});

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
console.log('🔧 Configurando CORS...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('CORS_ALLOWED_ORIGINS:', process.env.CORS_ALLOWED_ORIGINS);

const corsOrigins = process.env.NODE_ENV === 'production' 
  ? (process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : [process.env.FRONTEND_URL])
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:8080'];

console.log('🌐 CORS Origins configurados:', corsOrigins);

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));
app.use(express.json());

// Rota para salvar os dados do formulário no PostgreSQL
app.post('/api/users', upload.fields([
  { name: 'documentFront', maxCount: 1 },
  { name: 'documentBack', maxCount: 1 },
  { name: 'residenceProof', maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      cpf, 
      phone, 
      cep, 
      street, 
      number, 
      complement, 
      neighborhood, 
      city, 
      state,
      cnpj,
      bankName,
      accountType,
      agency,
      account,
      documentType
    } = req.body;
    
    // Validações básicas
    if (!fullName || !email || !cpf || !phone || !cep || !street || !number || !neighborhood || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos obrigatórios devem ser preenchidos'
      });
    }

    console.log('💾 Salvando usuário no PostgreSQL:', email);
    
    // Inserir usuário no banco
    const query = `
      INSERT INTO users (nome, email, cpf, cnpj, telefone, cep, logradouro, numero, complemento, bairro, cidade, estado, bank_name, account_type, agency, account)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, nome, email, created_at
    `;
    
    const values = [
      fullName,        // nome
      email,           // email
      cpf,             // cpf
      cnpj || null,    // cnpj (opcional)
      phone,           // telefone
      cep,             // cep
      street,          // logradouro
      number,          // numero
      complement || '', // complemento
      neighborhood,    // bairro
      city,            // cidade
      state,           // estado
      bankName || null,     // bank_name
      accountType || null,  // account_type
      agency || null,       // agency
      account || null       // account
    ];
    
    const result = await pool.query(query, values);
    const user = result.rows[0];
    
    console.log('✅ Usuário salvo com sucesso:', user.id);
    
    // Processar arquivos se foram enviados
    const uploadedDocuments = [];
    
    if (req.files) {
      console.log('📤 Processando arquivos...');
      
      // Função para fazer upload de um arquivo
      const uploadFile = async (file, documentType) => {
        if (!file) return null;
        
        try {
          const fileExtension = file.originalname.split('.').pop();
          const uniqueFileName = `documents/${user.id}/${documentType}_${uuidv4()}.${fileExtension}`;

          // Comando para upload no S3
          const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: uniqueFileName,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'private',
          });

          // Enviar para S3
          await s3Client.send(command);

          // URL do arquivo no S3
          const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_S3_REGION_NAME}.amazonaws.com/${uniqueFileName}`;

          // Salvar informações do documento no PostgreSQL
          const docQuery = `
            INSERT INTO user_documents (user_id, document_type, file_name, file_url, file_key, file_size, content_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
          `;
          
          const docValues = [
            user.id,
            documentType,
            file.originalname,
            fileUrl,
            uniqueFileName,
            file.size,
            file.mimetype
          ];
          
          const docResult = await pool.query(docQuery, docValues);
          
          console.log(`✅ Documento ${documentType} salvo:`, docResult.rows[0].id);
          
          return {
            id: docResult.rows[0].id,
            type: documentType,
            fileName: file.originalname,
            url: fileUrl
          };
        } catch (error) {
          console.error(`❌ Erro ao fazer upload do ${documentType}:`, error);
          return null;
        }
      };

      // Processar cada tipo de documento
      if (req.files.documentFront) {
        const doc = await uploadFile(req.files.documentFront[0], 'document_front');
        if (doc) uploadedDocuments.push(doc);
      }
      
      if (req.files.documentBack) {
        const doc = await uploadFile(req.files.documentBack[0], 'document_back');
        if (doc) uploadedDocuments.push(doc);
      }
      
      if (req.files.residenceProof) {
        const doc = await uploadFile(req.files.residenceProof[0], 'residence_proof');
        if (doc) uploadedDocuments.push(doc);
      }
    }
    
    res.json({
      success: true,
      message: 'Usuário e documentos salvos com sucesso!',
      data: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        created_at: user.created_at,
        documents: uploadedDocuments
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao salvar usuário:', error);
    
    // Verificar se é erro de duplicação (email ou CPF já existem)
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Email ou CPF já cadastrado'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar usuário: ' + error.message
    });
  }
});

// Rota para listar usuários do PostgreSQL
app.get('/api/users', async (req, res) => {
  try {
    console.log('📋 Listando usuários do PostgreSQL');
    
    const query = `
      SELECT id, nome, email, cpf, telefone, cep, logradouro, numero, complemento, bairro, cidade, estado, created_at
      FROM users
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    console.log(`✅ ${result.rows.length} usuários encontrados`);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários: ' + error.message,
      data: []
    });
  }
});

// Rota para buscar CEP
app.get('/api/cep/:cep', (req, res) => {
  const { cep } = req.params;
  
  // Remove formatação do CEP (deixa só números)
  const cleanCep = cep.replace(/\D/g, '');
  
  // Validação básica do CEP
  if (cleanCep.length !== 8) {
    return res.status(400).json({
      success: false,
      message: 'CEP deve ter 8 dígitos'
    });
  }

  // Busca na API do ViaCEP
  fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
    .then(response => response.json())
    .then(data => {
      if (data.erro) {
        return res.status(404).json({
          success: false,
          message: 'CEP não encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          cep: data.cep,
          logradouro: data.logradouro,
          complemento: data.complemento,
          bairro: data.bairro,
          localidade: data.localidade,
          uf: data.uf,
          ibge: data.ibge,
          gia: data.gia,
          ddd: data.ddd,
          siafi: data.siafi
        }
      });
    })
    .catch(error => {
      console.error('❌ Erro ao buscar CEP:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar CEP'
      });
    });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint para verificar variáveis de ambiente
app.get('/debug/env', (req, res) => {
  res.json({
    success: true,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      FRONTEND_URL: process.env.FRONTEND_URL,
      CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
      hasDatabase: !!process.env.DATABASE_URL,
      hasAWS: !!process.env.AWS_ACCESS_KEY_ID,
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`�️  Conectado ao PostgreSQL e AWS S3`);
});

module.exports = app;
