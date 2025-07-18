# 🚀 Como Adicionar Service Account ao Drive Compartilhado

## 📋 **Passo a Passo para Drive Compartilhado "Essencial Pay"**

### 1. **Acessar o Drive Compartilhado**
- Vá para: https://drive.google.com
- No menu lateral esquerdo, clique em **"Drives compartilhados"**
- Encontre e clique no drive **"Essencial Pay"**

### 2. **Gerenciar Membros**
- Dentro do drive compartilhado, clique no ícone de **engrenagem ⚙️** (canto superior direito)
- Selecione **"Gerenciar membros"**

### 3. **Adicionar Service Account**
- Clique em **"Adicionar membros"**
- No campo de email, cole:
  ```
  essencialpay-form-storage@essencialpay-form.iam.gserviceaccount.com
  ```

### 4. **Definir Permissões**
- Selecione o nível de acesso: **"Editor de conteúdo"** ou **"Gerenciador"**
- ✅ **Editor de conteúdo**: Pode adicionar, editar, mover e excluir arquivos
- ✅ **Gerenciador**: Pode fazer tudo que o Editor faz + gerenciar membros
- ❌ **Comentarista/Visualizador**: Não funciona para nossa aplicação

### 5. **Confirmar**
- Clique em **"Enviar"** ou **"Adicionar"**
- A service account agora tem acesso ao drive compartilhado

---

## 🔧 **Testar a Configuração**

Execute o script para verificar se tudo está funcionando:

```bash
npx ts-node src/config/find-drive-folders.ts
```

### **✅ Resultado Esperado:**
```
🔍 Buscando estrutura de pastas no Google Drive compartilhado...

📁 Listando drives compartilhados...

📋 Drives compartilhados encontrados:
1. Essencial Pay (ID: 0ABC123DEF456...)

✅ Drive compartilhado "Essencial Pay" encontrado: 0ABC123DEF456...

📁 Procurando pasta "3. Gestão de Carteira"...
✅ Pasta "3. Gestão de Carteira" encontrada: 1GHI789JKL012...

📁 Procurando pasta "1. Clientes"...
✅ Pasta "1. Clientes" encontrada: 2MNO345PQR678...

🎉 Estrutura de pastas encontrada com sucesso!

📋 Estrutura:
📁 Essencial Pay (Drive Compartilhado - 0ABC123DEF456...)
  └── 📁 3. Gestão de Carteira (1GHI789JKL012...)
      └── 📁 1. Clientes (2MNO345PQR678...)

🔧 Configure no seu arquivo .env:
GOOGLE_DRIVE_PARENT_FOLDER_ID=2MNO345PQR678...
```

---

## 🚨 **Possíveis Erros**

### **❌ Nenhum drive compartilhado encontrado**
- Verifique se a service account foi adicionada ao drive compartilhado
- Certifique-se de que o email está correto
- Aguarde alguns minutos (pode demorar para sincronizar)

### **❌ Drive "Essencial Pay" não encontrado**
- Verifique se o nome do drive está exato: "Essencial Pay"
- Certifique-se de que a service account tem acesso ao drive

### **❌ Pasta não encontrada**
- Verifique se a estrutura de pastas existe:
  ```
  📁 Essencial Pay (Drive Compartilhado)
    └── 📁 3. Gestão de Carteira
        └── 📁 1. Clientes
  ```

---

## 🎯 **Próximos Passos**

1. **Adicionar a service account ao drive compartilhado**
2. **Executar o script de teste**
3. **Copiar o ID da pasta "1. Clientes"**
4. **Atualizar o arquivo .env com o ID**
5. **Testar o upload de arquivos**

**Depois que conseguir o ID da pasta "1. Clientes", me avise para finalizar a configuração!** 🚀
