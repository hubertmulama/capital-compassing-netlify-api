import { executeQuery } from './db-config.js';

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers, 
      body: JSON.stringify({ error: 'Method not allowed' }) 
    };
  }

  console.log('Raw event body:', event.body);
  console.log('Body type:', typeof event.body);

  let body;
  try {
    // Try to parse JSON - MQL5 might be sending it as a string that needs parsing
    if (typeof event.body === 'string') {
      body = JSON.parse(event.body);
    } else if (event.body) {
      body = event.body;
    } else {
      throw new Error('Empty body');
    }
    console.log('Parsed body:', body);
  } catch (error) {
    console.error('JSON parse error:', error);
    console.error('Raw body that failed:', event.body);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Invalid JSON body: ' + error.message,
        receivedBody: event.body
      })
    };
  }

  const { mt5_name, account_number, balance, equity, margin, free_margin, leverage } = body;

  if (!mt5_name || !account_number) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Missing required parameters: mt5_name and account_number are required' 
      })
    };
  }

  try {
    const mt5Result = await executeQuery(
      `SELECT id FROM mt5_account_names WHERE mt5_name = $1`,
      [mt5_name]
    );

    if (mt5Result.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, error: 'MT5 account name not found in database' })
      };
    }

    const mt5_name_id = mt5Result.rows[0].id;
    const insertResult = await executeQuery(
      `INSERT INTO account_details 
       (mt5_name_id, account_number, balance, equity, margin, free_margin, leverage, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT (mt5_name_id, account_number) 
       DO UPDATE SET 
         balance = EXCLUDED.balance,
         equity = EXCLUDED.equity,
         margin = EXCLUDED.margin,
         free_margin = EXCLUDED.free_margin,
         leverage = EXCLUDED.leverage,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [mt5_name_id, account_number, balance, equity, margin, free_margin, leverage]
    );

    console.log('Database operation successful:', insertResult.rows[0]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Account details updated successfully',
        data: insertResult.rows[0]
      })
    };

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: error.message 
      })
    };
  }
}
