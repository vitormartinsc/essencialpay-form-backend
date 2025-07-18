# Google Drive Integration Guide

## 📋 Pré-requisitos

1. **Conta Google Cloud Platform**
2. **Projeto no Google Cloud Console**
3. **Google Drive API habilitada**
4. **Service Account configurada**

## 🚀 Configuração Passo a Passo

### 1. Acessar o Google Cloud Console
- Ir para: https://console.cloud.google.com
- Fazer login com sua conta Google
- Criar um novo projeto ou selecionar um existente

### 2. Habilitar a Google Drive API
```bash
# No Console, ir para:
APIs & Services > Library > Buscar "Google Drive API" > Enable
```

### 3. Criar Service Account
```bash
# No Console, ir para:
IAM & Admin > Service Accounts > Create Service Account
```

**Configurações:**
- **Nome**: `essencial-form-storage`
- **Descrição**: `Service account para upload de documentos`
- **Permissões**: `Editor` (ou customizada)

### 4. Gerar Chave JSON
```bash
# Na lista de Service Accounts:
Click no email da service account > Keys > Add Key > Create New Key > JSON
```

**Salvar o arquivo JSON!** Você precisará das informações dele.

### 5. Configurar Variáveis de Ambiente

No seu arquivo `.env`, adicionar:

```bash
# Google Drive Configuration
GOOGLE_DRIVE_ENABLED=true
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_PRIVATE_KEY_ID=your-private-key-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_DRIVE_PARENT_FOLDER_ID=your-documents-folder-id
```

**⚠️ IMPORTANTE**: 
- As aspas na `GOOGLE_PRIVATE_KEY` são obrigatórias
- O `\n` deve ser literal, não quebra de linha real
- Pegar todas as informações do arquivo JSON baixado

### 6. Criar Pasta no Google Drive
- Criar uma pasta no seu Google Drive para os documentos
- Copiar o ID da pasta da URL: 
  ```
  https://drive.google.com/drive/folders/1ABCdef123XYZ
  ```
  O ID é: `1ABCdef123XYZ`

### 7. Dar Permissões para a Service Account
- Compartilhar a pasta criada com o email da service account
- Dar permissão de "Editor"

## 📂 Estrutura de Pastas Criada

```
📁 Documentos Essencial Pay (pasta principal)
├── 📁 user_1
│   ├── 📁 document_front
│   │   └── 📄 documento_123.jpg
│   ├── 📁 document_back
│   │   └── 📄 documento_456.jpg
│   ├── 📁 selfie
│   │   └── 📄 selfie_789.jpg
│   └── 📁 residence_proof
│       └── 📄 comprovante_101.pdf
├── 📁 user_2
│   └── ...
```

## 🔧 Atualizar Banco de Dados

Execute o script para adicionar as novas colunas:

```bash
npm run ts-node src/config/update-database-google-drive.ts
```

## 🎯 Como Usar

### Para Habilitar Google Drive:
```bash
GOOGLE_DRIVE_ENABLED=true
```

### Para Usar AWS S3 (padrão):
```bash
GOOGLE_DRIVE_ENABLED=false
# ou remover a variável
```

## 📊 Comparação: Google Drive vs AWS S3

| Aspecto | Google Drive | AWS S3 |
|---------|-------------|---------|
| **Custo** | ✅ Gratuito (15GB) | ❌ Pago por uso |
| **Facilidade** | ✅ Interface familiar | ❌ Mais técnico |
| **Performance** | ❌ Pode ser mais lento | ✅ Muito rápido |
| **Límites** | ❌ API rate limits | ✅ Praticamente ilimitado |
| **Links** | ✅ Links diretos | ✅ URLs assinadas |
| **Organização** | ✅ Pastas visuais | ❌ Estrutura de chaves |

## 🔗 Links Gerados

### Google Drive:
- **View URL**: `https://drive.google.com/file/d/FILE_ID/view`
- **Download URL**: `https://drive.google.com/uc?id=FILE_ID&export=download`

### AWS S3:
- **Direct URL**: `https://bucket.s3.region.amazonaws.com/path/file.jpg`

## 🛡️ Segurança

- ✅ Service Account com permissões limitadas
- ✅ Arquivos privados por padrão
- ✅ Acesso controlado por compartilhamento
- ✅ Logs detalhados de todas as operações

## 🐛 Troubleshooting

### Erro "Invalid credentials"
- Verificar se todas as variáveis de ambiente estão corretas
- Verificar se o arquivo JSON foi copiado corretamente
- Verificar se a Google Drive API está habilitada

### Erro "Insufficient permissions"
- Verificar se a service account tem acesso à pasta
- Verificar se a pasta foi compartilhada com a service account

### Erro "Folder not found"
- Verificar se o `GOOGLE_DRIVE_PARENT_FOLDER_ID` está correto
- Verificar se a pasta existe e está acessível

## 🎉 Benefícios do Google Drive

1. **Custo Zero**: 15GB gratuitos
2. **Interface Familiar**: Fácil de gerenciar
3. **Backup Automático**: Google cuida da redundância
4. **Acesso Fácil**: Visualizar arquivos diretamente no navegador
5. **Compartilhamento**: Fácil compartilhar com outros usuários
