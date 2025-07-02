import { Router } from 'express';
import userRoutes from './userRoutes';
import uploadRoutes from './uploadRoutes';

const router = Router();

// Rotas da API
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);

// Rota de health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;
