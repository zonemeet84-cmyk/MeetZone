const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://meetzone_db:Meetzone2026@cluster0.rk9oqyx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB server");
  } catch (err) {
    console.error("Connection error:", err);
  } finally {
    await client.close();
  }
}
run();
