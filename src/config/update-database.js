const { Pool } = require('pg');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config({ path: '.env' });

// Configuração do PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateDatabase() {
  try {
    console.log('🔄 Atualizando estrutura do banco de dados...');
    
    // Tornar dados pessoais opcionais (incluindo CPF)
    const alterColumns = [
      'ALTER TABLE users ALTER COLUMN nome DROP NOT NULL;',
      'ALTER TABLE users ALTER COLUMN email DROP NOT NULL;',
      'ALTER TABLE users ALTER COLUMN cpf DROP NOT NULL;',
      'ALTER TABLE users ALTER COLUMN telefone DROP NOT NULL;',
      'ALTER TABLE users ALTER COLUMN cep DROP NOT NULL;',
      'ALTER TABLE users ALTER COLUMN logradouro DROP NOT NULL;',
      'ALTER TABLE users ALTER COLUMN numero DROP NOT NULL;',
      'ALTER TABLE users ALTER COLUMN bairro DROP NOT NULL;',
      'ALTER TABLE users ALTER COLUMN cidade DROP NOT NULL;',
      'ALTER TABLE users ALTER COLUMN estado DROP NOT NULL;',
    ];
    
    // Adicionar colunas de dados bancários se não existirem
    const addBankingColumns = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(50);',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS agency VARCHAR(20);',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS account VARCHAR(20);',
    ];
    
    // Executar alterações para tornar campos pessoais opcionais
    console.log('📝 Tornando campos pessoais opcionais (incluindo CPF)...');
    for (const query of alterColumns) {
      try {
        await pool.query(query);
        console.log(`✅ Executado: ${query}`);
      } catch (error) {
        console.log(`ℹ️ Já executado ou não necessário: ${query}`);
      }
    }
    
    // Adicionar colunas bancárias se não existirem
    console.log('🏦 Adicionando colunas bancárias...');
    for (const query of addBankingColumns) {
      try {
        await pool.query(query);
        console.log(`✅ Executado: ${query}`);
      } catch (error) {
        console.log(`ℹ️ Já executado: ${query}`);
      }
    }
    
    // Verificar estrutura atual da tabela
    console.log('📊 Verificando estrutura atual da tabela users...');
    const structureQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await pool.query(structureQuery);
    console.log('Estrutura atual da tabela users:');
    structureResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    console.log('🎉 Atualização do banco de dados concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar banco de dados:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar a atualização
updateDatabase().catch(console.error);
