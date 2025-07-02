/**
 * Backend validation utilities based on frontend formatters
 */

/**
 * Clean and format CPF for validation
 */
export const cleanCpf = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

/**
 * Format CPF to XXX.XXX.XXX-XX pattern
 */
export const formatCpf = (value: string): string => {
  const onlyDigits = value.replace(/\D/g, '').slice(0, 11);
  return onlyDigits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

/**
 * Validate CPF format and check digits
 */
export const validateCpf = (cpf: string): boolean => {
  const cleanCpf = cpf.replace(/\D/g, '');
  
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cleanCpf.charAt(10));
};

/**
 * Format CNPJ to XX.XXX.XXX/XXXX-XX pattern
 */
export const formatCnpj = (value: string): string => {
  const onlyDigits = value.replace(/\D/g, '').slice(0, 14);
  return onlyDigits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

/**
 * Validate CNPJ format and check digits
 */
export const validateCnpj = (cnpj: string): boolean => {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  
  if (cleanCnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCnpj)) return false;

  let sum = 0;
  const weight1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCnpj.charAt(i)) * weight1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleanCnpj.charAt(12))) return false;

  sum = 0;
  const weight2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCnpj.charAt(i)) * weight2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  return digit2 === parseInt(cleanCnpj.charAt(13));
};

/**
 * Format phone to (XX) XXXXX-XXXX pattern
 */
export const formatPhone = (value: string): string => {
  const onlyDigits = value.replace(/\D/g, '').slice(0, 11);
  return onlyDigits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
};

/**
 * Validate phone format
 */
export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

/**
 * Format CEP to XXXXX-XXX pattern
 */
export const formatCep = (value: string): string => {
  value = value.replace(/\D/g, '');
  if (value.length > 5) {
    value = value.slice(0, 5) + '-' + value.slice(5, 8);
  }
  return value;
};

/**
 * Validate CEP format
 */
export const validateCep = (cep: string): boolean => {
  const cleanCep = cep.replace(/\D/g, '');
  return cleanCep.length === 8;
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
};

/**
 * Format agency to XXXX pattern
 */
export const formatAgency = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 4);
};

/**
 * Format account to allow digits and dash
 */
export const formatAccount = (value: string): string => {
  return value.replace(/[^0-9-]/g, '').slice(0, 15);
};

/**
 * Validate PIX key format (email, CPF, CNPJ, phone or random key)
 */
export const validatePixKey = (pixKey: string): boolean => {
  if (!pixKey.trim()) return true; // Optional field
  
  // Email pattern
  if (pixKey.includes('@')) {
    return validateEmail(pixKey);
  }
  
  // CPF pattern
  if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(pixKey)) {
    return validateCpf(pixKey);
  }
  
  // CNPJ pattern
  if (/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(pixKey)) {
    return validateCnpj(pixKey);
  }
  
  // Phone pattern
  if (/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(pixKey)) {
    return validatePhone(pixKey);
  }
  
  // Random key (UUID format)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pixKey)) {
    return true;
  }
  
  return false;
};

/**
 * Sanitize string by removing special characters
 */
export const sanitizeString = (value: string): string => {
  return value.trim().replace(/[<>]/g, '');
};

/**
 * Generate a unique filename for uploads
 */
export const generateFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
};
