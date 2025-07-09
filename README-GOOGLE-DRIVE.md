# 🚀 Branch: Google Drive Integration

Este branch implementa a integração com o Google Drive para upload automático de documentos dos clientes.

## 📋 Resumo das Alterações

### ✅ Arquivos Adicionados

- **`src/utils/driveUpload.ts`** - Serviço principal do Google Drive
- **`docs/GOOGLE_DRIVE_SETUP.md`** - Guia completo de configuração
- **`docs/UPLOAD_INTEGRADO.md`** - Documentação do sistema integrado
- **`setup-drive.js`** - Script automatizado de configuração

### 🔧 Arquivos Modificados

- **`src/index.ts`** - Integração do serviço Drive na API principal
- **`package.json`** - Adicionada dependência `googleapis`
- **`.env`** - Exemplo de variáveis para Google Drive

## 🎯 Funcionalidades Implementadas

### 1. Upload Automático para Google Drive
- Cria pastas organizadas por cliente (formato: "Nome - CPF")
- Upload simultâneo para AWS S3 e Google Drive
- Sistema resiliente a falhas

### 2. Organização Inteligente
```
dados clientes/
└── documentos/
    ├── João Silva - 123.456.789-00/
    │   ├── document_front_2024-07-09T14-30-00.jpg
    │   ├── document_back_2024-07-09T14-30-01.jpg
    │   └── residence_proof_2024-07-09T14-30-02.pdf
    └── Maria Santos - 987.654.321-00/
        └── ...
```

### 3. Configuração Opcional
- Funciona sem Google Drive (mantém compatibilidade)
- Configuração via variáveis de ambiente
- Script automatizado de setup

## 🛠️ Como Testar

### 1. Configurar Google Drive (Opcional)
```bash
# Seguir guia em docs/GOOGLE_DRIVE_SETUP.md
# Ou usar script automatizado:
node setup-drive.js
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Iniciar Servidor
```bash
npm run dev
```

### 4. Testar Upload
- Enviar formulário com documentos via frontend
- Verificar logs do servidor
- Confirmar criação de pasta no Google Drive

## 📊 Logs de Teste

Quando funcionando corretamente, você verá logs como:
```
📤 Processando arquivos...
☁️ Fazendo upload para Google Drive...
📁 Criando pasta no Drive: João Silva - 123.456.789-00
📤 Fazendo upload do arquivo: document_front_2024-07-09T14-30-00.jpg
✅ Arquivo enviado para o Drive: 1ABC123XYZ
✅ 3 arquivos enviados para o Drive
```

## 🔄 Próximos Passos

1. **Testar em Desenvolvimento** ✅
2. **Revisar Código** (pendente)
3. **Testar em Staging** (pendente)
4. **Merge para Main** (pendente)

## 🔧 Variáveis de Ambiente Necessárias

```env
# Google Drive Configuration (Opcional)
GOOGLE_PROJECT_ID=seu-projeto-id
GOOGLE_PRIVATE_KEY_ID=sua-private-key-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_CLIENT_EMAIL=service-account@projeto.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_DRIVE_PARENT_FOLDER_ID=id-da-pasta-documentos
```

## 🛡️ Segurança

- Service Account com permissões mínimas necessárias
- Credenciais em variáveis de ambiente
- Arquivos com controle de acesso apropriado
- Backup automático em dois locais (S3 + Drive)

## 📞 Suporte

- **Documentação**: `docs/GOOGLE_DRIVE_SETUP.md`
- **Troubleshooting**: Verificar logs detalhados do servidor
- **Script de Setup**: `node setup-drive.js`

---

**Status**: 🚧 Em desenvolvimento - Pronto para review e testes
