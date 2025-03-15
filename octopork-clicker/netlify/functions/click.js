const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, update, increment, get } = require('firebase/database');

// Firebase configuration using environment variables
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

// Debug log to verify environment variables
console.log('Firebase Config:', firebaseConfig);

// Validate required fields
if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL || !firebaseConfig.projectId) {
  throw new Error('Missing required Firebase environment variables: apiKey, databaseURL, or projectId');
}

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
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  try {
    const { amount, playerId } = body;
    console.log('Extracted amount:', amount, 'playerId:', playerId);
    if (!amount || amount <= 0) throw new Error('Amount is required and must be positive');
    if (!playerId || typeof playerId !== 'string' || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(playerId)) {
      throw new Error('Valid playerId (UUID) is required');
    }

    const clicksRef = ref(db, 'clicks');
    const statsRef = ref(db, 'stats/global');
    const playersRef = ref(db, 'players');

    const clickResult = await push(clicksRef, {
      amount,
      playerId,
      timestamp: new Date().toISOString(),
    }).catch((err) => {
      throw new Error(`Failed to write to /clicks: ${err.message}`);
    });
    console.log('Click recorded with ID:', clickResult.key, 'for playerId:', playerId);

    await update(statsRef, {
      total: increment(amount),
      lastUpdated: new Date().toISOString(),
    }).catch((err) => {
      throw new Error(`Failed to update /stats/global/total: ${err.message}`);
    });
    console.log('Updated total in stats/global');

    const playerSnap = await get(ref(db, `players/${playerId}`)).catch((err) => {
      throw new Error(`Failed to read /players/${playerId}: ${err.message}`);
    });
    if (!playerSnap.exists()) {
      await update(ref(db, `players/${playerId}`), {
        lastSeen: new Date().toISOString(),
      }).catch((err) => {
        throw new Error(`Failed to write to /players/${playerId}: ${err.message}`);
      });
      await update(statsRef, { players: increment(1) }).catch((err) => {
        throw new Error(`Failed to update /stats/global/players: ${err.message}`);
      });
      console.log('New player added:', playerId);
    } else {
      console.log('Player already exists:', playerId);
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
