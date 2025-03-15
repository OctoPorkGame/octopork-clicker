const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

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
  console.log('Stats function triggered at:', new Date().toISOString());
  try {
    const statsRef = ref(db, 'stats/global');
    const snapshot = await get(statsRef);
    const data = snapshot.val() || { total: 0, players: 0 };
    console.log('Fetched stats:', data);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://octoporkgame.netlify.app'
      },
      body: JSON.stringify({ total: data.total, players: data.players })
    };
  } catch (error) {
    console.error('Stats function failed:', error.stack);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://octoporkgame.netlify.app'
      },
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};
