const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, update, increment, get } = require('firebase/database');

try {
  const app = initializeApp({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  });
  const db = getDatabase(app);
} catch (error) {
  console.error('Firebase initialization failed:', error.message, error.stack);
}

exports.handler = async (event, context) => {
  console.log('Click function triggered with body:', event.body);
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Allow all origins for debugging
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const { amount, playerId } = JSON.parse(event.body || '{}');
    console.log('Received body:', { amount, playerId });
    if (!amount || amount <= 0) throw new Error('Amount is required and must be positive');
    if (!playerId || typeof playerId !== 'string' || playerId === 'unknown') {
      throw new Error('Valid playerId is required');
    }

    const clicksRef = ref(db, 'clicks');
    const statsRef = ref(db, 'stats/global');
    const playersRef = ref(db, 'players');

    const clickId = await push(clicksRef, { amount, playerId, timestamp: new Date().toISOString() });
    console.log('Click recorded with ID:', clickId.key, 'for playerId:', playerId);

    // Update total
    await update(statsRef, {
      total: { '.value': increment(amount) },
      lastUpdated: new Date().toISOString()
    });
    console.log('Updated total in stats/global');

    // Add player if new
    const playerSnap = await get(ref(db, `players/${playerId}`));
    if (!playerSnap.exists()) {
      await update(ref(db, `players/${playerId}`), { lastSeen: new Date().toISOString() });
      await update(statsRef, { players: { '.value': increment(1) } });
      console.log('New player added:', playerId);
    } else {
      console.log('Player already exists:', playerId);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, clickId: clickId.key })
    };
  } catch (error) {
    console.error('Click handler error:', error.message, error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
