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
  console.log('Click function triggered with event:', event);
  try {
    const body = JSON.parse(event.body || '{}');
    console.log('Parsed body:', body);
    const amount = Number(body.amount) || 0;
    const playerId = body.playerId || `unknown-${Math.random().toString(36).substring(2, 9)}`;
    console.log('Received playerId:', playerId);

    if (isNaN(amount) || amount <= 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Invalid amount' })
      };
    }

    const clickData = {
      amount,
      playerId,
      timestamp: new Date().toISOString()
    };

    const clicksRef = ref(db, 'clicks');
    await push(clicksRef, clickData);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Click function failed:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};: JSON.stringify({ error: error.message })
    };
  }
};
