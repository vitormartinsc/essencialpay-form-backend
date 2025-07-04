# Exemplos de Uso da API com Integração Kommo

## 1. Criação de Usuário (com atualização automática no Kommo)

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "João Silva",
    "email": "joao@exemplo.com",
    "cpf": "12345678901",
    "phone": "11987654321",
    "cep": "01234567",
    "street": "Rua das Flores",
    "number": "123",
    "complement": "Apt 45",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "cnpj": "12345678000195",
    "bankName": "Banco do Brasil",
    "accountType": "Conta Corrente",
    "agency": "1234",
    "account": "56789-0",
    "documentType": "RG"
  }'
```

## 2. Teste da Integração Kommo

```bash
curl -X POST http://localhost:8080/debug/test-kommo \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "11987654321"
  }'
```

## 3. Verificar Configuração

```bash
curl http://localhost:8080/debug/env
```

## 4. Health Check

```bash
curl http://localhost:8080/health
```

## Respostas Esperadas

### Sucesso na criação de usuário:
```json
{
  "success": true,
  "message": "Usuário e documentos salvos com sucesso!",
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "created_at": "2025-01-04T...",
    "documents": []
  }
}
```

### Sucesso no teste do Kommo:
```json
{
  "success": true,
  "message": "Teste de integração com Kommo executado com sucesso!",
  "data": {
    "phone": "11987654321",
    "testData": { ... }
  }
}
```

### Verificação de ambiente:
```json
{
  "success": true,
  "environment": {
    "NODE_ENV": "development",
    "PORT": "8080",
    "hasDatabase": true,
    "hasAWS": true,
    "kommoEnabled": true,
    "hasKommoToken": true
  }
}
```
