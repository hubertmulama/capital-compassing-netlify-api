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

  const { ea_id, pair_id } = event.queryStringParameters;

  if (!ea_id || !pair_id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Missing ea_id or pair_id parameter' 
      })
    };
  }

  try {
    const assignmentResult = await executeQuery(
      `SELECT 
        epa.*,
        ea.name as ea_name,
        tp.pair as pair_name,
        tp.category as pair_category
       FROM ea_pair_assignments epa
       INNER JOIN eas ea ON epa.ea_id = ea.id
       INNER JOIN trading_pairs tp ON epa.pair_id = tp.id
       WHERE epa.ea_id = $1 AND epa.pair_id = $2`,
      [ea_id, pair_id]
    );

    if (assignmentResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, error: 'EA-Pair assignment not found' })
      };
    }

    const assignment = assignmentResult.rows[0];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        assignment: {
          id: assignment.id,
          ea_id: assignment.ea_id,
          ea_name: assignment.ea_name,
          pair_id: assignment.pair_id,
          pair_name: assignment.pair_name,
          pair_category: assignment.pair_category,
          state: assignment.state,
          created_at: assignment.created_at
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
