# Exemplo de Upload Integrado S3 + Google Drive

Este exemplo mostra como o sistema agora faz upload dos documentos tanto para o AWS S3 quanto para o Google Drive automaticamente.

## Fluxo de Upload

Quando um cliente envia o formulário com documentos:

1. **Dados salvos no PostgreSQL** - Informações do cliente são salvas no banco
2. **Upload para AWS S3** - Documentos são enviados para o bucket S3 (backup/CDN)
3. **Upload para Google Drive** - Documentos são organizados por cliente no Drive
4. **Atualização no Kommo** - Dados são sincronizados com o CRM

## Estrutura no Google Drive

```
dados clientes/
└── documentos/
    ├── João Silva - 123.456.789-00/
    │   ├── document_front_2024-07-08T14-30-00.jpg
    │   ├── document_back_2024-07-08T14-30-01.jpg
    │   └── residence_proof_2024-07-08T14-30-02.pdf
    ├── Maria Santos - 987.654.321-00/
    │   ├── document_front_2024-07-08T15-15-00.jpg
    │   └── residence_proof_2024-07-08T15-15-01.pdf
    └── Pedro Oliveira - 555.666.777-88/
        ├── document_front_2024-07-08T16-45-00.jpg
        ├── document_back_2024-07-08T16-45-01.jpg
        └── residence_proof_2024-07-08T16-45-02.pdf
```

## Resposta da API

Quando o upload é bem-sucedido, a API retorna:

```json
{
  "success": true,
  "message": "Usuário e documentos salvos com sucesso!",
  "data": {
    "id": 123,
    "nome": "João Silva",
    "email": "joao@example.com",
    "created_at": "2024-07-08T14:30:00.000Z",
    "documents": [
      {
        "id": "s3-doc-1",
        "type": "document_front",
        "fileName": "documento_frente.jpg",
        "url": "https://essencial-form-files.s3.us-east-2.amazonaws.com/documents/123/document_front_uuid.jpg"
      }
    ],
    "driveDocuments": [
      {
        "type": "document_front",
        "id": "1ABC123XYZ",
        "url": "https://drive.google.com/file/d/1ABC123XYZ/view",
        "name": "document_front_2024-07-08T14-30-00.jpg"
      }
    ]
  }
}
```

## Tratamento de Erros

O sistema é resiliente a falhas:

- **Se S3 falhar**: O Google Drive ainda funciona
- **Se Google Drive falhar**: O S3 ainda funciona  
- **Se ambos falharem**: Os dados do cliente ainda são salvos no banco

Logs detalhados ajudam a identificar problemas:

```
📤 Processando arquivos...
☁️ Fazendo upload para Google Drive...
📁 Criando pasta no Drive: João Silva - 123.456.789-00
📤 Fazendo upload do arquivo: document_front_2024-07-08T14-30-00.jpg
✅ Arquivo enviado para o Drive: 1ABC123XYZ
✅ 3 arquivos enviados para o Drive
✅ Documento document_front salvo: s3-doc-1
```

## Configuração Opcional

O Google Drive é opcional. Se não estiver configurado:

- O sistema continua funcionando normalmente
- Apenas o S3 é usado para armazenar arquivos
- Nenhum erro é gerado

Para ativar o Google Drive:

1. Configure as credenciais (veja `docs/GOOGLE_DRIVE_SETUP.md`)
2. Execute: `node setup-drive.js`
3. Reinicie o servidor

## Backup e Redundância

Com essa implementação, você tem:

- **Backup automático**: Arquivos em dois locais diferentes
- **Acesso fácil**: Google Drive para visualização e organização
- **CDN/Performance**: S3 para servir arquivos na aplicação
- **Organização**: Pastas separadas por cliente no Drive

## Permissões de Acesso

- **AWS S3**: Arquivos privados, acesso via aplicação
- **Google Drive**: Arquivos com link compartilhável (configurável)
- **Banco de dados**: Metadados e relacionamentos

Isso garante segurança e flexibilidade no acesso aos documentos.
