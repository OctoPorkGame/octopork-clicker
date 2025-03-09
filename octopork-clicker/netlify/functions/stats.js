const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

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
  console.log('Stats function triggered at:', new Date().toISOString());
  try {
    const clicksRef = ref(db, 'clicks');
    console.log('Fetching clicks from Firebase...');
    const snapshot = await get(clicksRef).catch(err => {
      console.error('Firebase get error:', err);
      throw err;
    });
    const clicks = snapshot.val() || {};
    console.log('Fetched clicks:', Object.keys(clicks).length, 'entries');

    let total = 0;
    const playerIds = new Set();
    for (const click of Object.values(clicks)) {
      const amount = Number(click.amount) || 0;
      if (isNaN(amount)) {
        console.log('Invalid amount in click:', click);
        continue;
      }
      total += amount;
      if (click.playerId) playerIds.add(click.playerId);
    }
    const uniquePlayers = playerIds.size;
    console.log('Calculated total:', total, 'Players:', uniquePlayers);

    const response = { total, players: uniquePlayers };
    console.log('Returning response:', response);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Stats function failed:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};
