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
  cnpj?: string;  // Adicionando CNPJ como opcional
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
  private recipientNumber: string;
  private groupId: string;
  private enabled: boolean;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.recipientNumber = process.env.WHATSAPP_RECIPIENT_NUMBER || '';
    this.groupId = process.env.WHATSAPP_GROUP_ID || '';
    this.enabled = process.env.WHATSAPP_ENABLED === 'true';
  }

  private formatTemplateMessage(formData: FormData): any {
    // Usar CPF ou CNPJ completo (prioridade para CPF)
    let documento = '';
    if (formData.cpf && formData.cpf.trim()) {
      documento = formData.cpf;
    } else if (formData.cnpj && formData.cnpj.trim()) {
      documento = formData.cnpj;
    } else {
      documento = 'Não informado';
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

    let message = `🚨 *NOVO FORMULÁRIO PREENCHIDO!*

📅 *Data/Hora:* ${timestamp}

👤 *Dados Pessoais:*
• Nome: ${formData.fullName}
• Email: ${formData.email}
• Telefone: ${formData.phone}
• CPF: ${formData.cpf}`;

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

    // Adicionar link da pasta se disponível
    if (formData.documentsFolder?.url) {
      message += `\n\n📁 *Documentos:*
🔗 *Pasta no Drive:* ${formData.documentsFolder.url}`;
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

    if (!this.recipientNumber && !this.groupId) {
      console.error('WhatsApp configuration incomplete: no recipient number or group ID');
      return false;
    }

    // Log dos dados da pasta para debug
    console.log('📁 Dados da pasta para WhatsApp:', formData.documentsFolder);

    // Determinar o destinatário (número individual prioritário para templates)
    const recipient = this.recipientNumber || this.groupId;
    console.log(`📱 Enviando notificação TEMPLATE para: ${this.recipientNumber ? 'NÚMERO' : 'GRUPO'} - ${recipient}`);

    try {
      const message: WhatsAppMessage = {
        messaging_product: "whatsapp",
        to: recipient,
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

      console.log('WhatsApp notification sent successfully:', response.data);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Response data:', axiosError.response?.data);
        console.error('Response status:', axiosError.response?.status);
      }
      return false;
    }
  }

  async sendSimpleNotification(message: string): Promise<boolean> {
    if (!this.enabled) {
      console.log('WhatsApp notifications disabled');
      return false;
    }

    // Determinar o destinatário (grupo ou número individual)
    const recipient = this.groupId || this.recipientNumber;

    try {
      const whatsappMessage: WhatsAppMessage = {
        messaging_product: "whatsapp",
        to: recipient,
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

      console.log('WhatsApp simple notification sent:', response.data);
      return true;
    } catch (error) {
      console.error('Error sending simple WhatsApp notification:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Response data:', axiosError.response?.data);
        console.error('Response status:', axiosError.response?.status);
      }
      return false;
    }
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
           (!!this.recipientNumber || !!this.groupId);
  }

  // Método específico para enviar para grupo
  async sendToGroup(message: string, groupId?: string): Promise<boolean> {
    if (!this.enabled) {
      console.log('WhatsApp notifications disabled');
      return false;
    }

    const targetGroup = groupId || this.groupId;
    if (!targetGroup) {
      console.error('No group ID provided');
      return false;
    }

    try {
      const whatsappMessage: WhatsAppMessage = {
        messaging_product: "whatsapp",
        to: targetGroup,
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

      console.log('WhatsApp group message sent:', response.data);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp group message:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Response data:', axiosError.response?.data);
        console.error('Response status:', axiosError.response?.status);
      }
      return false;
    }
  }

  // Método para verificar tipo de destinatário
  getRecipientType(): string {
    if (this.groupId) return 'GROUP';
    if (this.recipientNumber) return 'INDIVIDUAL';
    return 'NONE';
  }

  // Método para obter o destinatário atual
  getCurrentRecipient(): string {
    return this.groupId || this.recipientNumber || '';
  }
}

export const whatsappNotifier = new WhatsAppNotifier();
