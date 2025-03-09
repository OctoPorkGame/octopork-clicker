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
    const { amount } = JSON.parse(event.body);
    if (!amount || amount <= 0) throw new Error('Amount is required and must be positive');

    const playerId = context.clientContext?.identity?.ip || 'unknown';

    const clicksRef = ref(db, 'clicks');
    await push(clicksRef, {
      amount,
      playerId,
      timestamp: new Date().toISOString()
    });

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