import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateDatabaseSchema() {
  try {
    console.log('🔄 Atualizando esquema da tabela user_documents...');
    
    // Adicionar colunas para Google Drive se não existirem
    const alterTableQuery = `
      ALTER TABLE user_documents 
      ADD COLUMN IF NOT EXISTS drive_file_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS drive_view_url TEXT,
      ADD COLUMN IF NOT EXISTS drive_download_url TEXT;
    `;
    
    await pool.query(alterTableQuery);
    
    console.log('✅ Tabela user_documents atualizada com sucesso!');
    console.log('📋 Novas colunas adicionadas:');
    console.log('   - drive_file_id: ID do arquivo no Google Drive');
    console.log('   - drive_view_url: URL para visualizar o arquivo');
    console.log('   - drive_download_url: URL para download direto');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar esquema:', error);
  } finally {
    await pool.end();
  }
}

updateDatabaseSchema();
