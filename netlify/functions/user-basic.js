const { executeQuery } = require('./db-config.js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { mt5_name } = event.queryStringParameters || {};

  if (!mt5_name) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Missing mt5_name parameter' })
    };
  }

  try {
    const userResult = await executeQuery(
      `SELECT u.id, u.name, u.email, u.state, u.created_at,
              man.mt5_name, man.state as mt5_state, man.created_at as mt5_created_at
       FROM users u
       INNER JOIN mt5_account_names man ON u.id = man.user_id
       WHERE man.mt5_name = $1`,
      [mt5_name]
    );

    if (userResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, error: 'User not found' })
      };
    }

    const row = userResult.rows[0];
    const formatDate = (date) => date ? new Date(date).toISOString().replace('T', ' ').substring(0, 19) : 'Unknown';

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
          created_at: formatDate(row.created_at),
          mt5_name: row.mt5_name,
          mt5_state: row.mt5_state,
          mt5_created_at: formatDate(row.mt5_created_at)
        }
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
