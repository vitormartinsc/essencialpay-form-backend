const pool = require('./src/config/database');

async function initDatabase() {
  try {
    console.log('🗄️  Inicializando banco de dados...');

    // Criar tabela de usuários
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        telefone VARCHAR(20),
        cpf VARCHAR(14) UNIQUE,
        cep VARCHAR(9),
        endereco TEXT,
        numero VARCHAR(10),
        bairro VARCHAR(100),
        cidade VARCHAR(100),
        estado VARCHAR(2),
        complemento TEXT,
        data_nascimento DATE,
        documento_identidade_frente_url TEXT,
        documento_identidade_verso_url TEXT,
        documento_cnh_url TEXT,
        documento_comprovante_residencia_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createUsersTable);
    console.log('✅ Tabela users criada/verificada');

    // Criar índices para melhor performance
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
      'CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);',
      'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);'
    ];

    for (const index of createIndexes) {
      await pool.query(index);
    }
    console.log('✅ Índices criados/verificados');

    // Criar função para atualizar updated_at automaticamente
    const createUpdateFunction = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    await pool.query(createUpdateFunction);
    console.log('✅ Função de atualização criada');

    // Criar trigger para atualizar updated_at
    const createTrigger = `
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `;

    await pool.query(createTrigger);
    console.log('✅ Trigger de atualização criado');

    console.log('🎉 Banco de dados inicializado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

initDatabase();
