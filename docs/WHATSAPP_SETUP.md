# Configuração do WhatsApp Business API

## Pré-requisitos

Para usar a notificação via WhatsApp, você precisa:

1. **Conta Meta for Developers**
2. **WhatsApp Business API** configurada
3. **Número de telefone business** verificado

## Passo a Passo para Configuração

### 1. Criar Aplicativo no Meta for Developers

1. Acesse [https://developers.facebook.com](https://developers.facebook.com)
2. Clique em "Meus Aplicativos" → "Criar Aplicativo"
3. Selecione "Business" → "WhatsApp"
4. Preencha os dados do aplicativo

### 2. Configurar WhatsApp Business API

1. No painel do aplicativo, vá para "WhatsApp" → "API Setup"
2. Adicione o número de telefone business
3. Verifique o número seguindo as instruções

### 3. Obter Credenciais

#### Access Token Temporário (Para testes):
1. No painel do WhatsApp API Setup
2. Copie o "Temporary access token"

#### Access Token Permanente:
1. Vá para "WhatsApp" → "Configuration"
2. Configure um webhook (opcional para receber mensagens)
3. Gere um token permanente via System User

#### Phone Number ID:
1. No painel "API Setup"
2. Copie o "Phone number ID" do número configurado

### 4. Configurar Variáveis de Ambiente

No arquivo `.env`, configure:

```env
# WhatsApp Business API Configuration
WHATSAPP_ENABLED=true
WHATSAPP_ACCESS_TOKEN=seu_access_token_aqui
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id_aqui
WHATSAPP_RECIPIENT_NUMBER=5511999999999
WHATSAPP_VERIFY_TOKEN=seu_webhook_verify_token_aqui
```

### 5. Configurar Número Destinatário

- `WHATSAPP_RECIPIENT_NUMBER`: Número que receberá as notificações
- Formato: Código do país + DDD + número (sem espaços ou símbolos)
- Exemplo Brasil: `5511999999999` (55 + 11 + 999999999)

### 6. Testar a Configuração

Para testar se está funcionando, você pode usar o endpoint de teste:

```bash
curl -X POST http://localhost:8080/api/test-whatsapp \
  -H "Content-Type: application/json" \
  -d '{"message": "Teste de notificação WhatsApp"}'
```

## Limitações da API Gratuita

- **24 horas**: Só pode enviar mensagens para números que interagiram nas últimas 24h
- **Templates**: Para mensagens fora da janela de 24h, precisa usar templates aprovados
- **Verificação**: Números precisam estar verificados no WhatsApp Business

## Alternativas Mais Simples

Se a configuração oficial for complexa, considere:

### 1. Evolution API (Não oficial)
- Mais fácil de configurar
- Usa WhatsApp Web
- Menos estável que a API oficial

### 2. Baileys (Não oficial)
- Biblioteca Node.js
- Conecta via WhatsApp Web
- Gratuita mas pode ser bloqueada

### 3. Serviços Terceirizados
- ChatAPI
- Twilio WhatsApp API
- WhatsMaker

## Estrutura da Notificação

A notificação enviada terá este formato:

```
🚨 NOVO FORMULÁRIO PREENCHIDO!

📅 Data/Hora: 21/07/2025 14:30:15

👤 Dados Pessoais:
• Nome: João Silva
• Email: joao@email.com
• Telefone: (11) 99999-9999
• CPF: 123.456.789-00
• Data Nascimento: 01/01/1990

📍 Endereço:
• CEP: 01234-567
• Rua: Rua das Flores, 123
• Cidade: São Paulo
• Estado: SP

🏦 Dados Bancários:
• Banco: Banco do Brasil
• Agência: 1234-5
• Conta: 67890-1

✅ Formulário completo recebido e processado!
```

## Troubleshooting

### Erro 401 - Unauthorized
- Verifique se o `WHATSAPP_ACCESS_TOKEN` está correto
- Token pode ter expirado (tokens temporários duram 24h)

### Erro 400 - Bad Request
- Verifique se o `WHATSAPP_PHONE_NUMBER_ID` está correto
- Número destinatário deve estar no formato correto

### Erro 403 - Forbidden
- Número destinatário pode não estar verificado
- Aplicativo pode não ter permissões suficientes

### Mensagem não chega
- Verifique se o número destinatário está correto
- Teste primeiro com o número do próprio telefone business
- Verifique se não há bloqueios ou filtros
