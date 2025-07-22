
import dotenv from 'dotenv';
dotenv.config();
import { whatsappNotifier } from './whatsapp';


async function testWhatsAppTemplate() {
  if (!whatsappNotifier.isConfigured()) {
    console.error('WhatsApp não está configurado corretamente. Verifique as variáveis de ambiente.');
    process.exit(1);
  }

  // Dados fictícios para o template
  const fakeFormData = {
    fullName: 'Teste Usuário',
    email: 'teste@essencialpay.com.br',
    phone: '31999999999',
    cpf: '123.456.789-00',
    cnpj: '',
    birthDate: '01/01/1990',
    address: {
      cep: '30123-456',
      street: 'Rua de Teste',
      city: 'Belo Horizonte',
      state: 'MG',
    },
    bankInfo: {
      bank: '001 - Banco do Brasil',
      agency: '1234-5',
      account: '12345-6',
    },
    documentsFolder: {
      url: 'https://drive.google.com/teste',
      folderId: 'fake-folder-id',
    },
  };

  try {
    const result = await whatsappNotifier.sendFormNotification(fakeFormData);
    if (result) {
      console.log('Template WhatsApp enviado com sucesso!');
    } else {
      console.error('Falha ao enviar template WhatsApp. Veja os logs acima.');
    }
  } catch (error) {
    console.error('Erro ao enviar template WhatsApp:', error);
  }
}

testWhatsAppTemplate();
