# EssencialPay Form Backend

Backend em TypeScript/Node.js para processar formulários de cadastro com upload de documentos, integração com CRM Kommo, armazenamento em AWS S3 e Google Drive, notificações WhatsApp e persistência em PostgreSQL.

## 🚀 Funcionalidades Principais

### 📋 Processamento de Formulários
- Recebimento e validação de dados pessoais
- Dados bancários obrigatórios (banco, agência, conta, tipo)
- Endereço completo (opcional)
- Documentos de identidade (RG/CNH) e comprovante de residência

### 🗄️ Armazenamento Dual
- **AWS S3**: Upload seguro de arquivos com URLs privadas
- **Google Drive**: Organização em pastas por estado/usuário
- **PostgreSQL**: Dados estruturados com backup Railway

### 🔗 Integrações Externas
- **Kommo CRM**: Sincronização automática de leads e contatos
- **WhatsApp Business API**: Notificações com dados do formulário
- **Background Processing**: Integrações não bloqueiam frontend

### 🔒 Segurança
- CORS configurável por ambiente
- Validação de tipos de arquivo (JPG, PNG, WEBP, PDF)
- Arquivos privados no S3
- Conexões SSL com PostgreSQL

## 🏗️ Arquitetura

```
Frontend Form → API Endpoints → PostgreSQL
                     ↓
            Background Processor
                     ↓
        AWS S3 + Google Drive + Kommo + WhatsApp
```

### Fluxo de Processamento
1. **Recebimento**: Frontend envia dados + arquivos
2. **Validação**: Campos obrigatórios e tipos de arquivo
3. **Persistência**: Salva no PostgreSQL imediatamente
4. **Resposta**: Retorna sucesso ao frontend
5. **Background**: Processa integrações sem bloquear

## 📁 Estrutura do Projeto

```
src/
├── index.ts                 # Servidor principal Express
├── config/
│   ├── aws.ts              # Configuração AWS S3
│   ├── setup-complete-database.js  # Setup automático do banco
│   └── test-database-connection.js # Teste de conexão
├── utils/
│   ├── backgroundProcessor.ts # Processamento assíncrono
│   ├── fileUpload.ts       # Upload para S3 + Drive
│   ├── googleDrive.ts      # API Google Drive
│   ├── kommo.ts           # Integração CRM Kommo
│   ├── whatsapp.ts        # WhatsApp Business API
│   └── s3Upload.ts        # Upload AWS S3
└── examples/
    └── google-drive-integration.ts

docs/                       # Documentação técnica
├── API_EXAMPLES.md         # Exemplos de uso da API
├── GOOGLE_DRIVE_SETUP.md   # Setup Google Drive
├── KOMMO_INTEGRATION.md    # Setup Kommo CRM
├── WHATSAPP_SETUP.md       # Setup WhatsApp API
└── DEPLOY_RAILWAY.md       # Deploy em produção
```

## ⚙️ Variáveis de Ambiente

### Banco de Dados
```bash
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=development|production
PORT=8080
```

### AWS S3
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_STORAGE_BUCKET_NAME=your_bucket_name
AWS_S3_REGION_NAME=us-east-2
```

### Google Drive (Opcional)
```bash
GOOGLE_DRIVE_ENABLED=true
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PARENT_FOLDER_ID=folder_id
```

### Kommo CRM (Opcional)
```bash
KOMMO_ENABLED=true
KOMMO_ACCESS_TOKEN=your_kommo_token
```

### WhatsApp Business (Opcional)
```bash
WHATSAPP_ENABLED=true
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_RECIPIENT_NUMBER=5511999999999
```

### CORS
```bash
FRONTEND_URL=https://your-frontend.com
CORS_ALLOWED_ORIGINS=https://domain1.com,https://domain2.com
```

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js >= 18
- PostgreSQL (Railway recomendado)
- Conta AWS S3

### Desenvolvimento Local
```bash
# Clonar repositório
git clone https://github.com/vitormartinsc/essencialpay-form-backend.git
cd essencialpay-form-backend

# Instalar dependências
npm install

# Configurar .env (copie .env.example)
cp .env.example .env

# Configurar banco de dados
node src/config/setup-complete-database.js

# Testar conexão
node src/config/test-database-connection.js

# Iniciar desenvolvimento
npm run dev
```

### Produção
```bash
# Build TypeScript
npm run build

# Iniciar servidor
npm start
```

## 📡 API Endpoints

### POST `/api/users`
Cria usuário com upload de documentos.

**Campos obrigatórios:**
- `fullName`: Nome completo
- `phone`: Telefone (formato brasileiro)
- `bankName`: Nome do banco
- `accountType`: Tipo de conta
- `agency`: Agência
- `account`: Número da conta

**Arquivos aceitos:**
- `documentFront`: Frente do documento (RG/CNH)
- `documentBack`: Verso do documento (só RG)
- `selfie`: Selfie com documento
- `residenceProof`: Comprovante de residência

**Resposta:**
```json
{
  "success": true,
  "message": "Dados salvos com sucesso! Sua solicitação está sendo processada.",
  "data": {
    "id": 123,
    "nome": "João Silva",
    "email": "joao@email.com",
    "created_at": "2025-01-01T12:00:00Z"
  }
}
```

### Endpoints de Debug
- `GET /health` - Health check
- `GET /debug/env` - Verificar configurações
- `POST /debug/test-kommo` - Testar integração Kommo
- `POST /debug/test-whatsapp` - Testar WhatsApp

## 🛠️ Desenvolvimento

### Scripts Disponíveis
```bash
npm run dev          # Desenvolvimento com hot reload
npm run build        # Build TypeScript
npm start           # Executar versão compilada
npm run debug       # Debug com inspector
```

### Estrutura do Banco
A tabela `users` é criada automaticamente com:
- Dados pessoais (nome, email, CPF, CNPJ, telefone)
- Endereço completo (CEP, logradouro, número, etc.)
- Dados bancários (banco, agência, conta, tipo)
- URLs dos documentos uploadados
- Timestamps de criação/atualização

## 🚀 Deploy

### Railway (Recomendado)
1. Fork do repositório
2. Conectar Railway ao GitHub
3. Configurar variáveis de ambiente
4. Deploy automático via `railway-deploy.sh`

Ver documentação completa em [`docs/DEPLOY_RAILWAY.md`](docs/DEPLOY_RAILWAY.md)

### Heroku
Compatível via `Procfile` incluído.

## 📚 Documentação

- [`docs/API_EXAMPLES.md`](docs/API_EXAMPLES.md) - Exemplos de uso
- [`docs/GOOGLE_DRIVE_SETUP.md`](docs/GOOGLE_DRIVE_SETUP.md) - Setup Google Drive
- [`docs/KOMMO_INTEGRATION.md`](docs/KOMMO_INTEGRATION.md) - Integração Kommo
- [`docs/WHATSAPP_SETUP.md`](docs/WHATSAPP_SETUP.md) - Setup WhatsApp
- [`docs/DEPLOY_RAILWAY.md`](docs/DEPLOY_RAILWAY.md) - Deploy produção

## 🔧 Tecnologias

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Banco**: PostgreSQL (Railway)
- **Storage**: AWS S3 + Google Drive API
- **Upload**: Multer (memória)
- **CRM**: Kommo API
- **Messaging**: WhatsApp Business API
- **Deploy**: Railway (nixpacks + Procfile)

## 📄 Licença

ISC
