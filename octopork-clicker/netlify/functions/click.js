const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error.message, error.stack);
    throw error;
  }
}

const db = admin.database();

exports.handler = async (event, context) => {
  console.log('Click function triggered with body:', event.body);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://octoporkgame.netlify.app', // Restrict to your domain
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Validate HTTP method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  // Parse request body
  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
    console.log('Received body:', body);
  } catch (parseError) {
    console.error('Failed to parse body:', parseError.message);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  try {
    const { amount, multiplier = 1, playerId, level, teamId } = body;

    // Basic input validation
    if (!amount || amount <= 0) throw new Error('Amount is required and must be positive');
    if (!playerId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(playerId)) {
      throw new Error('Valid playerId (UUID) is required');
    }
    if (level < 1 || level > 10 || !Number.isInteger(level)) {
      throw new Error('Invalid level: must be an integer between 1 and 10');
    }

    // Calculate effective amount with server-side multipliers
    let effectiveAmount = amount * multiplier;
    let clickMultiplier = 1;
    if (level >= 3) clickMultiplier = 2;
    if (level >= 4) clickMultiplier = 3;
    if (level >= 10 && teamId) clickMultiplier = 4;
    effectiveAmount *= clickMultiplier;

    // Database references
    const clicksRef = db.ref('clicks');
    const statsRef = db.ref('stats/global');
    const playersRef = db.ref(`players/${playerId}`);
    const playerTotalsRef = db.ref(`playerTotals/${playerId}`);

    // Record the click
    const clickResult = await clicksRef.push({
      amount,
      multiplier,
      effectiveAmount,
      playerId,
      level,
      teamId,
      timestamp: new Date().toISOString(),
    });
    console.log('Click recorded with ID:', clickResult.key);

    // Update global stats
    await statsRef.update({
      total: admin.database.ServerValue.increment(effectiveAmount),
      lastUpdated: new Date().toISOString(),
    });

    // Update player totals
    await playerTotalsRef.update({
      total: admin.database.ServerValue.increment(effectiveAmount),
      clickCount: admin.database.ServerValue.increment(1),
      lastUpdated: new Date().toISOString(),
    });

    // Update player last seen
    await playersRef.update({ lastSeen: new Date().toISOString() });

    // Initialize player totals if new
    const playerTotalSnap = await playerTotalsRef.once('value');
    if (!playerTotalSnap.exists()) {
      await playerTotalsRef.set({
        total: effectiveAmount,
        clickCount: 1,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Update player count
    const playerTotalsSnap = await db.ref('playerTotals').once('value');
    const uniquePlayers = playerTotalsSnap.exists() ? Object.keys(playerTotalsSnap.val()).length : 0;
    await statsRef.update({ players: uniquePlayers });
    console.log('Updated player count to:', uniquePlayers);

    // Update team total if applicable
    if (teamId) {
      const teamRef = db.ref(`teams/${teamId}/total`);
      await teamRef.update({
        total: admin.database.ServerValue.increment(effectiveAmount),
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, clickId: clickResult.key }),
    };
  } catch (error) {
    console.error('Click handler error:', error.message, error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
