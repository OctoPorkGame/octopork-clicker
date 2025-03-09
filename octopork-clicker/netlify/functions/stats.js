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
  console.log('Stats function triggered');
  try {
    const clicksRef = ref(db, 'clicks');
    const snapshot = await get(clicksRef);
    const clicks = snapshot.val() || {};
    console.log('Fetched clicks:', clicks);

    const total = Object.values(clicks).reduce((sum, click) => {
      const amount = click.amount || 0;
      if (isNaN(amount)) console.log('Invalid amount:', click);
      return sum + amount;
    }, 0);
    const uniquePlayers = new Set(Object.values(clicks).map(click => click.playerId)).size;
    console.log('Calculated total:', total, 'Players:', uniquePlayers);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ total, players: uniquePlayers })
    };
  } catch (error) {
    console.error('Stats error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
