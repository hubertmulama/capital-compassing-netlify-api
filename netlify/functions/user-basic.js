// Netlify serverless function - must export a handler
const { executeQuery } = require('./db-config.js');

exports.handler = async (event, context) => {
  // Set CORS headers for Netlify
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  console.log('=== USER-BASIC API CALL (Netlify) ===');
  
  // Parse query parameters from Netlify event
  const params = event.queryStringParameters || {};
  const { mt5_name } = params;

  console.log('Query parameters:', params);

  if (!mt5_name) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Missing mt5_name parameter',
      }),
    };
  }

  try {
    const userResult = await executeQuery(
      `SELECT 
         u.id, u.name, u.email, u.state, u.created_at,
         man.mt5_name, man.state as mt5_state, man.created_at as mt5_created_at
       FROM users u
       INNER JOIN mt5_account_names man ON u.id = man.user_id
       WHERE man.mt5_name = $1`,
      [mt5_name]
    );

    console.log('Database query results:', userResult.rows.length, 'rows found');

    if (userResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'User not found',
        }),
      };
    }

    const row = userResult.rows[0];
    
    const formatPostgresDate = (postgresDate) => {
      if (!postgresDate) return 'Unknown';
      const date = new Date(postgresDate);
      return date.toISOString().replace('T', ' ').substring(0, 19);
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        user: {
          id: row.id,
          name: row.name,
          email: row.email,
          state: row.state,
          created_at: formatPostgresDate(row.created_at),
          mt5_name: row.mt5_name,
          mt5_state: row.mt5_state,
          mt5_created_at: formatPostgresDate(row.mt5_created_at),
        },
      }),
    };

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};
