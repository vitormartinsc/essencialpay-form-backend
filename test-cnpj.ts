// Teste do template com CNPJ (pessoa jurídica)
import { config } from 'dotenv';
config({ path: '.env' });

import { whatsappNotifier } from './src/utils/whatsapp';

async function testTemplateWithCNPJ() {
  console.log('🧪 TESTANDO TEMPLATE COM CNPJ - essencialpay_push');
  console.log('');
  
  const testData = {
    fullName: 'Empresa Teste LTDA',
    email: 'empresa@teste.com',
    phone: '(31) 99655-7722',
    cpf: '', // Sem CPF
    cnpj: '12.345.678/0001-90', // Com CNPJ
    birthDate: '',
    address: {
      cep: '',
      street: '',
      city: '',
      state: 'SP'
    },
    bankInfo: {
      bank: 'Bradesco',
      agency: '1234',
      account: '567890-1'
    },
    documentsFolder: {
      url: 'https://drive.google.com/drive/folders/1GoVCb8NpBFn7kORee0giY5jrU7aO45DI',
      folderId: '1GoVCb8NpBFn7kORee0giY5jrU7aO45DI'
    }
  };
  
  console.log('📱 Testando lógica CPF/CNPJ...');
  console.log('📋 CPF:', testData.cpf || 'VAZIO');
  console.log('📋 CNPJ:', testData.cnpj || 'VAZIO');
  console.log('✅ Deve usar o CNPJ já que CPF está vazio');
  console.log('');
  
  console.log('📋 Dados que serão enviados:');
  console.log('1. Nome:', testData.fullName);
  console.log('2. Email:', testData.email);
  console.log('3. Telefone:', testData.phone);
  console.log('4. Documento (CNPJ):', testData.cnpj);
  console.log('5. Estado:', testData.address.state);
  console.log('6. Banco:', testData.bankInfo.bank);
  console.log('7. Agência:', testData.bankInfo.agency);
  console.log('8. Conta:', testData.bankInfo.account);
  console.log('9. Pasta:', testData.documentsFolder.url);
  console.log('');
  
  try {
    const result = await whatsappNotifier.sendFormNotification(testData);
    
    if (result) {
      console.log('🎉 SUCESSO! Template com CNPJ enviado!');
      console.log('✅ Verifique se o CNPJ aparece corretamente no WhatsApp');
    } else {
      console.log('❌ Falha no envio do template com CNPJ');
    }
  } catch (error) {
    console.error('❌ Erro durante o envio:', error);
  }
}

testTemplateWithCNPJ();
