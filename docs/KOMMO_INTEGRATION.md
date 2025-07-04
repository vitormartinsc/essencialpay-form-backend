# Integração com Kommo CRM

Este backend inclui integração com o Kommo CRM para automatizar a atualização de dados dos leads.

## Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```bash
# Kommo CRM Configuration
KOMMO_ENABLED=true
KOMMO_ACCESS_TOKEN=your_kommo_access_token
```

### 2. Obter Token de Acesso do Kommo

1. Acesse sua conta do Kommo
2. Vá em Configurações > Integrações > API
3. Gere um token de acesso permanente
4. Adicione o token à variável `KOMMO_ACCESS_TOKEN`

### 3. IDs dos Campos Customizados

Os IDs dos campos customizados estão configurados no arquivo `src/utils/kommo.js`:

#### Campos do Contato:
- `phone`: 845834 (Telefone)
- `email`: 845836 (Email)
- `cpf`: 1064648 (CPF/CNPJ)
- `rg`: 1064650 (RG)
- `birth_date`: 1064652 (Data de Nascimento)
- `gender`: 1064654 (Gênero)

#### Campos do Lead:
- `limite_disponivel`: 1051320
- `valor_emprestimo`: 1064640
- `installments`: 1064641
- `receive_method`: 1064642
- `pix_key_type`: 1064643
- `pix_key`: 1064644
- `card_number`: 1064645
- `card_name`: 1064646
- `card_expiry`: 1064647
- `card_brand`: 1064648

**Importante**: Verifique se esses IDs correspondem aos campos customizados da sua conta do Kommo. Caso sejam diferentes, atualize os valores no arquivo `src/utils/kommo.js`.

## Funcionalidades

### 1. Atualização de Dados Pessoais

Quando um usuário é criado via rota `POST /api/users`, o sistema:

1. Salva os dados no PostgreSQL
2. Busca o contato no Kommo pelo telefone
3. Atualiza os campos do contato e lead com os dados fornecidos

#### Campos enviados para o Kommo:
- **Nome completo** (`fullName`)
- **Email** (`email`)
- **Telefone** (`phone`)
- **CPF** (`cpf`)
- **CNPJ** (`cnpj`) - opcional
- **Endereço completo** (CEP, logradouro, número, complemento, bairro, cidade, estado)
- **Dados bancários** (banco, tipo de conta, agência, conta) - opcionais

### 2. Busca de Contatos

O sistema busca contatos no Kommo usando o telefone como chave:
- Primeiro tenta com o telefone completo
- Se não encontrar e o telefone tiver 9 dígitos após o DDD, tenta sem o primeiro 9

### 3. Tratamento de Erros

- Se a integração estiver desabilitada (`KOMMO_ENABLED=false`), as funções são ignoradas
- Erros na integração com Kommo não afetam o salvamento dos dados no banco
- Logs detalhados para debugging

## Estrutura dos Arquivos

```
src/
├── utils/
│   └── kommo.js              # Módulo de integração com Kommo
├── server.js                 # Servidor principal com chamadas para Kommo
└── config/
    └── database.js           # Configuração do banco
```

## Logs

O sistema gera logs detalhados para monitoramento:

```
🔄 Atualizando dados no Kommo...
✅ Dados pessoais atualizados no Kommo com sucesso
⚠️ Erro ao atualizar dados no Kommo (não crítico): [erro]
```

## Debugging

Para testar a integração:

1. Verifique as variáveis de ambiente no endpoint `/debug/env`
2. Monitore os logs do servidor durante as operações
3. Verifique se os dados estão sendo atualizados no Kommo

## Desabilitando a Integração

Para desabilitar temporariamente a integração, defina:

```bash
KOMMO_ENABLED=false
```

Ou remova/comente a variável `KOMMO_ACCESS_TOKEN`.
