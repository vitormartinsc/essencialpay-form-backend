# Correções para o erro do Railway

## Problema
O Railway estava tentando executar `/app/dist/index.js` mas o arquivo não existia, causando o erro:
```
Error: Cannot find module '/app/dist/index.js'
```

## Alterações Realizadas

### 1. Corrigido package.json
- Alterado `"main": "index.js"` para `"main": "src/server.js"`
- Alterado `"start": "node dist/index.js"` para `"start": "node src/server.js"`
- Alterado `"build": "tsc"` para `"build": "echo 'Build completed - using JavaScript files directly'"`
- Adicionado scripts alternativos para TypeScript:
  - `"start:ts": "node dist/index.js"`
  - `"build:ts": "tsc"`

### 2. Criado Procfile
Arquivo `Procfile` com:
```
web: node src/server.js
```

### 3. Criado nixpacks.toml
Arquivo `nixpacks.toml` com configuração específica para o Railway:
```toml
[phases.build]
cmds = ['npm install']

[phases.start]
cmd = 'node src/server.js'
```

### 4. Atualizado tsconfig.json
Criado um tsconfig.json mais limpo e funcional para futuras compilações TypeScript.

## Resultado
O servidor agora executa corretamente usando o arquivo JavaScript `src/server.js` em vez de tentar compilar TypeScript. O projeto está configurado para funcionar tanto com JavaScript quanto com TypeScript compilado.

## Comandos para testar
```bash
# Testar localmente
npm start

# Testar build
npm run build

# Verificar se o servidor funciona
curl http://localhost:8080/health
```

O deployment no Railway deve agora funcionar corretamente.
