// Shared types between frontend and backend

export interface UserFormData {
  fullName: string;
  cpf: string;
  cnpj?: string;
  rg: string;
  email: string;
  phone: string;
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string;
  // Dados bancários
  bankName: string;
  accountType: string;
  agency: string;
  account: string;
  pixKey?: string;
}

export interface UserDocument {
  id: string;
  userId: string;
  originalName: string;
  fileName: string;
  mimetype: string;
  size: number;
  path: string;
  documentType: DocumentType;
  uploadedAt: Date;
}

export interface User {
  id: string;
  formData: UserFormData;
  documents: UserDocument[];
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentType {
  RG = 'rg',
  CPF = 'cpf',
  CNPJ = 'cnpj',
  COMPROVANTE_RESIDENCIA = 'comprovante_residencia',
  COMPROVANTE_RENDA = 'comprovante_renda',
  FOTO_SELFIE = 'foto_selfie',
  OTHER = 'other',
}

export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  UNDER_REVIEW = 'under_review',
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}

export interface UploadResponse {
  success: boolean;
  files: {
    originalName: string;
    fileName: string;
    path: string;
    size: number;
    mimetype: string;
  }[];
  message?: string;
}
