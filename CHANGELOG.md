# Changelog - Essencial Pay Form Backend

## [Versão Atual] - 2025-01-22

### ✅ Adicionado
- **API de CEP**: Nova rota `/api/cep/:cep` que busca endereços automaticamente via ViaCEP
- **Integração ViaCEP**: Preenche automaticamente campos de endereço quando o usuário digita o CEP
- **Debug Móvel**: Console de debug móvel para visualizar logs em dispositivos móveis
- **Compressão de Imagens**: Compressão automática de imagens antes do upload (máximo 20MB)
- **Logs Detalhados**: Sistema de logs detalhados para debugar problemas de upload

### ✅ Removido
- **Campo RG**: Removido do formulário e validações por não ser necessário

### ✅ Melhorado
- **Feedback Visual**: Campo CEP mostra "Buscando endereço..." durante a busca
- **Tratamento de Erros**: Melhor tratamento de erros na busca de CEP e upload de arquivos
- **Experiência do Usuário**: Preenchimento automático dos campos de endereço
- **Validação de Arquivos**: Aumento do limite de tamanho para 20MB
- **Processamento de Selfie**: Compressão automática de selfies tiradas no mobile

## Como usar a API de CEP

### Endpoint
```
GET /api/cep/:cep
```

### Exemplo
```bash
curl http://localhost:3000/api/cep/30140-001
```

### Resposta de Sucesso
```json
{
  "success": true,
  "data": {
    "cep": "30140-001",
    "logradouro": "Avenida Brasil",
    "complemento": "até 980 - lado par",
    "bairro": "Santa Efigênia",
    "localidade": "Belo Horizonte",
    "uf": "MG",
    "ibge": "3106200",
    "gia": "",
    "ddd": "31",
    "siafi": "4123"
  }
}
```

### Resposta de Erro
```json
{
  "success": false,
  "message": "CEP não encontrado"
}
```

## Campos do Formulário (Atualizados)

### Dados Pessoais
- ✅ Nome Completo (obrigatório)
- ✅ CPF (obrigatório)
- ✅ CNPJ (opcional)
- ❌ ~~RG~~ (removido)
- ✅ Email (obrigatório)
- ✅ Telefone (obrigatório)

### Endereço (Preenchimento Automático via CEP)
- ✅ CEP (obrigatório, com busca automática)
- ✅ Estado (preenchido automaticamente)
- ✅ Cidade (preenchida automaticamente)
- ✅ Bairro (preenchido automaticamente)
- ✅ Rua (preenchida automaticamente)
- ✅ Número (obrigatório, preenchimento manual)
- ✅ Complemento (opcional)

### Dados Bancários
- ✅ Banco (obrigatório)
- ✅ Tipo de Conta (obrigatório)
- ✅ Agência (obrigatório)
- ✅ Conta (obrigatório)
- ✅ Chave PIX (opcional)
