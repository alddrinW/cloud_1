const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'cloud_db',
  user: process.env.DB_USER || 'cloud_user',
  password: process.env.DB_PASSWORD || 'cloud_secure_password_example',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DATABASE ERROR] Error inesperado en el cliente del pool:', err.message);
});

/**
 * Ejecuta una consulta SQL parametrizada
 */
const query = (text, params) => {
  return pool.query(text, params);
};

/**
 * Verifica la conectividad con la base de datos
 */
const checkHealth = async () => {
  const start = Date.now();
  try {
    await pool.query('SELECT 1 AS health');
    const responseTimeMs = Date.now() - start;
    return {
      connected: true,
      responseTimeMs,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
};

module.exports = {
  pool,
  query,
  checkHealth,
};
