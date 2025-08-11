import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { S3Client } from '@aws-sdk/client-s3';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env PRIMEIRO
dotenv.config({ path: '.env' });

// Agora importar módulos que dependem das variáveis de ambiente
import { UserData } from './utils/kommo';
import { whatsappNotifier } from './utils/whatsapp';
import BackgroundProcessor, { BackgroundTaskData, UserDataForUpload } from './utils/backgroundProcessor';

// 🚨 FORÇAR DATABASE_URL para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  process.env.DATABASE_URL = process.env.DATABASE_URL_EXTERNAL;
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
  max: 5, // Máximo de 5 conexões para evitar limites do Railway
  idleTimeoutMillis: 30000, // 30 segundos
  connectionTimeoutMillis: 20000, // 20 segundos para timeout
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Instanciar o processador de background
const backgroundProcessor = new BackgroundProcessor(pool);

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

// Usar sempre as configurações do .env se disponíveis, caso contrário usar fallback
const corsOrigins = process.env.CORS_ALLOWED_ORIGINS 
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5137', 'http://localhost:8080'];

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
    
    // 🚀 RETORNAR SUCESSO IMEDIATAMENTE - PROCESSAMENTO EM BACKGROUND
    // Responder ao frontend imediatamente após salvar no banco
    res.json({
      success: true,
      message: 'Dados salvos com sucesso! Sua solicitação está sendo processada.',
      data: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        created_at: user.created_at
      }
    });

    // 🔄 PROCESSAR INTEGRAÇÕES EM BACKGROUND (sem bloquear o frontend)
    // Preparar dados para processamento em background
    const userDataForKommo: UserData = {
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

    const userDataForUpload: UserDataForUpload = {
      state: state || 'XX',
      fullName: fullName || 'Usuario',
      cpf: cpf || '',
      cnpj: cnpj || '',
      accountCategory: accountCategory || ''
    };

    const formDataForNotification = {
      fullName: fullName || '',
      email: email || '',
      phone: phone,
      cpf: cpf || '',
      cnpj: cnpj || '',
      birthDate: '',
      address: {
        cep: cep || '',
        street: street || '',
        city: city || '',
        state: state || ''
      },
      bankInfo: {
        bank: bankName,
        agency: agency,
        account: account,
        accountType: accountType
      }
    };

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const backgroundTask: BackgroundTaskData = {
      userId: user.id,
      userDataForKommo,
      userDataForUpload,
      files,
      documentType,
      formDataForNotification
    };

    // Executar processamento em background (não aguardar conclusão)
    backgroundProcessor.processBackgroundTasks(backgroundTask)
      .then(() => {
        console.log(`✅ Processamento em background concluído para usuário ${user.id}`);
      })
      .catch((error) => {
        console.error(`❌ Erro no processamento em background para usuário ${user.id}:`, 
          error instanceof Error ? error.message : 'Erro desconhecido');
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
      const recipientInfo = whatsappNotifier.getRecipientInfo();
      res.json({
        success: true,
        message: 'Notificação WhatsApp enviada com sucesso!',
        recipientCount: recipientInfo.count,
        recipients: recipientInfo.numbers
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
      googleDriveEnabled: process.env.GOOGLE_DRIVE_ENABLED === 'true',
      hasGoogleCredentials: !!process.env.GOOGLE_CREDENTIALS,
      hasSharedDriveId: !!process.env.GOOGLE_SHARED_DRIVE_ID,
      whatsappEnabled: process.env.WHATSAPP_ENABLED === 'true',
      hasWhatsappToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
    }
  });
});

// Endpoint para testar template WhatsApp com CNPJ
app.post('/api/test-whatsapp-template', async (req: Request, res: Response) => {
  try {
    const { useCnpj = false } = req.body;
    
    console.log('🧪 Testando template WhatsApp com documento:', useCnpj ? 'CNPJ' : 'CPF');
    
    if (!whatsappNotifier.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está configurado. Verifique as variáveis de ambiente.'
      });
    }

    // Dados de teste
    const testFormData = {
      fullName: useCnpj ? "Empresa Teste LTDA" : "João Silva",
      email: useCnpj ? "empresa@teste.com" : "joao@teste.com",
      phone: "(31) 99999-9999",
      cpf: useCnpj ? "" : "123.456.789-00", // Se usar CNPJ, CPF fica vazio
      cnpj: useCnpj ? "12.345.678/0001-90" : "", // Se usar CPF, CNPJ fica vazio
      birthDate: "",
      address: {
        cep: "30000-000",
        street: "Rua Teste, 123",
        city: "Belo Horizonte",
        state: "MG"
      },
      bankInfo: {
        bank: "Banco Teste",
        agency: "1234",
        account: "567890",
        accountType: "corrente"
      },
      documentsFolder: {
        url: "https://drive.google.com/drive/folders/teste",
        folderId: "123abc"
      }
    };

    console.log('📄 Dados de teste:', {
      cpf: testFormData.cpf,
      cnpj: testFormData.cnpj,
      documento_sera_usado: useCnpj ? 'CNPJ' : 'CPF'
    });

    const success = await whatsappNotifier.sendFormNotification(testFormData);

    if (success) {
      const recipientInfo = whatsappNotifier.getRecipientInfo();
      res.json({
        success: true,
        message: `Template WhatsApp enviado com sucesso usando ${useCnpj ? 'CNPJ' : 'CPF'}!`,
        recipientCount: recipientInfo.count,
        recipients: recipientInfo.numbers,
        testData: {
          cpf: testFormData.cpf,
          cnpj: testFormData.cnpj,
          documentoUsado: useCnpj ? 'CNPJ' : 'CPF'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Falha ao enviar template WhatsApp'
      });
    }

  } catch (error) {
    console.error('❌ Erro ao testar template WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no teste do template WhatsApp'
    });
  }
});

// Endpoint para testar WhatsApp sem arquivos (verificar criação de pasta)
app.post('/api/test-whatsapp-no-files', async (req: Request, res: Response) => {
  try {
    console.log('🧪 Testando notificação WhatsApp sem arquivos...');
    
    if (!whatsappNotifier.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está configurado. Verifique as variáveis de ambiente.'
      });
    }

    // Dados de teste sem arquivos
    const testFormData = {
      fullName: "João da Silva",
      email: "joao@teste.com",
      phone: "(31) 99999-9999",
      cpf: "123.456.789-00",
      cnpj: "",
      birthDate: "",
      address: {
        cep: "30000-000",
        street: "Rua Teste, 123",
        city: "Belo Horizonte",
        state: "MG"
      },
      bankInfo: {
        bank: "Banco Teste",
        agency: "1234",
        account: "567890"
      }
    };

    // Simular processamento em background
    const backgroundProcessor = new BackgroundProcessor(pool);
    
    // Simular dados para background (sem arquivos)
    const backgroundTask = {
      userId: 999,
      userDataForKommo: testFormData as any,
      userDataForUpload: {
        state: testFormData.address.state,
        fullName: testFormData.fullName,
        cpf: testFormData.cpf,
        cnpj: testFormData.cnpj,
        accountCategory: 'pessoa_fisica'
      },
      files: undefined, // Sem arquivos
      documentType: undefined,
      formDataForNotification: testFormData
    };

    // Executar processamento (que deve criar a pasta e enviar WhatsApp)
    await backgroundProcessor.processBackgroundTasks(backgroundTask);

    res.json({
      success: true,
      message: 'Teste sem arquivos executado com sucesso! Verifique os logs e a mensagem WhatsApp.',
      testData: testFormData
    });

  } catch (error) {
    console.error('❌ Erro no teste WhatsApp sem arquivos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no teste WhatsApp sem arquivos'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🗄️ Conectado ao PostgreSQL e AWS S3`);
});

export default app;
