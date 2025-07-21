// Teste do template aprovado pelo Meta
import { config } from 'dotenv';
config({ path: '.env' });

import { whatsappNotifier } from './src/utils/whatsapp';

async function testTemplate() {
  console.log('🧪 TESTANDO TEMPLATE APROVADO - essencialpay_push');
  console.log('');
  
  const testData = {
    fullName: 'Jennifer Oliveira',
    email: 'vitormartinscarvalho@gmail.com',
    phone: '(31) 99655-7722',
    cpf: '154.024.786-43',
    birthDate: '',
    address: {
      cep: '',
      street: '',
      city: '',
      state: 'MS'
    },
    bankInfo: {
      bank: 'Inter',
      agency: '0001',
      account: '012212-1'
    },
    documentsFolder: {
      url: 'https://drive.google.com/drive/folders/1GoVCb8NpBFn7kORee0giY5jrU7aO45DI',
      folderId: '1GoVCb8NpBFn7kORee0giY5jrU7aO45DI'
    }
  };
  
  console.log('📱 Enviando template para número individual...');
  console.log('📞 Destinatário: 5531996557722');
  console.log('📋 Template: essencialpay_push');
  console.log('');
  
  console.log('📋 Dados que serão enviados:');
  console.log('1. Nome:', testData.fullName);
  console.log('2. Email:', testData.email);
  console.log('3. Telefone:', testData.phone);
  console.log('4. CPF completo:', testData.cpf);
  console.log('5. Estado:', testData.address.state);
  console.log('6. Banco:', testData.bankInfo.bank);
  console.log('7. Agência:', testData.bankInfo.agency);
  console.log('8. Conta:', testData.bankInfo.account);
  console.log('9. Pasta:', testData.documentsFolder.url);
  console.log('');
  
  try {
    const result = await whatsappNotifier.sendFormNotification(testData);
    
    if (result) {
      console.log('🎉 SUCESSO! Template enviado!');
      console.log('');
      console.log('✅ Verifique seu WhatsApp (5531996557722)');
      console.log('📩 Deve aparecer uma mensagem formatada com o template aprovado');
      console.log('🔗 Com o link da pasta do Google Drive');
    } else {
      console.log('❌ Falha no envio do template');
    }
  } catch (error) {
    console.error('❌ Erro durante o envio:', error);
  }
}

testTemplate();
