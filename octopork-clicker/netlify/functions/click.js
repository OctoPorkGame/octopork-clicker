const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, update, increment, get } = require('firebase/database');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

exports.handler = async (event, context) => {
  console.log('Click function triggered with body:', event.body);
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
    console.log('Received body:', body);
  } catch (parseError) {
    console.error('Failed to parse body:', parseError.message);
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  try {
    const { amount, multiplier = 1, playerId, level, teamId } = body;
    if (!amount || amount <= 0) throw new Error('Amount is required and must be positive');
    if (!playerId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(playerId)) {
      throw new Error('Valid playerId (UUID) is required');
    }

    let effectiveAmount = amount * multiplier;
    let clickMultiplier = 1;
    if (level >= 3) clickMultiplier = 2; // Upgrade from Level 3
    if (level >= 4) clickMultiplier = 3; // Neon Shredder
    if (level >= 10 && teamId) clickMultiplier = 4; // Leader boost (simplified)
    effectiveAmount *= clickMultiplier;

    const clicksRef = ref(db, 'clicks');
    const statsRef = ref(db, 'stats/global');
    const playersRef = ref(db, 'players');
    const playerRef = ref(db, `players/${playerId}`);
    const playerTotalsRef = ref(db, `playerTotals/${playerId}`);

    const clickResult = await push(clicksRef, {
      amount, multiplier, effectiveAmount, playerId, level, teamId, timestamp: new Date().toISOString(),
    }).catch(err => { throw new Error(`Failed to write to /clicks: ${err.message}`); });
    console.log('Click recorded with ID:', clickResult.key);

    await update(statsRef, { total: increment(effectiveAmount), lastUpdated: new Date().toISOString() })
      .catch(err => { throw new Error(`Failed to update /stats/global/total: ${err.message}`); });
    console.log('Updated total in stats/global');

    await update(playerTotalsRef, { total: increment(effectiveAmount), lastUpdated: new Date().toISOString() })
      .catch(err => { throw new Error(`Failed to update /playerTotals: ${err.message}`); });
    console.log('Updated player total for:', playerId);

    const playerSnap = await get(playerRef).catch(err => { throw new Error(`Failed to read /players/${playerId}: ${err.message}`); });
    if (!playerSnap.exists()) {
      await update(playerRef, { lastSeen: new Date().toISOString(), joined: new Date().toISOString() });
      const statsSnap = await get(statsRef);
      let currentPlayers = statsSnap.exists() ? statsSnap.val().players || 0 : 0;
      await update(statsRef, { players: currentPlayers + 1 });
      console.log('New player added:', playerId, 'Total players now:', currentPlayers + 1);
    } else {
      await update(playerRef, { lastSeen: new Date().toISOString() });
    }

    if (teamId) {
      const teamRef = ref(db, `teams/${teamId}/total`);
      await update(teamRef, { total: increment(effectiveAmount) });
      console.log('Updated team total for:', teamId);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, clickId: clickResult.key }) };
  } catch (error) {
    console.error('Click handler error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
