import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5176'],
  credentials: true,
}));
app.use(express.json());

// Pasta para salvar os dados (depois você substitui pelo S3)
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Rota para salvar os dados do formulário
app.post('/api/users', (req, res) => {
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
app.get('/api/users', (req, res) => {
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

export default app;
