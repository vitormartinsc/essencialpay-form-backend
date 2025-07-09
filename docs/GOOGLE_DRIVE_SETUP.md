# Configuração do Google Drive

Este documento explica como configurar a integração com o Google Drive para salvar os documentos dos clientes automaticamente.

## Pré-requisitos

1. Uma conta do Google
2. Acesso ao Google Cloud Console
3. Projeto existente ou criação de um novo

## Passos para Configuração

### 1. Acessar o Google Cloud Console

1. Acesse https://console.cloud.google.com
2. Faça login com sua conta Google
3. Selecione ou crie um projeto

### 2. Ativar a Google Drive API

1. No menu lateral, vá para **APIs & Services** > **Library**
2. Busque por "Google Drive API"
3. Clique em **Google Drive API** nos resultados
4. Clique em **ENABLE** para ativar a API

### 3. Criar uma Service Account

1. Vá para **APIs & Services** > **Credentials**
2. Clique em **+ CREATE CREDENTIALS** > **Service account**
3. Preencha os campos:
   - **Service account name**: `essencial-drive-service`
   - **Service account ID**: será gerado automaticamente
   - **Description**: `Service account para upload de documentos`
4. Clique em **CREATE AND CONTINUE**
5. Em **Grant this service account access to project**, selecione a role **Editor**
6. Clique em **CONTINUE** e depois **DONE**

### 4. Gerar Chave JSON

1. Na lista de Service Accounts, clique na que você criou
2. Vá para a aba **Keys**
3. Clique em **ADD KEY** > **Create new key**
4. Selecione **JSON** como tipo
5. Clique em **CREATE**
6. Um arquivo JSON será baixado automaticamente

### 5. Configurar Variáveis de Ambiente

Abra o arquivo JSON baixado e encontre as seguintes informações:

```json
{
  "type": "service_account",
  "project_id": "seu-projeto-id",
  "private_key_id": "sua-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "service-account@seu-projeto.iam.gserviceaccount.com",
  "client_id": "seu-client-id"
}
```

No seu arquivo `.env`, configure:

```env
GOOGLE_PROJECT_ID=seu-projeto-id
GOOGLE_PRIVATE_KEY_ID=sua-private-key-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_PRIVATE_KEY_AQUI\n-----END PRIVATE KEY-----"
GOOGLE_CLIENT_EMAIL=service-account@seu-projeto.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_DRIVE_PARENT_FOLDER_ID=ID_DA_PASTA_DOCUMENTOS
```

### 6. Configurar Pasta no Google Drive

1. No seu Google Drive, vá para a pasta "dados clientes"
2. Dentro dela, certifique-se de que existe uma pasta chamada "documentos"
3. Clique com o botão direito na pasta "documentos" > **Compartilhar**
4. Adicione o email da Service Account (client_email do JSON) como **Editor**
5. Copie o ID da pasta "documentos" da URL (exemplo: se a URL for `https://drive.google.com/drive/folders/1ABC123XYZ`, o ID é `1ABC123XYZ`)
6. Cole este ID na variável `GOOGLE_DRIVE_PARENT_FOLDER_ID`

## Estrutura das Pastas

O sistema criará automaticamente a seguinte estrutura:

```
dados clientes/
└── documentos/
    ├── João Silva - 123.456.789-00/
    │   ├── document_front_2024-01-15T10-30-00.jpg
    │   ├── document_back_2024-01-15T10-30-01.jpg
    │   └── residence_proof_2024-01-15T10-30-02.pdf
    └── Maria Santos - 987.654.321-00/
        ├── document_front_2024-01-15T11-15-00.jpg
        └── residence_proof_2024-01-15T11-15-01.pdf
```

## Segurança

- A Service Account tem acesso apenas aos arquivos necessários
- As credenciais devem ser mantidas em segredo
- Os arquivos são salvos com permissões apropriadas
- Backup das credenciais é recomendado

## Troubleshooting

### Erro: "Access denied"
- Verifique se a Service Account foi adicionada à pasta com permissões de Editor
- Confirme se o ID da pasta está correto

### Erro: "API not enabled"
- Verifique se a Google Drive API está habilitada no projeto
- Aguarde alguns minutos para propagação das mudanças

### Erro: "Invalid credentials"
- Verifique se todas as variáveis de ambiente estão corretas
- Certifique-se de que a private key inclui as quebras de linha `\n`

## Teste da Configuração

Para testar se a configuração está funcionando:

1. Inicie o servidor: `npm run dev`
2. Envie um formulário com documentos pelo frontend
3. Verifique se uma nova pasta foi criada no Google Drive
4. Confirme se os arquivos foram salvos corretamente

## Logs

O sistema gera logs detalhados sobre o processo de upload:

- `📁 Criando pasta no Drive: Nome do Cliente - CPF`
- `📤 Fazendo upload do arquivo: nome_do_arquivo.jpg`
- `✅ Arquivo enviado para o Drive: file_id`
- `⚠️ Erro ao enviar para Google Drive (não crítico): erro_detalhado`

Se houver problemas, os logs ajudarão a identificar a causa.
