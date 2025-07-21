# WhatsApp Multi-Recipient Setup

## Mudanças Implementadas

### 1. Suporte a Múltiplos Destinatários
- O sistema agora suporta envio para múltiplos números WhatsApp
- Configuração através da variável `WHATSAPP_RECIPIENT_NUMBERS`
- Números devem ser separados por vírgula, sem espaços

### 2. Configuração no .env

```bash
# Múltiplos números (formato: país + DDD + número, sem espaços)
WHATSAPP_RECIPIENT_NUMBERS=5531985585575,5531985514814,5531975807468,5531972254165
```

**Números configurados:**
- +55 31 9855-8575 → `5531985585575`
- +55 31 8551-4814 → `5531985514814`  
- +55 31 7580-7468 → `5531975807468`
- +55 31 7225-4165 → `5531972254165`

### 3. Funcionalidades

#### Envio de Formulários
- Quando um formulário é preenchido, a notificação é enviada para **todos** os números configurados
- Usa o template Meta aprovado `essencialpay_push`
- Inclui dados pessoais, bancários e link da pasta do Google Drive

#### Envio de Testes
- Rota `/api/test-whatsapp` envia mensagem de teste para todos os números
- Retorna estatísticas de sucesso/erro por número

#### Rate Limiting
- Delay de 1 segundo entre envios para evitar bloqueios da API
- Logs detalhados para cada envio individual

### 4. Logs e Monitoramento

```
📱 Enviando notificação TEMPLATE para 4 números: 5531985585575, 5531985514814, 5531975807468, 5531972254165
✅ WhatsApp notification sent successfully to 5531985585575
✅ WhatsApp notification sent successfully to 5531985514814
📊 WhatsApp Envios: 4/4 sucessos
```

### 5. Compatibilidade
- ✅ Mantém suporte à variável antiga `WHATSAPP_RECIPIENT_NUMBER` 
- ✅ Template Meta `essencialpay_push` inalterado
- ✅ Sem lógica de grupos (removida conforme limitação da API)

### 6. Teste
Para testar o sistema:

```bash
curl -X POST http://localhost:8080/api/test-whatsapp \
  -H "Content-Type: application/json" \
  -d '{"message": "Teste de múltiplos destinatários"}'
```

Retorno esperado:
```json
{
  "success": true,
  "message": "Notificação WhatsApp enviada com sucesso!",
  "recipientCount": 4,
  "recipients": ["5531985585575", "5531985514814", "5531975807468", "5531972254165"]
}
```
