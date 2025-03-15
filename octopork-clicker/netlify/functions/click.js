const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, update, increment, get } = require('firebase/database');

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

exports.handler = async (event, context) => {
  try {
    const { amount, playerId } = JSON.parse(event.body);
    if (!amount || amount <= 0) throw new Error('Amount is required and must be positive');
    if (!playerId) throw new Error('playerId is required');

    const clicksRef = ref(db, 'clicks');
    const statsRef = ref(db, 'stats/global');
    const playersRef = ref(db, 'players');

    await push(clicksRef, { amount, playerId, timestamp: new Date().toISOString() });

    // Update total
    await update(statsRef, {
      total: { '.value': increment(amount) },
      lastUpdated: new Date().toISOString()
    });

    // Add player if new
    const playerSnap = await get(ref(db, `players/${playerId}`));
    if (!playerSnap.exists()) {
      await update(ref(db, `players/${playerId}`), { lastSeen: new Date().toISOString() });
      await update(statsRef, { players: { '.value': increment(1) } });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Click handler error:', error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
