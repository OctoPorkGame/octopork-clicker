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
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
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
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};

4. set-player-name.js
javascript

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
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (parseError) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  try {
    const { playerId, name } = body;
    if (!playerId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(playerId)) {
      throw new Error('Valid playerId (UUID) is required');
    }
    if (!name || name.length < 3 || name.length > 20) {
      throw new Error('Name must be 3-20 characters');
    }
    if (/<[a-z][\s\S]*>/i.test(name)) {
      throw new Error('Invalid name: HTML tags are not allowed');
    }

    const playersRef = db.ref(`players/${playerId}`);
    await playersRef.update({
      name,
      lastSeen: new Date().toISOString(),
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Set player name error:', error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};

