const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
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
    // Aceitar apenas JPG, PNG e PDF
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Apenas JPG, PNG e PDF são aceitos.'));
    }
  },
});

const app = express();
const PORT = 8080;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5176', 'http://localhost:8080'],
  credentials: true,
}));
app.use(express.json());

// Pasta para salvar os dados (depois você substitui pelo S3)
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Rota para salvar os dados do formulário no PostgreSQL
app.post('/api/users', async (req, res) => {
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
      account
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
    
    res.json({
      success: true,
      message: 'Usuário salvo com sucesso no PostgreSQL!',
      data: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        created_at: user.created_at
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

// Rota para upload de documentos do frontend para S3 e PostgreSQL
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
    }

    console.log('📤 Upload de documento recebido:', req.file.originalname);
    
    // Gerar nome único para o arquivo
    const fileExtension = req.file.originalname.split('.').pop();
    const uniqueFileName = `documents/${uuidv4()}.${fileExtension}`;

    // Comando para upload no S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'private', // Arquivo privado por segurança
    });

    // Enviar para S3
    await s3Client.send(command);

    // URL do arquivo no S3
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_S3_REGION_NAME}.amazonaws.com/${uniqueFileName}`;

    console.log('✅ Upload realizado com sucesso:', fileUrl);

    // Salvar informações do documento no PostgreSQL
    try {
      const query = `
        INSERT INTO user_documents (user_id, document_type, file_name, file_url, file_key, file_size, content_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;
      
      const values = [
        null, // user_id será definido posteriormente quando associar ao usuário
        'document',
        req.file.originalname,
        fileUrl,
        uniqueFileName,
        req.file.size,
        req.file.mimetype
      ];
      
      const result = await pool.query(query, values);
      console.log('📝 Documento salvo no PostgreSQL:', result.rows[0].id);
    } catch (dbError) {
      console.warn('⚠️  Erro ao salvar no PostgreSQL (não crítico):', dbError.message);
    }

    res.json({
      success: true,
      message: 'Documento enviado com sucesso! 🎉',
      data: {
        fileName: req.file.originalname,
        size: req.file.size,
        contentType: req.file.mimetype,
        url: fileUrl,
        key: uniqueFileName
      }
    });
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    res.status(500).json({
      success: false,
      message: `Erro ao fazer upload: ${error.message}`
    });
  }
});

// Rota para upload de teste (mantém compatibilidade com test-upload.html)
app.post('/api/upload-test', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
    }

    console.log('📤 Upload de teste recebido:', req.file.originalname);
    
    // Gerar nome único para o arquivo
    const fileExtension = req.file.originalname.split('.').pop();
    const uniqueFileName = `test-uploads/${uuidv4()}.${fileExtension}`;

    // Comando para upload no S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'private', // Arquivo privado por segurança
    });

    // Enviar para S3
    await s3Client.send(command);

    // URL do arquivo no S3
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_S3_REGION_NAME}.amazonaws.com/${uniqueFileName}`;

    console.log('✅ Upload de teste realizado com sucesso:', fileUrl);

    res.json({
      success: true,
      message: 'Upload de teste realizado com sucesso no AWS S3! 🎉',
      data: {
        fileName: req.file.originalname,
        size: req.file.size,
        contentType: req.file.mimetype,
        url: fileUrl,
        key: uniqueFileName
      }
    });
  } catch (error) {
    console.error('❌ Erro no upload de teste:', error);
    res.status(500).json({
      success: false,
      message: `Erro ao fazer upload de teste: ${error.message}`
    });
  }
});

// Rota para servir o arquivo de teste HTML
app.get('/test-upload.html', (req, res) => {
  const filePath = path.join(__dirname, '../test-upload.html');
  console.log('📄 Servindo arquivo de teste:', filePath);
  res.sendFile(filePath);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend funcionando!',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Dados salvos em: ${dataDir}`);
});

module.exports = app;
