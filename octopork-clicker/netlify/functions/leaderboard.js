const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

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
  console.log('Leaderboard function triggered');
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const playerTotalsRef = ref(db, 'playerTotals');
    const snapshot = await get(playerTotalsRef);
    console.log('Player totals snapshot:', snapshot.val());

    if (!snapshot.exists()) {
      return { statusCode: 200, headers, body: JSON.stringify({ leaderboard: [] }) };
    }

    const totals = snapshot.val();
    const leaderboard = Object.entries(totals)
      .map(([playerId, data]) => ({ playerId, name: 'Anonymous', total: data.total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return { statusCode: 200, headers, body: JSON.stringify({ leaderboard }) };
  } catch (error) {
    console.error('Leaderboard handler error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
