# Como Enviar Notificações para Grupos WhatsApp

## 🔧 Configuração Básica

### 1. Configurar o .env
```env
# Configuração para GRUPO (prioridade)
WHATSAPP_GROUP_ID=123456789-123456789@g.us

# OU configuração para NÚMERO INDIVIDUAL
WHATSAPP_RECIPIENT_NUMBER=5511999999999
```

**Importante:** Se `WHATSAPP_GROUP_ID` estiver preenchido, ele terá prioridade sobre `WHATSAPP_RECIPIENT_NUMBER`.

## 📱 Como Obter o ID do Grupo

### Método 1: Usando Webhook (Recomendado)

1. **Configure um webhook** no Meta for Developers
2. **Envie uma mensagem** para o grupo desejado
3. **Capture o ID** no payload do webhook:
   ```json
   {
     "messages": [{
       "from": "123456789-123456789@g.us",
       "id": "...",
       "text": { "body": "..." }
     }]
   }
   ```

### Método 2: Usando WhatsApp Web Inspector

1. Abra **WhatsApp Web** no navegador
2. **Inspecione elemento** (F12)
3. Vá para o grupo desejado
4. Na **aba Network**, procure por requisições
5. O ID aparecerá nos payloads

### Método 3: Usando Ferramentas Terceiras

- **WA Inspector**: Extensões do Chrome
- **WhatsApp Business API Explorer**: Meta for Developers
- **Postman**: Collections da API WhatsApp

## 🚀 Testando Grupos

### Teste Individual
```bash
POST /api/test-whatsapp
Content-Type: application/json

{
  "message": "Teste para número individual"
}
```

### Teste Grupo (ID configurado no .env)
```bash
POST /api/test-whatsapp-group
Content-Type: application/json

{
  "message": "Teste para grupo configurado"
}
```

### Teste Grupo (ID específico)
```bash
POST /api/test-whatsapp-group
Content-Type: application/json

{
  "message": "Teste para grupo específico",
  "groupId": "123456789-123456789@g.us"
}
```

## ⚠️ Limitações dos Grupos

### API Oficial do WhatsApp Business

1. **Bot deve estar no grupo**
   - Adicione o número business como participante
   - O número deve estar verificado

2. **Janela de 24 horas**
   - Só pode enviar se alguém do grupo interagiu nas últimas 24h
   - Depois de 24h, precisa usar templates pré-aprovados

3. **Permissões do grupo**
   - Verificar se o bot tem permissão para enviar mensagens
   - Alguns grupos restringem mensagens de bots

4. **Limitações de rate**
   - Limite de mensagens por minuto/hora
   - Varia conforme o plano da API

## 🔄 Prioridade de Destinatários

O sistema funciona com esta ordem de prioridade:

1. **Método específico**: `sendToGroup(message, groupId)`
2. **Variável GROUP_ID**: `WHATSAPP_GROUP_ID` no .env
3. **Variável INDIVIDUAL**: `WHATSAPP_RECIPIENT_NUMBER` no .env

## 📝 Exemplos de Uso

### Configuração para Grupo
```env
WHATSAPP_ENABLED=true
WHATSAPP_ACCESS_TOKEN=EAAxxxxx...
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_GROUP_ID=123456789-123456789@g.us
WHATSAPP_RECIPIENT_NUMBER=  # Deixar vazio ou como backup
```

### Configuração para Individual
```env
WHATSAPP_ENABLED=true
WHATSAPP_ACCESS_TOKEN=EAAxxxxx...
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_GROUP_ID=  # Deixar vazio
WHATSAPP_RECIPIENT_NUMBER=5511999999999
```

### Configuração Mista (Flexível)
```env
WHATSAPP_ENABLED=true
WHATSAPP_ACCESS_TOKEN=EAAxxxxx...
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_GROUP_ID=123456789-123456789@g.us  # Prioridade
WHATSAPP_RECIPIENT_NUMBER=5511999999999     # Backup
```

## 🛠️ Métodos Disponíveis

### 1. `sendFormNotification(formData)`
- Envia notificação completa do formulário
- Usa prioridade: GROUP_ID → RECIPIENT_NUMBER

### 2. `sendSimpleNotification(message)`
- Envia mensagem simples
- Usa prioridade: GROUP_ID → RECIPIENT_NUMBER

### 3. `sendToGroup(message, groupId?)`
- Envia especificamente para grupo
- groupId opcional (usa o configurado se não informado)

### 4. `getRecipientType()`
- Retorna: 'GROUP', 'INDIVIDUAL', ou 'NONE'

### 5. `getCurrentRecipient()`
- Retorna o destinatário atual (ID do grupo ou número)

## 🐛 Troubleshooting

### Erro: "Chat not found"
- ✅ Verificar se o ID do grupo está correto
- ✅ Confirmar que o bot está no grupo
- ✅ Testar com grupo que interagiu recentemente

### Erro: "Message not delivered"
- ✅ Verificar permissões do grupo
- ✅ Confirmar que não é um grupo muito antigo sem atividade
- ✅ Testar primeiro com mensagem simples

### Resposta vazia ou sem entrega
- ✅ Verificar se o grupo permite mensagens de bots
- ✅ Confirmar que o token tem permissões de grupo
- ✅ Verificar logs no Meta for Developers

## 📊 Monitoramento

### Logs do Sistema
```javascript
// Verificar tipo de destinatário
console.log('Tipo:', whatsappNotifier.getRecipientType());
console.log('Destinatário:', whatsappNotifier.getCurrentRecipient());

// Verificar configuração
console.log('Configurado:', whatsappNotifier.isConfigured());
```

### Meta for Developers
- Acesse o painel do seu app
- Vá para **WhatsApp > Analytics**
- Monitore entregas e erros

Com essa implementação, você pode enviar notificações tanto para grupos quanto para números individuais, com total flexibilidade de configuração! 🎉
