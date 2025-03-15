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
    const playerTotalsRef = db.ref('playerTotals');
    const playersRef = db.ref('players');

    const playerTotalsSnapshot = await playerTotalsRef.once('value');
    const playersSnapshot = await playersRef.once('value');

    const playerTotals = playerTotalsSnapshot.val() || {};
    const players = playersSnapshot.val() || {};

    const leaderboard = Object.keys(playerTotals)
      .map(playerId => ({
        playerId,
        name: players[playerId]?.name || 'Anonymous',
        total: playerTotals[playerId].total || 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ leaderboard }),
    };
  } catch (error) {
    console.error('Leaderboard fetch error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
