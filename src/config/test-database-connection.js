const { Pool } = require('pg');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config({ path: '.env' });

// Configuração do PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testDatabaseConnection() {
  try {
    console.log('🔗 Testando conexão com o banco de dados...');
    console.log('📍 URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

    // Testar conexão básica
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');

    // Verificar versão do PostgreSQL
    const versionResult = await client.query('SELECT version();');
    console.log('🐘 Versão do PostgreSQL:', versionResult.rows[0].version.split(' ')[1]);

    // Listar tabelas existentes
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n📋 Tabelas encontradas:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Contar registros nas tabelas principais
    if (tablesResult.rows.some(row => row.table_name === 'users')) {
      const usersCount = await client.query('SELECT COUNT(*) FROM users;');
      console.log(`\n👥 Registros na tabela users: ${usersCount.rows[0].count}`);
    }

    if (tablesResult.rows.some(row => row.table_name === 'user_documents')) {
      const documentsCount = await client.query('SELECT COUNT(*) FROM user_documents;');
      console.log(`📄 Registros na tabela user_documents: ${documentsCount.rows[0].count}`);
    }

    // Testar inserção de dados de exemplo (opcional)
    console.log('\n🧪 Testando inserção de dados de exemplo...');
    const testQuery = `
      INSERT INTO users (nome, email, bank_name, account_type, agency, account)
      VALUES ('Teste Conexão', 'teste@exemplo.com', 'Banco Teste', 'Corrente', '1234', '567890')
      RETURNING id, nome, created_at;
    `;

    const insertResult = await client.query(testQuery);
    console.log('✅ Dados de teste inseridos com sucesso!');
    console.log('📋 Registro criado:', insertResult.rows[0]);

    // Limpar dados de teste
    await client.query('DELETE FROM users WHERE email = $1;', ['teste@exemplo.com']);
    console.log('🧹 Dados de teste removidos');

    client.release();
    console.log('\n🎉 Teste de conexão concluído com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro na conexão:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Dica: Verifique se a URL do banco está correta');
    } else if (error.code === '28P01') {
      console.log('💡 Dica: Verifique as credenciais de autenticação');
    } else if (error.code === '3D000') {
      console.log('💡 Dica: Verifique se o nome do banco está correto');
    }
  } finally {
    await pool.end();
  }
}

testDatabaseConnection();
