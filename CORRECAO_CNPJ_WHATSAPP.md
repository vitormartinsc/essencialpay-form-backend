# 🔧 Correção: CNPJ aparecendo como "Não informado" no WhatsApp

## ✅ Problema identificado e corrigido

**Problema:** Quando enviado CNPJ em vez de CPF, o template WhatsApp mostrava "CPF final: Não informado"

**Causa:** 
1. O campo `cnpj` não estava sendo passado para a notificação WhatsApp
2. A lógica priorizava CPF antes de CNPJ

## 🔧 Correções realizadas

### 1. Adicionado campo CNPJ na notificação WhatsApp
**Arquivo:** `src/index.ts` (linha ~316)
```typescript
const formDataForNotification = {
  fullName: fullName || '',
  email: email || '',
  phone: phone,
  cpf: cpf || '',
  cnpj: cnpj || '', // ✅ ADICIONADO
  // ... resto dos campos
};
```

### 2. Melhorada a lógica de prioridade de documentos
**Arquivo:** `src/utils/whatsapp.ts` 

**Lógica anterior:** CPF tinha prioridade sobre CNPJ
**Lógica nova:** CNPJ tem prioridade (pessoa jurídica), senão usa CPF (pessoa física)

```typescript
// Nova lógica inteligente:
if (formData.cnpj && formData.cnpj.trim()) {
  documento = formData.cnpj; // ✅ Prioridade para CNPJ
  console.log('📄 Usando CNPJ no template WhatsApp:', documento);
} else if (formData.cpf && formData.cpf.trim()) {
  documento = formData.cpf;
  console.log('📄 Usando CPF no template WhatsApp:', documento);
} else {
  documento = 'Não informado';
}
```

### 3. Adicionado endpoint de teste
**Novo endpoint:** `POST /api/test-whatsapp-template`

Para testar CNPJ:
```bash
curl -X POST http://localhost:8080/api/test-whatsapp-template \
  -H "Content-Type: application/json" \
  -d '{"useCnpj": true}'
```

Para testar CPF:
```bash
curl -X POST http://localhost:8080/api/test-whatsapp-template \
  -H "Content-Type: application/json" \
  -d '{"useCnpj": false}'
```

## 🧪 Como testar

### 1. Compilar o código
```bash
npm run build
```

### 2. Iniciar o servidor
```bash
npm run dev
```

### 3. Testar com CNPJ
```bash
curl -X POST http://localhost:8080/api/test-whatsapp-template \
  -H "Content-Type: application/json" \
  -d '{"useCnpj": true}'
```

### 4. Verificar logs
Você verá nos logs:
```
📄 Usando CNPJ no template WhatsApp: 12.345.678/0001-90
```

### 5. Verificar no WhatsApp
O template agora mostrará o CNPJ no campo que antes mostrava "CPF final".

## 📋 Comportamento esperado

| Cenário | CPF | CNPJ | Campo mostrado |
|---------|-----|------|----------------|
| Pessoa Física | `123.456.789-00` | *(vazio)* | `CPF: 123.456.789-00` |
| Pessoa Jurídica | *(vazio)* | `12.345.678/0001-90` | `CPF final: 12.345.678/0001-90` |
| Ambos preenchidos | `123.456.789-00` | `12.345.678/0001-90` | `CPF final: 12.345.678/0001-90` |
| Nenhum preenchido | *(vazio)* | *(vazio)* | `CPF final: Não informado` |

**Nota:** O label continua sendo "CPF final" no template Meta, mas agora mostra o CNPJ quando apropriado.

## ✅ Resultado

✅ **CNPJ agora aparece corretamente** no template WhatsApp  
✅ **Lógica inteligente** prioriza CNPJ para pessoa jurídica  
✅ **Logs detalhados** para debug  
✅ **Endpoint de teste** para validação  

Agora quando você enviar um formulário com CNPJ, ele aparecerá corretamente no campo "CPF final" da notificação WhatsApp! 🎉
