require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const USERS_FILE = path.join(__dirname, "users.json");

// Helper to normalize a single user object
function migrateUser(u) {
  let changed = false;

  if (u.streak_day === undefined) {
    u.streak_day = u.streak !== undefined ? u.streak : 1;
    changed = true;
  }
  if (u.last_claim_date === undefined) {
    u.last_claim_date = u.lastClaimDate !== undefined ? u.lastClaimDate : "";
    changed = true;
  }
  if (u.streak_broken === undefined) {
    u.streak_broken = false;
    changed = true;
  }
  if (u.streak_protection_used === undefined) {
    u.streak_protection_used = false;
    changed = true;
  }
  if (u.coins === undefined) {
    u.coins = 0;
    changed = true;
  }

  return changed;
}

async function runMigration() {
  console.log("=== STARTING STREAK SYSTEM DATABASE MIGRATION ===");

  // 1. Migrate local users.json
  let localUsers = [];
  let fileUpdated = false;

  if (fs.existsSync(USERS_FILE)) {
    try {
      localUsers = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
      console.log(`Loaded ${localUsers.length} users from local JSON file`);
      
      localUsers.forEach(u => {
        if (migrateUser(u)) {
          fileUpdated = true;
        }
      });

      if (fileUpdated) {
        fs.writeFileSync(USERS_FILE, JSON.stringify(localUsers, null, 2));
        console.log("Local users.json successfully migrated and saved!");
      } else {
        console.log("Local users.json was already fully migrated.");
      }
    } catch (err) {
      console.error("Error reading/writing local users.json:", err.message);
    }
  } else {
    console.log("No local users.json file found to migrate.");
  }

  // 2. Migrate MongoDB users
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.log("MONGO_URI not defined in environment variables. Skipping MongoDB migration.");
    return;
  }

  const mongoClient = new MongoClient(MONGO_URI);
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoClient.connect();
    const db = mongoClient.db("meetzone");
    console.log("Connected successfully to MongoDB.");

    const d1 = await db.collection("appData").findOne({ _id: "users" });
    if (d1 && d1.data) {
      const dbUsers = d1.data;
      console.log(`Loaded ${dbUsers.length} users from MongoDB`);
      
      let dbUpdated = false;
      dbUsers.forEach(u => {
        if (migrateUser(u)) {
          dbUpdated = true;
        }
      });

      if (dbUpdated) {
        await db.collection("appData").updateOne(
          { _id: "users" },
          { $set: { data: dbUsers } },
          { upsert: true }
        );
        console.log("MongoDB users successfully migrated and saved!");
      } else {
        console.log("MongoDB users were already fully migrated.");
      }
    } else {
      console.log("No users list found in MongoDB collection appData.");
    }
  } catch (err) {
    console.error("Error migrating MongoDB:", err.message);
  } finally {
    await mongoClient.close();
    console.log("MongoDB connection closed.");
  }

  console.log("=== MIGRATION COMPLETE ===");
}

runMigration().catch(console.error);
