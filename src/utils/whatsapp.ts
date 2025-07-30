import axios from 'axios';

interface WhatsAppMessage {
  messaging_product: string;
  to: string;
  type: string;
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
  cnpj?: string;
  birthDate: string;
  address: {
    cep: string;
    street: string;
    city: string;
    state: string;
  };
  bankInfo: {
    bank: string;
    agency: string;
    account: string;
  };
  documentsFolder?: {
    url: string;
    folderId: string;
  };
}

export class WhatsAppNotifier {
  private accessToken: string;
  private phoneNumberId: string;
  private recipientNumbers: string[];
  private enabled: boolean;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    
    // Suporte para múltiplos números separados por vírgula
    const recipientNumbers = process.env.WHATSAPP_RECIPIENT_NUMBERS || process.env.WHATSAPP_RECIPIENT_NUMBER || '';
    this.recipientNumbers = recipientNumbers.split(',').map(num => num.trim()).filter(num => num.length > 0);
    
    this.enabled = process.env.WHATSAPP_ENABLED === 'true';
  }

  private formatTemplateMessage(formData: FormData): any {
    // Lógica inteligente para escolher documento:
    // Se CNPJ estiver preenchido, usar CNPJ (pessoa jurídica)
    // Senão, usar CPF (pessoa física)
    let documento = '';
    if (formData.cnpj && formData.cnpj.trim()) {
      documento = formData.cnpj;
      console.log('📄 Usando CNPJ no template WhatsApp:', documento);
    } else if (formData.cpf && formData.cpf.trim()) {
      documento = formData.cpf;
      console.log('📄 Usando CPF no template WhatsApp:', documento);
    } else {
      documento = 'Não informado';
      console.log('📄 Nenhum documento informado no template WhatsApp');
    }
    
    return {
      name: "essencialpay_push",
      language: {
        code: "pt_BR"
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: formData.fullName },                    // {{1}} Nome
            { type: "text", text: formData.email },                       // {{2}} Email  
            { type: "text", text: formData.phone },                       // {{3}} Telefone
            { type: "text", text: documento },                           // {{4}} CPF ou CNPJ completo
            { type: "text", text: formData.address.state },              // {{5}} Estado
            { type: "text", text: formData.bankInfo.bank },              // {{6}} Banco
            { type: "text", text: formData.bankInfo.agency },            // {{7}} Agência
            { type: "text", text: formData.bankInfo.account },           // {{8}} Conta
            { type: "text", text: formData.documentsFolder?.url || "Não disponível" } // {{9}} Pasta
          ]
        }
      ]
    };
  }

  private formatMessage(formData: FormData): string {
    const timestamp = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    });

    // Mesma lógica do template: prioridade para CNPJ se preenchido
    let documento = '';
    let tipoDocumento = '';
    if (formData.cnpj && formData.cnpj.trim()) {
      documento = formData.cnpj;
      tipoDocumento = 'CNPJ';
    } else if (formData.cpf && formData.cpf.trim()) {
      documento = formData.cpf;
      tipoDocumento = 'CPF';
    } else {
      documento = 'Não informado';
      tipoDocumento = 'CPF';
    }

    let message = `🚨 *NOVO FORMULÁRIO PREENCHIDO!*

📅 *Data/Hora:* ${timestamp}

👤 *Dados Pessoais:*
• Nome: ${formData.fullName}
• Email: ${formData.email}
• Telefone: ${formData.phone}
• ${tipoDocumento}: ${documento}`;

    // Adicionar data de nascimento apenas se não estiver vazia
    if (formData.birthDate && formData.birthDate.trim()) {
      message += `\n• Data Nascimento: ${formData.birthDate}`;
    }

    // Adicionar estado sempre (obrigatório)
    if (formData.address.state) {
      message += `\n\n📍 *Estado:* ${formData.address.state}`;
    }

    // Adicionar dados bancários
    message += `\n\n🏦 *Dados Bancários:*
• Banco: ${formData.bankInfo.bank}
• Agência: ${formData.bankInfo.agency}
• Conta: ${formData.bankInfo.account}`;

    // Adicionar informações sobre documentos
    message += `\n\n📁 *Documentos:*`;
    if (formData.documentsFolder?.url) {
      message += `\n🔗 *Pasta no Drive:* ${formData.documentsFolder.url}`;
    } else {
      message += `\n📋 *Status:* Aguardando envio de documentos`;
    }

    message += `\n\n✅ Formulário completo recebido e processado!`;

    return message;
  }

  async sendFormNotification(formData: FormData): Promise<boolean> {
    if (!this.enabled) {
      console.log('WhatsApp notifications disabled');
      return false;
    }

    if (!this.accessToken || !this.phoneNumberId) {
      console.error('WhatsApp configuration incomplete: missing token or phone ID');
      return false;
    }

    if (this.recipientNumbers.length === 0) {
      console.error('WhatsApp configuration incomplete: no recipient numbers');
      return false;
    }

    // Log dos dados da pasta para debug
    console.log('📁 Dados da pasta para WhatsApp:', formData.documentsFolder);

    console.log(`📱 Enviando notificação TEMPLATE para ${this.recipientNumbers.length} números: ${this.recipientNumbers.join(', ')}`);

    let successCount = 0;
    const errors: string[] = [];

    // Enviar para cada número na lista
    for (const recipientNumber of this.recipientNumbers) {
      try {
        const message: WhatsAppMessage = {
          messaging_product: "whatsapp",
          to: recipientNumber,
          type: "template",
          template: this.formatTemplateMessage(formData)
        };

        const response = await axios.post(
          `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
          message,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`✅ WhatsApp notification sent successfully to ${recipientNumber}:`, response.data);
        successCount++;
        
        // Pequeno delay entre envios para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        const errorMsg = `Error sending to ${recipientNumber}`;
        console.error(errorMsg, error);
        errors.push(errorMsg);
        
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any;
          console.error(`Response data for ${recipientNumber}:`, axiosError.response?.data);
          console.error(`Response status for ${recipientNumber}:`, axiosError.response?.status);
        }
      }
    }

    console.log(`📊 WhatsApp Envios: ${successCount}/${this.recipientNumbers.length} sucessos`);
    
    // Retorna true se pelo menos um envio foi bem-sucedido
    return successCount > 0;
  }

  async sendSimpleNotification(message: string): Promise<boolean> {
    if (!this.enabled) {
      console.log('WhatsApp notifications disabled');
      return false;
    }

    if (this.recipientNumbers.length === 0) {
      console.error('WhatsApp configuration incomplete: no recipient numbers');
      return false;
    }

    let successCount = 0;
    const errors: string[] = [];

    // Enviar para cada número na lista
    for (const recipientNumber of this.recipientNumbers) {
      try {
        const whatsappMessage: WhatsAppMessage = {
          messaging_product: "whatsapp",
          to: recipientNumber,
          type: "text",
          text: {
            body: message
          }
        };

        const response = await axios.post(
          `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
          whatsappMessage,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`✅ WhatsApp simple notification sent to ${recipientNumber}:`, response.data);
        successCount++;
        
        // Pequeno delay entre envios
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        const errorMsg = `Error sending simple notification to ${recipientNumber}`;
        console.error(errorMsg, error);
        errors.push(errorMsg);
        
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any;
          console.error(`Response data for ${recipientNumber}:`, axiosError.response?.data);
          console.error(`Response status for ${recipientNumber}:`, axiosError.response?.status);
        }
      }
    }

    console.log(`📊 WhatsApp Simple Envios: ${successCount}/${this.recipientNumbers.length} sucessos`);
    return successCount > 0;
  }

  // Método público para testar a formatação da mensagem
  public formatMessageForTesting(formData: FormData): string {
    return this.formatMessage(formData);
  }

  // Método para verificar se as configurações estão corretas
  isConfigured(): boolean {
    return this.enabled && 
           !!this.accessToken && 
           !!this.phoneNumberId && 
           this.recipientNumbers.length > 0;
  }

  // Método para obter informações dos destinatários
  getRecipientInfo(): { count: number; numbers: string[] } {
    return {
      count: this.recipientNumbers.length,
      numbers: this.recipientNumbers
    };
  }
}

// Instância singleton para uso em toda a aplicação
export const whatsappNotifier = new WhatsAppNotifier();