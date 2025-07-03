import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do transportador de email
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true para 465, false para outros
  auth: {
    user: process.env.EMAIL_HOST_USER,
    pass: process.env.EMAIL_HOST_PASSWORD,
  },
});

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.DEFAULT_FROM_EMAIL,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      attachments: emailData.attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado com sucesso para:', emailData.to);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return false;
  }
}

export function generateFormSubmissionEmail(userData: any): string {
  return `
    <h2>Novo Formulário Recebido - Essencial Pay</h2>
    <h3>Dados Pessoais:</h3>
    <ul>
      <li><strong>Nome:</strong> ${userData.fullName}</li>
      <li><strong>CPF:</strong> ${userData.cpf}</li>
      <li><strong>Email:</strong> ${userData.email}</li>
      <li><strong>Telefone:</strong> ${userData.phone}</li>
      ${userData.cnpj ? `<li><strong>CNPJ:</strong> ${userData.cnpj}</li>` : ''}
    </ul>
    
    <h3>Endereço:</h3>
    <ul>
      <li><strong>CEP:</strong> ${userData.cep}</li>
      <li><strong>Estado:</strong> ${userData.state}</li>
      <li><strong>Cidade:</strong> ${userData.city}</li>
      <li><strong>Bairro:</strong> ${userData.neighborhood}</li>
      <li><strong>Rua:</strong> ${userData.street}</li>
      <li><strong>Número:</strong> ${userData.number}</li>
      ${userData.complement ? `<li><strong>Complemento:</strong> ${userData.complement}</li>` : ''}
    </ul>
    
    <h3>Dados Bancários:</h3>
    <ul>
      <li><strong>Banco:</strong> ${userData.bankName}</li>
      <li><strong>Tipo de Conta:</strong> ${userData.accountType}</li>
      <li><strong>Agência:</strong> ${userData.agency}</li>
      <li><strong>Conta:</strong> ${userData.account}</li>
    </ul>
    
    <h3>Documentos:</h3>
    <ul>
      <li><strong>Tipo de Documento:</strong> ${userData.documentType}</li>
      ${userData.documentFrontUrl ? `<li><strong>Documento Frente:</strong> <a href="${userData.documentFrontUrl}">Ver arquivo</a></li>` : ''}
      ${userData.documentBackUrl ? `<li><strong>Documento Verso:</strong> <a href="${userData.documentBackUrl}">Ver arquivo</a></li>` : ''}
      ${userData.residenceProofUrl ? `<li><strong>Comprovante de Residência:</strong> <a href="${userData.residenceProofUrl}">Ver arquivo</a></li>` : ''}
    </ul>
    
    <p><small>Formulário enviado em: ${new Date().toLocaleString('pt-BR')}</small></p>
  `;
}
