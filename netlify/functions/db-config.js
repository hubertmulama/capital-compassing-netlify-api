import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.RAILWAY_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

export async function executeQuery(sql, params = []) {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(sql, params);
    return result;
  } finally {
    if (client) {
      client.release();
    }
  }
}
