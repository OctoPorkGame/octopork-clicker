const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push } = require('firebase/database');

const firebaseConfig = { /* same as before */ };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

exports.handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const amount = Number(body.amount) || 0;
    if (isNaN(amount) || amount <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid amount' }) };
    }

    const ip = event.headers['client-ip'] || 'unknown';
    const uniqueId = Math.random().toString(36).substring(2, 9); // Generate a random string
    const playerId = `${ip}-${uniqueId}`; // Combine IP with random string for uniqueness
    console.log('Generated playerId:', playerId);

    const clickData = {
      amount,
      playerId,
      timestamp: new Date().toISOString()
    };

    const clicksRef = ref(db, 'clicks');
    await push(clicksRef, clickData);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Click function failed:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
