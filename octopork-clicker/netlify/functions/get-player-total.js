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
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { playerId } = body;
  if (!playerId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'playerId is required' }) };
  }

  try {
    const playerTotalRef = ref(db, `playerTotals/${playerId}`);
    const snapshot = await get(playerTotalRef);
    if (!snapshot.exists()) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Player total not found' }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ total: snapshot.val().total }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};