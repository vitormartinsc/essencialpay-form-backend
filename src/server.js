const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

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

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Dados salvos em: ${dataDir}`);
});

module.exports = app;
