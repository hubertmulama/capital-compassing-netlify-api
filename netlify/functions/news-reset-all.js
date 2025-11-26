const { executeQuery } = require('./db-config.js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const query = `
      UPDATE news_state 
      SET 
        monday_state = 'enabled',
        tuesday_state = 'enabled',
        wednesday_state = 'enabled', 
        thursday_state = 'enabled',
        friday_state = 'enabled',
        updated_at = NOW()
    `;
    
    const result = await executeQuery(query);

    const countQuery = `SELECT COUNT(*) as updated_count FROM news_state`;
    const countResult = await executeQuery(countQuery);
    const updatedCount = countResult.rows[0].updated_count;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `All ${updatedCount} currencies reset to enabled`,
        updated_count: updatedCount
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message
      })
    };
  }
};
