const { Pool } = require('pg');
require('dotenv').config();

// Usar URL externa para desenvolvimento local e interna para produção
const databaseUrl = process.env.NODE_ENV === 'production' 
  ? process.env.DATABASE_URL 
  : process.env.DATABASE_URL_EXTERNAL;

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 10,
});

// Testar conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão PostgreSQL:', err);
});

module.exports = pool;
