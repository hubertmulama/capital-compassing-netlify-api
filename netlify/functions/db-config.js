const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.RAILWAY_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

// Create connection function
async function getConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection established to Railway PostgreSQL');
    return client;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

// Query helper function
async function executeQuery(sql, params = []) {
  let client;
  try {
    client = await getConnection();
    const result = await client.query(sql, params);
    return result;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Export using CommonJS
module.exports = {
  getConnection,
  executeQuery,
  pool
};
