const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const db = admin.database();

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://octoporkgame.netlify.app',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const statsRef = db.ref('stats/global');
    const statsSnapshot = await statsRef.once('value');
    const stats = statsSnapshot.val() || { total: 0, players: 0, lastUpdated: null };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stats),
    };
  } catch (error) {
    console.error('Stats fetch error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
