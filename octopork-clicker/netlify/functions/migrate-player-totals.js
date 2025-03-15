const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, update } = require('firebase/database');

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
  console.log('Migrate player totals function triggered');
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Fetch all clicks
    const clicksRef = ref(db, 'clicks');
    const clicksSnapshot = await get(clicksRef);
    if (!clicksSnapshot.exists()) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'No clicks to migrate' }),
      };
    }

    const clicks = clicksSnapshot.val();
    const playerTotals = {};

    // Aggregate totals by playerId
    for (const [clickId, clickData] of Object.entries(clicks)) {
      const { playerId, amount } = clickData;
      if (!playerId || !amount) continue;
      if (!playerTotals[playerId]) {
        playerTotals[playerId] = 0;
      }
      playerTotals[playerId] += amount;
    }

    // Write totals to /playerTotals
    for (const [playerId, total] of Object.entries(playerTotals)) {
      const playerTotalsRef = ref(db, `playerTotals/${playerId}`);
      await update(playerTotalsRef, {
        total,
        lastUpdated: new Date().toISOString(),
      });
      console.log(`Migrated total for ${playerId}: ${total}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Migration completed', playerTotals }),
    };
  } catch (error) {
    console.error('Migration error:', error.message, error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
