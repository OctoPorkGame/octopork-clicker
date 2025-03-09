const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyAgBd2mkHUwEgyeMCMli7d_JeZi3y9rPrQ",
  authDomain: "octopork-clicker.firebaseapp.com",
  databaseURL: "https://octopork-clicker-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "octopork-clicker",
  storageBucket: "octopork-clicker.firebasestorage.app",
  messagingSenderId: "306492024224",
  appId: "1:306492024224:web:9d2b06a88e70921c15b0c5",
  measurementId: "G-VBRZDMWELQ"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

exports.handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const amount = Number(body.amount) || 0;
    if (isNaN(amount) || amount <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid amount' }) };
    }

    const playerId = event.headers['client-ip'] || 'unknown';
    const clickData = {
      amount,
      playerId,
      timestamp: new Date().toISOString()
    };

    const clicksRef = ref(db, 'clicks');
    await push(clicksRef, clickData);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
