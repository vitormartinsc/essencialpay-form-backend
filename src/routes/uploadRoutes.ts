import { Router, Request, Response } from 'express';
import { uploadDocuments } from '../middleware/upload';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

/**
 * @route POST /api/upload/documents
 * @desc Upload de múltiplos documentos
 * @access Public
 */
router.post('/documents', uploadDocuments, asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Nenhum arquivo foi enviado'
    });
  }

  // Processar arquivos enviados
  const uploadedFiles = files.map(file => ({
    fieldname: file.fieldname,
    originalname: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    url: `/uploads/${file.filename}`
  }));

  const response: ApiResponse = {
    success: true,
    message: `${files.length} arquivo(s) enviado(s) com sucesso`,
    data: {
      files: uploadedFiles,
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0)
    }
  };

  res.json(response);
}));

/**
 * @route POST /api/upload/single
 * @desc Upload de um único documento
 * @access Public
 */
router.post('/single', uploadDocuments, asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Nenhum arquivo foi enviado'
    });
  }

  const file = files[0];
  const uploadedFile = {
    fieldname: file.fieldname,
    originalname: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    url: `/uploads/${file.filename}`
  };

  const response: ApiResponse = {
    success: true,
    message: 'Arquivo enviado com sucesso',
    data: {
      file: uploadedFile
    }
  };

  res.json(response);
}));

/**
 * @route DELETE /api/upload/:filename
 * @desc Deletar arquivo enviado
 * @access Public
 */
router.delete('/:filename', asyncHandler(async (req: Request, res: Response) => {
  const { filename } = req.params;
  const fs = require('fs').promises;
  const path = require('path');

  try {
    const filePath = path.join(process.cwd(), 'uploads', filename);
    await fs.unlink(filePath);

    const response: ApiResponse = {
      success: true,
      message: 'Arquivo deletado com sucesso'
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Arquivo não encontrado'
    };

    res.status(404).json(response);
  }
}));

export default router;
