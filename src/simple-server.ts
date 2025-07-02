import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(cors({
  origin: 'http://localhost:5176',
  credentials: true,
}));
app.use(express.json());

// Rota de teste
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Importar e usar rotas apenas se não houver erro
try {
  const apiRoutes = require('./routes').default;
  app.use('/api', apiRoutes);
} catch (error: any) {
  console.log('Erro ao importar rotas:', error?.message || error);
  
  // Rotas básicas como fallback
  app.post('/api/users', (req, res) => {
    console.log('Dados recebidos:', req.body);
    res.json({
      success: true,
      message: 'Usuário criado com sucesso!',
      data: { id: '123', ...req.body }
    });
  });

  app.get('/api/users', (req, res) => {
    res.json({
      success: true,
      data: []
    });
  });
}

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

export default app;
