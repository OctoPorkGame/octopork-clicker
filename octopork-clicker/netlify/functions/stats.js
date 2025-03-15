const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

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
  console.log('Stats function triggered at:', new Date().toISOString());
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Allow all origins for debugging
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const statsRef = ref(db, 'stats/global');
    const snapshot = await get(statsRef);
    const data = snapshot.val() || { total: 0, players: 0 };
    console.log('Fetched stats from /stats/global:', data);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ total: data.total || 0, players: data.players || 0 })
    };
  } catch (error) {
    console.error('Stats function failed:', error.message, error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};
