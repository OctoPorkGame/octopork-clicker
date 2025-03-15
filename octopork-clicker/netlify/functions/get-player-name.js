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

console.log('Firebase Config in get-player-name.js:', firebaseConfig);

if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL || !firebaseConfig.projectId) {
  throw new Error('Missing required Firebase environment variables in get-player-name.js');
}

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

exports.handler = async (event, context) => {
  console.log('Get player name function triggered with body:', event.body);
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
    const { playerId } = body;
    if (!playerId || typeof playerId !== 'string' || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(playerId)) {
      throw new Error('Valid playerId (UUID) is required');
    }

    const playerRef = ref(db, `players/${playerId}`);
    const snapshot = await get(playerRef);
    console.log('Player snapshot:', snapshot.val());

    if (!snapshot.exists() || !snapshot.val().name) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ name: null }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ name: snapshot.val().name }),
    };
  } catch (error) {
    console.error('Get player name handler error:', error.message, error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
