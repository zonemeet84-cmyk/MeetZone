require('dotenv').config(); 
const { MongoClient } = require('mongodb');

async function run() { 
  const client = new MongoClient(process.env.MONGO_URI); 
  await client.connect(); 
  const db = client.db(); 
  const usersDoc = await db.collection('appData').findOne({ _id: 'users' }); 
  if (usersDoc && usersDoc.data) { 
    let c = 0; 
    usersDoc.data.forEach(x => { 
      if (x.twoFactorSecret) { 
        delete x.twoFactorSecret; 
        c++; 
      } 
    }); 
    await db.collection('appData').updateOne({ _id: 'users' }, { $set: { data: usersDoc.data } }); 
    console.log('Removed from '+c+' users in Mongo.'); 
  } 
  client.close(); 
} 
run().catch(console.error);
