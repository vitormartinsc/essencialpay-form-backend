const pool = require('./src/config/database');

async function addMissingColumns() {
  try {
    console.log('🔧 Adicionando colunas faltantes...');
    
    // Adicionar coluna CNPJ se não existir
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18)
    `);
    
    // Adicionar colunas bancárias se não existirem
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS account_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS agency VARCHAR(20),
      ADD COLUMN IF NOT EXISTS account VARCHAR(50)
    `);
    
    console.log('✅ Colunas adicionadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar colunas:', error);
  } finally {
    await pool.end();
  }
}

addMissingColumns();
