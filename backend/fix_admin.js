require('dotenv').config();
const { MongoClient } = require('mongodb');

async function run() {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    
    // Admin ka 2FA hata do
    await client.db().collection('users').updateOne(
      { email: 'ds9376314@gmail.com' },
      { $unset: { twoFactorSecret: '' } }
    );
    
    console.log('\n✅ Success: Admin account (ds9376314@gmail.com) se 2FA hat gaya hai! Ab aap bina code ke login kar sakte hain.');
    process.exit(0);
  } catch(e) {
    console.log('Error:', e.message);
    process.exit(1);
  }
}

run();
