# WhatsApp Multi-Recipient Setup

## Mudanças Implementadas

### 1. Suporte a Múltiplos Destinatários
- O sistema agora suporta envio para múltiplos números WhatsApp
- Configuração através da variável `WHATSAPP_RECIPIENT_NUMBERS`
- Números devem ser separados por vírgula, sem espaços

### 2. Configuração no .env

```bash
# Múltiplos números (formato: país + DDD + número, sem espaços)
WHATSAPP_RECIPIENT_NUMBERS=5511999999999,5511888888888,5511777777777,5511666666666
```

**Números configurados (exemplo):**
- +55 11 99999-9999 → `5511999999999`
- +55 11 88888-8888 → `5511888888888`  
- +55 11 77777-7777 → `5511777777777`
- +55 11 66666-6666 → `5511666666666`

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
📱 Enviando notificação TEMPLATE para 4 números: 5511999999999, 5511888888888, 5511777777777, 5511666666666
✅ WhatsApp notification sent successfully to 5511999999999
✅ WhatsApp notification sent successfully to 5511888888888
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
  "recipients": ["5511999999999", "5511888888888", "5511777777777", "5511666666666"]
}
```
