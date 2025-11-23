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

  const { pair_name } = event.queryStringParameters;

  if (!pair_name) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Missing pair_name parameter' 
      })
    };
  }

  try {
    const pairResult = await executeQuery(
      `SELECT * FROM trading_pairs WHERE pair = $1`,
      [pair_name]
    );

    if (pairResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, error: 'Trading pair not found' })
      };
    }

    const pair = pairResult.rows[0];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        pair: {
          id: pair.id,
          pair: pair.pair,
          category: pair.category,
          state: pair.state,
          created_at: pair.created_at
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
