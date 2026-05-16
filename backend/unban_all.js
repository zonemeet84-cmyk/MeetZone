const fs = require('fs');
const { MongoClient } = require('mongodb');

const MONGO_URI = "mongodb+srv://zonemeet84:kawal%401234@cluster0.rk9oqyx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const mongoClient = new MongoClient(MONGO_URI);

async function clearBans() {
  try {
    await mongoClient.connect();
    const db = mongoClient.db("meetzone");

    console.log("Clearing bans from MongoDB...");
    await db.collection("appData").updateOne({ _id: "bannedEmails" }, { $set: { data: [] } }, { upsert: true });
    await db.collection("appData").updateOne({ _id: "bannedIps" }, { $set: { data: [] } }, { upsert: true });
    
    console.log("Bans cleared from MongoDB.");

    fs.writeFileSync("banned_ips.json", JSON.stringify([]));
    fs.writeFileSync("banned_emails.json", JSON.stringify([]));
    console.log("Local ban files cleared.");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoClient.close();
    process.exit(0);
  }
}

clearBans();
