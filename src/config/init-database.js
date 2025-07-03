const pool = require('./database');

async function initDatabase() {
  try {
    console.log('🗃️  Inicializando banco de dados...');
    
    // Criar tabela users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        cpf VARCHAR(14) UNIQUE NOT NULL,
        cnpj VARCHAR(18),
        telefone VARCHAR(20) NOT NULL,
        cep VARCHAR(9) NOT NULL,
        logradouro VARCHAR(255) NOT NULL,
        numero VARCHAR(10) NOT NULL,
        complemento VARCHAR(255),
        bairro VARCHAR(255) NOT NULL,
        cidade VARCHAR(255) NOT NULL,
        estado VARCHAR(2) NOT NULL,
        bank_name VARCHAR(255),
        account_type VARCHAR(50),
        agency VARCHAR(20),
        account VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Criar tabela user_documents para armazenar documentos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_key VARCHAR(255) NOT NULL,
        file_size INTEGER NOT NULL,
        content_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tabelas criadas com sucesso!');
    console.log('📊 Tabelas: users, user_documents');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
  } finally {
    await pool.end();
  }
}

initDatabase();
