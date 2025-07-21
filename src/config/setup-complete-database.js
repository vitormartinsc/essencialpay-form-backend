const { Pool } = require('pg');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config({ path: '.env' });

// Configuração do PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupCompleteDatabase() {
  try {
    console.log('🚀 Configurando banco de dados completo...');
    console.log('🔗 Conectando em:', process.env.DATABASE_URL?.substring(0, 50) + '...');

    // 1. Criar tabela de usuários se não existir
    console.log('\n📋 1. Criando/verificando tabela de usuários...');
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255),
        email VARCHAR(255),
        telefone VARCHAR(20),
        cpf VARCHAR(14),
        cnpj VARCHAR(18),
        cep VARCHAR(9),
        logradouro TEXT,
        numero VARCHAR(10),
        complemento TEXT,
        bairro VARCHAR(100),
        cidade VARCHAR(100),
        estado VARCHAR(2),
        data_nascimento DATE,
        documento_identidade_frente_url TEXT,
        documento_identidade_verso_url TEXT,
        documento_cnh_url TEXT,
        documento_comprovante_residencia_url TEXT,
        bank_name VARCHAR(255),
        account_type VARCHAR(50),
        agency VARCHAR(20),
        account VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createUsersTable);
    console.log('✅ Tabela users criada/verificada');

    // 2. Criar tabela de documentos se não existir
    console.log('\n📄 2. Criando/verificando tabela de documentos...');
    const createUserDocumentsTable = `
      CREATE TABLE IF NOT EXISTS user_documents (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        document_type VARCHAR(100) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_key VARCHAR(255),
        file_size INTEGER,
        content_type VARCHAR(100),
        drive_file_id VARCHAR(255),
        drive_view_url TEXT,
        drive_download_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createUserDocumentsTable);
    console.log('✅ Tabela user_documents criada/verificada');

    // 3. Adicionar colunas que podem estar faltando na tabela users
    console.log('\n🔧 3. Adicionando colunas faltantes na tabela users...');
    const addMissingColumns = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18);',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS logradouro TEXT;',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(50);',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS agency VARCHAR(20);',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS account VARCHAR(20);'
    ];

    for (const query of addMissingColumns) {
      try {
        await pool.query(query);
        console.log(`✅ ${query.substring(0, 60)}...`);
      } catch (error) {
        console.log(`ℹ️ Coluna já existe ou erro esperado: ${query.substring(0, 60)}...`);
      }
    }

    // 4. Adicionar colunas do Google Drive na tabela user_documents se não existirem
    console.log('\n💾 4. Adicionando colunas do Google Drive...');
    const addGoogleDriveColumns = [
      'ALTER TABLE user_documents ADD COLUMN IF NOT EXISTS drive_file_id VARCHAR(255);',
      'ALTER TABLE user_documents ADD COLUMN IF NOT EXISTS drive_view_url TEXT;',
      'ALTER TABLE user_documents ADD COLUMN IF NOT EXISTS drive_download_url TEXT;'
    ];

    for (const query of addGoogleDriveColumns) {
      try {
        await pool.query(query);
        console.log(`✅ ${query.substring(0, 60)}...`);
      } catch (error) {
        console.log(`ℹ️ Coluna já existe: ${query.substring(0, 60)}...`);
      }
    }

    // 5. Tornar campos pessoais opcionais (para permitir envio apenas de dados bancários)
    console.log('\n🔓 5. Tornando campos pessoais opcionais...');
    const makeFieldsOptional = [
      'ALTER TABLE users ALTER COLUMN nome DROP NOT NULL;',
      'ALTER TABLE users ALTER COLUMN email DROP NOT NULL;',
      'ALTER TABLE users ALTER COLUMN cpf DROP NOT NULL;',
      'ALTER TABLE users ALTER COLUMN telefone DROP NOT NULL;'
    ];

    for (const query of makeFieldsOptional) {
      try {
        await pool.query(query);
        console.log(`✅ ${query.substring(0, 60)}...`);
      } catch (error) {
        console.log(`ℹ️ Campo já opcional: ${query.substring(0, 60)}...`);
      }
    }

    // 6. Criar índices para melhor performance
    console.log('\n🔍 6. Criando índices...');
    const createIndexes = [
      // Índices da tabela users
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
      'CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);',
      'CREATE INDEX IF NOT EXISTS idx_users_cnpj ON users(cnpj);',
      'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);',
      
      // Índices da tabela user_documents
      'CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_documents_document_type ON user_documents(document_type);',
      'CREATE INDEX IF NOT EXISTS idx_user_documents_created_at ON user_documents(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_user_documents_drive_file_id ON user_documents(drive_file_id);'
    ];

    for (const index of createIndexes) {
      try {
        await pool.query(index);
        console.log(`✅ ${index.substring(0, 60)}...`);
      } catch (error) {
        console.log(`ℹ️ Índice já existe: ${index.substring(0, 60)}...`);
      }
    }

    // 7. Criar função para atualizar updated_at automaticamente
    console.log('\n⚡ 7. Criando função de atualização automática...');
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

    // 8. Criar triggers para atualizar updated_at
    console.log('\n🎯 8. Criando triggers...');
    const createTriggers = [
      `DROP TRIGGER IF EXISTS update_users_updated_at ON users;
       CREATE TRIGGER update_users_updated_at
           BEFORE UPDATE ON users
           FOR EACH ROW
           EXECUTE FUNCTION update_updated_at_column();`,
      
      `DROP TRIGGER IF EXISTS update_user_documents_updated_at ON user_documents;
       CREATE TRIGGER update_user_documents_updated_at
           BEFORE UPDATE ON user_documents
           FOR EACH ROW
           EXECUTE FUNCTION update_updated_at_column();`
    ];

    for (const trigger of createTriggers) {
      await pool.query(trigger);
      console.log('✅ Trigger criado');
    }

    // 9. Verificar estrutura final das tabelas
    console.log('\n📊 9. Verificando estrutura final das tabelas...');
    
    // Verificar tabela users
    const usersStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Estrutura da tabela users:');
    usersStructure.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Verificar tabela user_documents
    const documentsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_documents' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📄 Estrutura da tabela user_documents:');
    documentsStructure.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    console.log('\n🎉 Banco de dados configurado com sucesso!');
    console.log('\n📋 Recursos configurados:');
    console.log('   ✅ Tabela users com todos os campos necessários');
    console.log('   ✅ Tabela user_documents com integração Google Drive');
    console.log('   ✅ Campos pessoais opcionais (permite apenas dados bancários)');
    console.log('   ✅ Índices para melhor performance');
    console.log('   ✅ Triggers para atualização automática de timestamps');
    console.log('   ✅ Suporte completo para Google Drive');

  } catch (error) {
    console.error('\n❌ Erro ao configurar banco de dados:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar a configuração
setupCompleteDatabase().catch(console.error);
