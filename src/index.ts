import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import dotenv from 'dotenv';
import { uploadFileToS3 } from './utils/s3Upload';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5176', 'http://localhost:8080'],
  credentials: true,
}));
app.use(express.json());

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas imagens e PDFs
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  },
});

// Pasta para salvar os dados (depois você substitui pelo S3)
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Rota para salvar os dados do formulário
app.post('/api/users', (req: Request, res: Response) => {
  try {
    const userData = {
      id: Date.now().toString(), // ID simples baseado no timestamp
      ...req.body,
      createdAt: new Date().toISOString()
    };

    // Salvar em arquivo JSON (depois você substitui pela integração com S3)
    const fileName = `user_${userData.id}.json`;
    const filePath = path.join(dataDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));
    
    console.log('✅ Dados salvos:', fileName);
    
    res.json({
      success: true,
      message: 'Dados salvos com sucesso!',
      data: userData
    });
  } catch (error) {
    console.error('❌ Erro ao salvar:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar os dados'
    });
  }
});

// Rota para listar usuários salvos
app.get('/api/users', (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
    const users = files.map(file => {
      const data = fs.readFileSync(path.join(dataDir, file), 'utf8');
      return JSON.parse(data);
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('❌ Erro ao listar:', error);
    res.json({
      success: true,
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

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Backend funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota de teste para upload de arquivos
app.post('/api/upload-test', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }

    console.log('📁 Arquivo recebido:', req.file.originalname);
    console.log('📊 Tamanho:', req.file.size);
    console.log('🔧 Tipo:', req.file.mimetype);

    // Fazer upload para S3
    const uploadResult = await uploadFileToS3(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'test-uploads'
    );

    if (uploadResult.success) {
      console.log('✅ Upload realizado com sucesso!');
      console.log('🔗 URL:', uploadResult.url);
      console.log('🔑 Key:', uploadResult.key);
      
      res.json({
        success: true,
        message: 'Arquivo enviado com sucesso para S3!',
        data: {
          fileName: req.file.originalname,
          url: uploadResult.url,
          key: uploadResult.key,
          size: req.file.size,
          contentType: req.file.mimetype
        }
      });
    } else {
      console.error('❌ Erro no upload:', uploadResult.error);
      res.status(500).json({
        success: false,
        message: 'Erro ao fazer upload para S3',
        error: uploadResult.error
      });
    }
  } catch (error) {
    console.error('❌ Erro na rota de upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota para servir o arquivo HTML de teste
app.get('/test-upload.html', (req: Request, res: Response) => {
  const htmlPath = path.join(__dirname, '../test-upload.html');
  res.sendFile(htmlPath);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Dados salvos em: ${dataDir}`);
});

export default app;
