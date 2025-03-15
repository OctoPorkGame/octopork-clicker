const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

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

console.log('Firebase Config in stats.js:', firebaseConfig);

if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL || !firebaseConfig.projectId) {
  throw new Error('Missing required Firebase environment variables in stats.js');
}

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

exports.handler = async (event, context) => {
  console.log('Stats function triggered');
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const statsRef = ref(db, 'stats/global');
    const snapshot = await get(statsRef);
    console.log('Stats snapshot:', snapshot.val());

    if (!snapshot.exists()) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ total: 0, players: 0, lastUpdated: new Date().toISOString() }),
      };
    }

    const stats = snapshot.val();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stats),
    };
  } catch (error) {
    console.error('Stats handler error:', error.message, error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch stats' }),
    };
  }
};
