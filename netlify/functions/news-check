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

  const { day } = event.queryStringParameters || {};

  if (!day) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Missing day parameter' })
    };
  }

  const dayInt = parseInt(day);
  if (dayInt < 1 || dayInt > 5) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Day must be 1-5 (Monday-Friday)' })
    };
  }

  try {
    // Map day number to column name
    const dayColumns = {
      1: 'monday_state',
      2: 'tuesday_state', 
      3: 'wednesday_state',
      4: 'thursday_state',
      5: 'friday_state'
    };

    const dayColumn = dayColumns[dayInt];
    
    // Single query to get all currencies at once
    const query = `SELECT currency, ${dayColumn} as state FROM news_state`;
    
    const result = await executeQuery(query);

    if (result.rows.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'No currencies found in database',
          states: {}
        })
      };
    }

    // Build states object
    const states = {};
    result.rows.forEach(row => {
      states[row.currency] = row.state;
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        day: dayInt,
        states: states,
        message: 'Success'
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message,
        states: {}
      })
    };
  }
};
