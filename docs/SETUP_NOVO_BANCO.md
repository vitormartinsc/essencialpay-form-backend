# 🚀 Configuração do Novo Banco PostgreSQL no Railway

## ✅ O que já foi feito

1. **Script de configuração completa criado** (`setup-complete-database.js`)
2. **Banco de dados configurado** com todas as tabelas e colunas necessárias
3. **Integração com Google Drive** configurada na tabela `user_documents`
4. **Teste de conexão** funcionando perfeitamente

## 🔧 Próximos passos que você precisa fazer

### 1. Atualizar as URLs do banco no arquivo .env

**Abra o arquivo `.env` e substitua:**

```bash
# Substitua por suas URLs reais do Railway:
DATABASE_URL=postgresql://postgres:SUA_SENHA@SEU_HOST:PORTA/railway
DATABASE_PUBLIC_URL=postgresql://postgres:SUA_SENHA@SEU_HOST:PORTA/railway
```

**Onde encontrar essas URLs:**
- Acesse seu projeto no Railway
- Vá em **Database** > **Settings** > **Variables**
- Copie `DATABASE_URL` e `DATABASE_PUBLIC_URL`

### 2. Atualizar as variáveis no Railway (Produção)

No seu projeto do Railway, vá em **Settings** > **Environment Variables** e atualize:

```bash
DATABASE_URL=postgresql://postgres:SUA_SENHA@SEU_HOST:PORTA/railway
NODE_ENV=production
PORT=8080
# ... outras variáveis existentes
```

### 3. Executar novamente a configuração do banco (opcional)

Se você quiser reconfigurar o banco com as novas URLs:

```bash
node src/config/setup-complete-database.js
```

### 4. Testar a conexão com as novas URLs

```bash
node src/config/test-database-connection.js
```

## 📋 Scripts disponíveis

| Script | Descrição |
|--------|-----------|
| `setup-complete-database.js` | Configura o banco completo (tabelas, índices, triggers) |
| `test-database-connection.js` | Testa a conexão e mostra informações do banco |
| `update-database-google-drive.ts` | Atualiza apenas as colunas do Google Drive |
| `update-database.js` | Atualiza estruturas específicas |

## 🗄️ Estrutura do banco configurada

### Tabela `users`
- ✅ Todos os campos pessoais (nome, email, cpf, cnpj, etc.)
- ✅ Campos de endereço (cep, logradouro, cidade, etc.)
- ✅ Campos bancários (bank_name, account_type, agency, account)
- ✅ URLs de documentos
- ✅ Campos opcionais (permite envio apenas de dados bancários)

### Tabela `user_documents`
- ✅ Informações básicas do arquivo
- ✅ **Integração com Google Drive** (drive_file_id, drive_view_url, drive_download_url)
- ✅ Metadados (tamanho, tipo, etc.)

### Recursos adicionais
- ✅ Índices para performance
- ✅ Triggers para atualização automática de timestamps
- ✅ Função de atualização automática

## 🚨 Importante

1. **Backup dos dados**: Se você tinha dados no banco antigo, faça backup antes de migrar
2. **URLs do banco**: Use sempre as URLs externas do Railway (não as internas)
3. **Variáveis de ambiente**: Mantenha as URLs sincronizadas entre .env local e Railway

## 🧪 Como testar se tudo está funcionando

1. **Teste local:**
   ```bash
   node src/config/test-database-connection.js
   ```

2. **Teste do formulário:**
   - Inicie o backend: `npm run dev`
   - Teste o formulário frontend
   - Verifique se os dados são salvos no banco

3. **Verificar logs no Railway:**
   - Acesse Railway Dashboard > Logs
   - Veja se há erros de conexão

## 🔗 Links úteis

- [Railway Dashboard](https://railway.app/dashboard)
- [Documentação PostgreSQL](https://www.postgresql.org/docs/)
- [Documentação Google Drive API](https://developers.google.com/drive/api)

---

⚡ **Dica**: Mantenha este arquivo atualizado conforme você faz alterações no banco de dados!
