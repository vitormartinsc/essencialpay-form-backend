import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Configurações do Kommo
const KOMMO_ENABLED = process.env.KOMMO_ENABLED === 'true';
const KOMMO_ACCESS_TOKEN = process.env.KOMMO_ACCESS_TOKEN;
const KOMMO_BASE_URL = 'https://essencialsolutions.kommo.com';

const KOMMO_HEADERS = {
  'Authorization': `Bearer ${KOMMO_ACCESS_TOKEN}`,
  'Content-Type': 'application/json'
};

// IDs dos campos customizados do CONTATO
const KOMMO_FIELDS_CONTACT = {
  phone: 845834,      // Telefone
  email: 845836,      // Email
  cpf: 1064648,       // CPF/CNPJ
};

// IDs dos campos customizados do LEAD
const KOMMO_FIELDS_LEAD = {
  limite_disponivel: 1051320,
  valor_emprestimo: 1064640,
};

// Interfaces TypeScript
interface UserData {
  fullName?: string;
  nome?: string;
  email?: string;
  phone?: string;
  telefone?: string;
  cpf?: string;
  cnpj?: string;
  cep?: string;
  street?: string;
  logradouro?: string;
  number?: string;
  numero?: string;
  complement?: string;
  complemento?: string;
  neighborhood?: string;
  bairro?: string;
  city?: string;
  cidade?: string;
  state?: string;
  estado?: string;
  bankName?: string;
  bank_name?: string;
  accountType?: string;
  account_type?: string;
  agency?: string;
  account?: string;
  documentType?: string;
  limite_disponivel?: string;
  valor_emprestimo?: string;
}

interface KommoContact {
  id: number;
  _embedded?: {
    leads?: KommoLead[];
  };
}

interface KommoLead {
  id: number;
}

interface KommoResponse {
  _embedded?: {
    contacts?: KommoContact[];
  };
}

/**
 * Busca contato no Kommo pelo telefone
 */
async function searchContactByPhone(phoneNumber: string): Promise<KommoContact[] | null> {
  try {
    const searchContactUrl = `${KOMMO_BASE_URL}/api/v4/contacts?query=${phoneNumber}&with=leads`;
    const response = await axios.get<KommoResponse>(searchContactUrl, { headers: KOMMO_HEADERS });
    
    if (response.status !== 200) {
      return null;
    }
    
    const contacts = response.data._embedded?.contacts || [];
    return contacts;
  } catch (error) {
    console.error('Erro ao buscar contato no Kommo:', error instanceof Error ? error.message : 'Erro desconhecido');
    return null;
  }
}

/**
 * Normaliza o telefone removendo caracteres especiais
 */
function normalizePhone(phone: string | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Atualiza o lead no Kommo com dados pessoais do usuário
 */
export async function updateKommoLeadWithPersonalData(userData: UserData): Promise<void> {
  // Verifica se a integração com Kommo está habilitada
  if (!KOMMO_ENABLED) {
    console.log('Integração com Kommo desabilitada - pulando atualização de dados pessoais');
    return;
  }
  
  if (!KOMMO_ACCESS_TOKEN) {
    console.log('Token do Kommo não configurado');
    return;
  }
  
  const phoneRaw = userData.phone || userData.telefone;
  const phone = normalizePhone(phoneRaw);
  
  if (!phone) {
    console.log('Telefone não fornecido, não é possível atualizar o Kommo');
    return;
  }
  
  try {
    // 1. Buscar o contato pelo telefone normalizado
    let contacts = await searchContactByPhone(phone);
    
    // Se não encontrar, tenta sem o primeiro 9 após o DDD
    if (!contacts && phone.length > 4 && phone[2] === '9') {
      const phoneAlt = phone.slice(0, 2) + phone.slice(3);
      contacts = await searchContactByPhone(phoneAlt);
    }
    
    if (!contacts || contacts.length === 0) {
      console.log('Contato não encontrado no Kommo para o telefone:', phone);
      return;
    }
    
    const contact = contacts[0];
    const contactId = contact.id;
    
    // Buscar o lead associado ao contato
    const leads = contact._embedded?.leads || [];
    if (leads.length === 0) {
      console.log('Nenhum lead encontrado para o contato');
      return;
    }
    
    const leadId = leads[0].id;
    
    console.log(`Atualizando contato ${contactId} e lead ${leadId} no Kommo`);
    
    // 2. Atualizar o contato (nome e campos básicos)
    const contactPayload = {
      name: userData.fullName || userData.nome || '',
      custom_fields_values: [
        { field_id: KOMMO_FIELDS_CONTACT.phone, values: [{ value: phoneRaw || '' }] },
        { field_id: KOMMO_FIELDS_CONTACT.email, values: [{ value: userData.email || '' }] },
        { field_id: KOMMO_FIELDS_CONTACT.cpf, values: [{ value: userData.cpf || '' }] },
      ]
    };
    
    // Adicionar CNPJ se existir (usando mesmo campo do CPF)
    if (userData.cnpj) {
      contactPayload.custom_fields_values.push(
        { field_id: KOMMO_FIELDS_CONTACT.cpf, values: [{ value: userData.cnpj }] }
      );
    }
    
    const updateContactUrl = `${KOMMO_BASE_URL}/api/v4/contacts/${contactId}`;
    await axios.patch(updateContactUrl, contactPayload, { headers: KOMMO_HEADERS });
    
    // 3. Atualizar o lead com dados adicionais se fornecidos
    const leadFields = [];
    
    if (userData.limite_disponivel) {
      leadFields.push({ 
        field_id: KOMMO_FIELDS_LEAD.limite_disponivel, 
        values: [{ value: userData.limite_disponivel }] 
      });
    }
    
    if (userData.valor_emprestimo) {
      leadFields.push({ 
        field_id: KOMMO_FIELDS_LEAD.valor_emprestimo, 
        values: [{ value: userData.valor_emprestimo }] 
      });
    }
    
    if (leadFields.length > 0) {
      const leadPayload = { custom_fields_values: leadFields };
      
      const updateLeadUrl = `${KOMMO_BASE_URL}/api/v4/leads/${leadId}`;
      await axios.patch(updateLeadUrl, leadPayload, { headers: KOMMO_HEADERS });
    }
    
    console.log('✅ Dados pessoais atualizados no Kommo com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar dados no Kommo:', error instanceof Error ? error.message : 'Erro desconhecido');
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('Response status:', axiosError.response?.status);
      console.error('Response data:', axiosError.response?.data);
    }
  }
}

export { normalizePhone };
export type { UserData };
