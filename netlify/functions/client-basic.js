import { executeQuery } from './db-config.js';

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      headers, 
      body: JSON.stringify({ error: 'Method not allowed' }) 
    };
  }

  const { mt5_name } = event.queryStringParameters;

  if (!mt5_name) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Missing mt5_name parameter' 
      })
    };
  }

  try {
    const clientResult = await executeQuery(
      `SELECT 
         c.id, c.name, c.email, c.state as client_state, c.created_at as client_created_at,
         man.mt5_name, man.state as mt5_state, man.created_at as mt5_created_at
       FROM clients c
       INNER JOIN mt5_account_names man ON c.id = man.client_id
       WHERE man.mt5_name = $1`,
      [mt5_name]
    );

    if (clientResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, error: 'Client not found' })
      };
    }

    const row = clientResult.rows[0];
    
    const formatPostgresDate = (postgresDate) => {
      if (!postgresDate) return 'Unknown';
      const date = new Date(postgresDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        client: {
          id: row.id,
          name: row.name,
          email: row.email,
          client_state: row.client_state,
          client_created_at: formatPostgresDate(row.client_created_at),
          mt5_name: row.mt5_name,
          mt5_state: row.mt5_state,
          mt5_created_at: formatPostgresDate(row.mt5_created_at)
        }
      })
    };

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
}
