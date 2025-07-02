import { Request, Response, NextFunction } from 'express';
import { UserFormData, ValidationError } from '../types';
import {
  validateCpf,
  validateCnpj,
  validateEmail,
  validatePhone,
  validateCep,
  validatePixKey,
  sanitizeString,
} from '../utils/formatters';

/**
 * Validate user form data
 */
export const validateUserForm = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const formData: UserFormData = req.body;
  const errors: ValidationError[] = [];

  // Required field validations
  if (!formData.fullName?.trim()) {
    errors.push({ field: 'fullName', message: 'Nome completo é obrigatório' });
  } else if (formData.fullName.length < 2) {
    errors.push({ field: 'fullName', message: 'Nome deve ter pelo menos 2 caracteres' });
  }

  if (!formData.cpf) {
    errors.push({ field: 'cpf', message: 'CPF é obrigatório' });
  } else if (!validateCpf(formData.cpf)) {
    errors.push({ field: 'cpf', message: 'CPF inválido' });
  }

  // CNPJ é opcional, mas se preenchido deve ser válido
  if (formData.cnpj && !validateCnpj(formData.cnpj)) {
    errors.push({ field: 'cnpj', message: 'CNPJ inválido' });
  }

  if (!formData.rg?.trim()) {
    errors.push({ field: 'rg', message: 'RG é obrigatório' });
  }

  if (!formData.email) {
    errors.push({ field: 'email', message: 'Email é obrigatório' });
  } else if (!validateEmail(formData.email)) {
    errors.push({ field: 'email', message: 'Email inválido' });
  }

  if (!formData.phone) {
    errors.push({ field: 'phone', message: 'Telefone é obrigatório' });
  } else if (!validatePhone(formData.phone)) {
    errors.push({ field: 'phone', message: 'Telefone inválido' });
  }

  if (!formData.cep) {
    errors.push({ field: 'cep', message: 'CEP é obrigatório' });
  } else if (!validateCep(formData.cep)) {
    errors.push({ field: 'cep', message: 'CEP inválido' });
  }

  if (!formData.state?.trim()) {
    errors.push({ field: 'state', message: 'Estado é obrigatório' });
  }

  if (!formData.city?.trim()) {
    errors.push({ field: 'city', message: 'Cidade é obrigatória' });
  }

  if (!formData.neighborhood?.trim()) {
    errors.push({ field: 'neighborhood', message: 'Bairro é obrigatório' });
  }

  if (!formData.street?.trim()) {
    errors.push({ field: 'street', message: 'Rua é obrigatória' });
  }

  if (!formData.number?.trim()) {
    errors.push({ field: 'number', message: 'Número é obrigatório' });
  }

  // Validação dos dados bancários
  if (!formData.bankName?.trim()) {
    errors.push({ field: 'bankName', message: 'Nome do banco é obrigatório' });
  }

  if (!formData.accountType) {
    errors.push({ field: 'accountType', message: 'Tipo de conta é obrigatório' });
  } else if (!['corrente', 'poupanca', 'salario'].includes(formData.accountType)) {
    errors.push({ field: 'accountType', message: 'Tipo de conta inválido' });
  }

  if (!formData.agency?.trim()) {
    errors.push({ field: 'agency', message: 'Agência é obrigatória' });
  } else if (!/^\d{1,4}$/.test(formData.agency)) {
    errors.push({ field: 'agency', message: 'Agência deve conter apenas números (até 4 dígitos)' });
  }

  if (!formData.account?.trim()) {
    errors.push({ field: 'account', message: 'Conta é obrigatória' });
  }

  // PIX é opcional, mas se preenchido deve ser válido
  if (formData.pixKey && !validatePixKey(formData.pixKey)) {
    errors.push({ field: 'pixKey', message: 'Chave PIX inválida' });
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors,
    });
    return;
  }

  // Sanitize strings
  req.body = {
    ...formData,
    fullName: sanitizeString(formData.fullName),
    rg: sanitizeString(formData.rg),
    email: formData.email.trim().toLowerCase(),
    state: sanitizeString(formData.state),
    city: sanitizeString(formData.city),
    neighborhood: sanitizeString(formData.neighborhood),
    street: sanitizeString(formData.street),
    number: sanitizeString(formData.number),
    complement: formData.complement ? sanitizeString(formData.complement) : '',
    bankName: sanitizeString(formData.bankName),
    pixKey: formData.pixKey ? sanitizeString(formData.pixKey) : '',
  };

  next();
};

/**
 * Rate limiting middleware (simple implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (maxRequests: number = 10, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    const clientData = requestCounts.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      requestCounts.set(clientId, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }
    
    if (clientData.count >= maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Muitas tentativas. Tente novamente em alguns minutos.',
      });
      return;
    }
    
    clientData.count++;
    next();
  };
};
