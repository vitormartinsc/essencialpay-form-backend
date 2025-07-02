import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { generateFileName } from '../utils/formatters';
import { DocumentType } from '../types';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = generateFileName(file.originalname);
    cb(null, uniqueName);
  },
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'image/heic',
    'image/heif',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Permitidos: JPG, PNG, WEBP, PDF, HEIC'));
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Maximum 10 files at once
  },
});

// Upload middleware for multiple files
export const uploadDocuments = upload.array('documents', 10);

// Upload middleware for single file
export const uploadSingle = upload.single('document');

/**
 * Validate document types based on field names
 */
export const validateDocumentTypes = (req: Request, res: any, next: any): void => {
  if (!req.files || !Array.isArray(req.files)) {
    return next();
  }

  const files = req.files as Express.Multer.File[];
  const allowedTypes = Object.values(DocumentType);

  for (const file of files) {
    // Extract document type from fieldname or body
    const documentType = req.body.documentType || DocumentType.OTHER;
    
    if (!allowedTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de documento inválido: ${documentType}`,
      });
    }

    // Add document type to file object for later use
    (file as any).documentType = documentType;
  }

  next();
};

/**
 * Clean up uploaded files in case of error
 */
export const cleanupFiles = (files: Express.Multer.File[]): void => {
  files.forEach(file => {
    fs.unlink(file.path, (err) => {
      if (err) {
        console.error('Error deleting file:', file.path, err);
      }
    });
  });
};
