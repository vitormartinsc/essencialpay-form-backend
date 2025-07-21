import { WhatsAppNotifier } from './src/utils/whatsapp';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function testWhatsAppMethods() {
  console.log('🧪 TESTE DOS MÉTODOS WhatsAppNotifier');
  console.log('='.repeat(60));
  
  // Criar instância do notificador
  const whatsappNotifier = new WhatsAppNotifier();
  
  console.log('\n📋 1. Verificando configuração...');
  console.log('-'.repeat(40));
  
  const isConfigured = whatsappNotifier.isConfigured();
  const recipientInfo = whatsappNotifier.getRecipientInfo();
  
  console.log('✅ Configurado:', isConfigured);
  console.log('📱 Números configurados:', recipientInfo.count);
  console.log('📞 Lista de números:', recipientInfo.numbers);
  
  if (!isConfigured) {
    console.log('❌ WhatsApp não está configurado. Verifique o .env');
    return;
  }
  
  // Dados fake para teste
  const fakeFormData = {
    fullName: 'João Silva (TESTE FAKE)',
    email: 'joao.teste@email.com',
    phone: '(31) 99999-8888',
    cpf: '123.456.789-00',
    cnpj: '',
    birthDate: '15/03/1985',
    address: {
      cep: '30112-000',
      street: 'Rua Fake Test, 123',
      city: 'Belo Horizonte',
      state: 'MG'
    },
    bankInfo: {
      bank: 'Banco Fake',
      agency: '1234',
      account: '56789-0'
    },
    documentsFolder: {
      url: 'https://drive.google.com/drive/folders/fake-test-folder-id',
      folderId: 'fake-test-folder-id'
    }
  };
  
  console.log('\n📱 2. Testando sendSimpleNotification...');
  console.log('-'.repeat(40));
  
  try {
    const simpleResult = await whatsappNotifier.sendSimpleNotification(
      '🧪 TESTE DIRETO DOS MÉTODOS\n\nEste é um teste dos métodos WhatsApp com dados fake.\n\n⏰ ' + new Date().toLocaleString('pt-BR')
    );
    
    console.log('✅ Resultado sendSimpleNotification:', simpleResult);
  } catch (error) {
    console.error('❌ Erro sendSimpleNotification:', error);
  }
  
  // Aguardar entre testes
  console.log('\n⏳ Aguardando 3 segundos...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\n� 3. Testando sendFormNotification...');
  console.log('-'.repeat(40));
  console.log('📄 Dados fake do formulário:');
  console.log(JSON.stringify(fakeFormData, null, 2));
  
  try {
    const formResult = await whatsappNotifier.sendFormNotification(fakeFormData);
    
    console.log('✅ Resultado sendFormNotification:', formResult);
  } catch (error) {
    console.error('❌ Erro sendFormNotification:', error);
  }
  
  console.log('\n🧪 4. Testando formatMessageForTesting...');
  console.log('-'.repeat(40));
  
  try {
    const formattedMessage = whatsappNotifier.formatMessageForTesting(fakeFormData);
    
    console.log('📝 Mensagem formatada:');
    console.log(formattedMessage);
  } catch (error) {
    console.error('❌ Erro formatMessageForTesting:', error);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 TESTE DOS MÉTODOS CONCLUÍDO!');
  console.log('\n💡 Verificações realizadas:');
  console.log('   ✅ Configuração do WhatsApp');
  console.log('   ✅ Lista de destinatários');
  console.log('   ✅ Envio de mensagem simples');
  console.log('   ✅ Envio de notificação de formulário');
  console.log('   ✅ Formatação de mensagem');
  console.log('\n📱 Se configurado corretamente, todos os números devem ter recebido as mensagens!');
}

// Executar teste
console.log('🚀 Iniciando teste dos métodos WhatsAppNotifier...');
console.log('⚠️  Certifique-se de que as variáveis de ambiente estão configuradas');
console.log('');

testWhatsAppMethods().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
