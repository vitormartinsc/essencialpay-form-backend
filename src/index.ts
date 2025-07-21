import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { updateKommoLeadWithPersonalData, UserData } from './utils/kommo';
import { uploadFile } from './utils/fileUpload';
import { whatsappNotifier } from './utils/whatsapp';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config({ path: '.env' });

// 🚨 FORÇAR DATABASE_URL para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  process.env.DATABASE_URL = 'postgresql://postgres:***REMOVED***@hopper.proxy.rlwy.net:57099/railway';
}

console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL?.includes('railway.internal') ? 'ERRO: Usando URL interna!' : 'OK: Usando URL externa');
console.log('🔗 URL do banco:', process.env.DATABASE_URL?.substring(0, 50) + '...');

// Configuração do AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION_NAME || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_STORAGE_BUCKET_NAME || 'essencial-form-files';

// Configuração do PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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

// Interface para dados do usuário - celular e dados bancários obrigatórios
interface UserFormData {
  fullName?: string;
  email?: string;
  cpf?: string;
  phone: string; // Obrigatório
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cnpj?: string;
  accountCategory?: string; // Tipo de conta: pessoa_fisica ou pessoa_juridica
  // Dados bancários obrigatórios
  bankName: string;
  accountType: string;
  agency: string;
  account: string;
  // Documentos opcionais
  documentType?: string;
}

// Middleware
console.log('🔧 Configurando CORS...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('CORS_ALLOWED_ORIGINS:', process.env.CORS_ALLOWED_ORIGINS);

const corsOrigins = process.env.NODE_ENV === 'production' 
  ? (process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []))
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:8080'];

console.log('🌐 CORS Origins configurados:', corsOrigins);

app.use(cors({
  origin: corsOrigins.filter(Boolean), // Remove valores undefined
  credentials: true,
}));
app.use(express.json());

// Rota para salvar os dados do formulário no PostgreSQL
app.post('/api/users', upload.fields([
  { name: 'documentFront', maxCount: 1 },
  { name: 'documentBack', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
  { name: 'residenceProof', maxCount: 1 }
]), async (req: Request, res: Response) => {
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
      accountCategory,
      bankName,
      accountType,
      agency,
      account,
      documentType
    }: UserFormData = req.body;
    
    // Validações básicas - celular, nome e dados bancários são obrigatórios
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Celular é obrigatório'
      });
    }
    
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nome completo é obrigatório'
      });
    }
    
    if (!bankName || !accountType || !agency || !account) {
      return res.status(400).json({
        success: false,
        message: 'Dados bancários são obrigatórios: nome do banco, tipo de conta, agência e conta'
      });
    }

    // Validar tipo de documento se fornecido
    if (documentType && !['RG', 'CNH'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de documento deve ser RG ou CNH'
      });
    }

    console.log('💾 Salvando dados bancários no PostgreSQL');
    
    // Inserir dados no banco - campos pessoais e de endereço opcionais
    const query = `
      INSERT INTO users (nome, email, cpf, cnpj, telefone, cep, logradouro, numero, complemento, bairro, cidade, estado, bank_name, account_type, agency, account)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, nome, email, created_at
    `;
    
    const values = [
      fullName,             // nome (obrigatório)
      email || null,        // email (opcional)
      cpf || null,          // cpf (opcional)
      cnpj || null,         // cnpj (opcional)
      phone,                // telefone (obrigatório)
      cep || null,          // cep (opcional)
      street || null,       // logradouro (opcional)
      number || null,       // numero (opcional)
      complement || null,   // complemento (opcional)
      neighborhood || null, // bairro (opcional)
      city || null,         // cidade (opcional)
      state || null,        // estado (opcional)
      bankName,             // bank_name (obrigatório)
      accountType,          // account_type (obrigatório)
      agency,               // agency (obrigatório)
      account               // account (obrigatório)
    ];
    
    const result = await pool.query(query, values);
    const user = result.rows[0];
    
    console.log('✅ Dados bancários salvos com sucesso:', user.id);
    
    // Atualizar dados no Kommo (sempre executar já que celular é obrigatório)
    try {
      console.log('🔄 Atualizando dados no Kommo...');
      const userData: UserData = {
        fullName: fullName || '',
        nome: fullName || '',
        email: email || '',
        phone: phone,
        telefone: phone,
        cpf: cpf || '',
        cnpj: cnpj || '',
        cep: cep || '',
        street: street || '',
        logradouro: street || '',
        number: number || '',
        numero: number || '',
        complement: complement || '',
        complemento: complement || '',
        neighborhood: neighborhood || '',
        bairro: neighborhood || '',
        city: city || '',
        cidade: city || '',
        state: state || '',
        estado: state || '',
        bankName: bankName,
        bank_name: bankName,
        accountType: accountType,
        account_type: accountType,
        agency: agency,
        account: account,
        documentType: documentType
      };
      
      await updateKommoLeadWithPersonalData(userData);
    } catch (kommoError) {
      console.error('⚠️ Erro ao atualizar dados no Kommo (não crítico):', kommoError instanceof Error ? kommoError.message : 'Erro desconhecido');
      // Não falha a operação se o Kommo falhar
    }
    
    // Processar arquivos se foram enviados
    const uploadedDocuments: any[] = [];
    
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (files) {
      console.log('📤 Processando arquivos (documento frente, verso, selfie e comprovante de residência)...');
      
      // Preparar dados do usuário para a estrutura de pastas no Google Drive
      const userDataForUpload = {
        state: state || 'XX',
        fullName: fullName || 'Usuario',
        cpf: cpf || '',
        cnpj: cnpj || '',
        accountCategory: accountCategory || ''
      };

      // Processar cada tipo de documento
      if (files.documentFront) {
        const doc = await uploadFile(files.documentFront[0], user.id, 'document_front', pool, userDataForUpload);
        if (doc) uploadedDocuments.push(doc);
      }
      
      if (files.documentBack) {
        const doc = await uploadFile(files.documentBack[0], user.id, 'document_back', pool, userDataForUpload);
        if (doc) uploadedDocuments.push(doc);
      }
      
      if (files.selfie) {
        const doc = await uploadFile(files.selfie[0], user.id, 'selfie', pool, userDataForUpload);
        if (doc) uploadedDocuments.push(doc);
      }
      
      if (files.residenceProof) {
        const doc = await uploadFile(files.residenceProof[0], user.id, 'residence_proof', pool, userDataForUpload);
        if (doc) uploadedDocuments.push(doc);
      }
    }
    
    // Enviar notificação WhatsApp
    try {
      console.log('📱 Enviando notificação WhatsApp...');
      const formDataForNotification = {
        fullName: fullName || '',
        email: email || '',
        phone: phone,
        cpf: cpf || '',
        birthDate: '', // Você pode adicionar este campo se necessário
        address: {
          cep: cep || '',
          street: street || '',
          city: city || '',
          state: state || ''
        },
        bankInfo: {
          bank: bankName,
          agency: agency,
          account: account
        }
      };
      
      await whatsappNotifier.sendFormNotification(formDataForNotification);
    } catch (whatsappError) {
      console.error('⚠️ Erro ao enviar notificação WhatsApp (não crítico):', whatsappError instanceof Error ? whatsappError.message : 'Erro desconhecido');
      // Não falha a operação se o WhatsApp falhar
    }
    
    res.json({
      success: true,
      message: 'Celular, dados bancários e documentos salvos com sucesso!',
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
    
    // Verificar se é erro de duplicação (CPF já existe, se fornecido)
    if (error instanceof Error && 'code' in error && error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'CPF já cadastrado'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar dados: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
    });
  }
});

// Rota para listar usuários do PostgreSQL
app.get('/api/users', async (req: Request, res: Response) => {
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
      message: 'Erro ao listar usuários: ' + (error instanceof Error ? error.message : 'Erro desconhecido'),
      data: []
    });
  }
});

// Rota para buscar CEP
app.get('/api/cep/:cep', async (req: Request, res: Response) => {
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

  try {
    // Busca na API do ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();
    
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
  } catch (error) {
    console.error('❌ Erro ao buscar CEP:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar CEP'
    });
  }
});

// Rota de teste para WhatsApp Grupo
app.post('/api/test-whatsapp-group', async (req: Request, res: Response) => {
  try {
    const { message, groupId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Mensagem é obrigatória'
      });
    }

    console.log('🧪 Testando notificação WhatsApp para GRUPO...');
    
    if (!whatsappNotifier.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está configurado. Verifique as variáveis de ambiente.'
      });
    }

    const success = await whatsappNotifier.sendToGroup(
      `🧪 TESTE DE NOTIFICAÇÃO GRUPO\n\n${message}\n\n⏰ ${new Date().toLocaleString('pt-BR')}`,
      groupId
    );

    if (success) {
      res.json({
        success: true,
        message: 'Notificação WhatsApp enviada para grupo com sucesso!',
        recipientType: whatsappNotifier.getRecipientType(),
        recipient: whatsappNotifier.getCurrentRecipient()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao enviar notificação WhatsApp para grupo'
      });
    }
  } catch (error) {
    console.error('❌ Erro no teste WhatsApp grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no teste WhatsApp grupo'
    });
  }
});

// Rota de teste para WhatsApp
app.post('/api/test-whatsapp', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Mensagem é obrigatória'
      });
    }

    console.log('🧪 Testando notificação WhatsApp...');
    
    if (!whatsappNotifier.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está configurado. Verifique as variáveis de ambiente.'
      });
    }

    const success = await whatsappNotifier.sendSimpleNotification(
      `🧪 TESTE DE NOTIFICAÇÃO\n\n${message}\n\n⏰ ${new Date().toLocaleString('pt-BR')}`
    );

    if (success) {
      res.json({
        success: true,
        message: 'Notificação WhatsApp enviada com sucesso!',
        recipientType: whatsappNotifier.getRecipientType(),
        recipient: whatsappNotifier.getCurrentRecipient()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao enviar notificação WhatsApp'
      });
    }
  } catch (error) {
    console.error('❌ Erro no teste WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no teste WhatsApp'
    });
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Backend funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint para verificar variáveis de ambiente
app.get('/debug/env', (req: Request, res: Response) => {
  res.json({
    success: true,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      FRONTEND_URL: process.env.FRONTEND_URL,
      CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
      hasDatabase: !!process.env.DATABASE_URL,
      hasAWS: !!process.env.AWS_ACCESS_KEY_ID,
      kommoEnabled: process.env.KOMMO_ENABLED === 'true',
      hasKommoToken: !!process.env.KOMMO_ACCESS_TOKEN,
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🗄️ Conectado ao PostgreSQL e AWS S3`);
});

export default app;
