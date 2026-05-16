const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'backend/server.js');
let code = fs.readFileSync(serverFile, 'utf8');

// 1. Add MongoDB client at the top
if (!code.includes("const { MongoClient } = require('mongodb');")) {
    code = code.replace('const express = require("express");', 
        `const express = require("express");\nconst { MongoClient } = require('mongodb');\nconst MONGO_URI = "mongodb+srv://zonemeet84:kawal%401234@cluster0.rk9oqyx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";\nconst mongoClient = new MongoClient(MONGO_URI);\nlet db;`);
}

// 2. Wrap server.listen in initDB function
if (!code.includes("async function startServer()")) {
    const listenCode = /const PORT = process\.env\.PORT \|\| 5000;[\s\S]*server\.listen\(PORT, \(\) => {[\s\S]*console\.log\(\`Server running on port \$\{PORT\}\`\);[\s\S]*}\);/;
    
    code = code.replace(listenCode, `
async function startServer() {
  try {
    await mongoClient.connect();
    db = mongoClient.db("meetzone");
    console.log("Connected to MongoDB Atlas");
    
    // Load data from DB into memory
    const d1 = await db.collection("appData").findOne({ _id: "users" }); if(d1 && d1.data) users = d1.data;
    const d2 = await db.collection("appData").findOne({ _id: "bannedEmails" }); if(d2 && d2.data) bannedEmails = d2.data;
    const d3 = await db.collection("appData").findOne({ _id: "bannedIps" }); if(d3 && d3.data) bannedIps = d3.data;
    const d4 = await db.collection("appData").findOne({ _id: "transactions" }); if(d4 && d4.data) transactions = d4.data;
    const d5 = await db.collection("appData").findOne({ _id: "coinActivity" }); if(d5 && d5.data) coinActivity = d5.data;
    const d6 = await db.collection("appData").findOne({ _id: "reports" }); if(d6 && d6.data) reports = d6.data;
    const d7 = await db.collection("appData").findOne({ _id: "contactMessages" }); if(d7 && d7.data) contactMessages = d7.data;
    const d8 = await db.collection("appData").findOne({ _id: "systemConfig" }); if(d8 && d8.data) systemConfig = d8.data;

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(\`Server running on port \$\{PORT\}\`);
    });
  } catch(e) {
    console.error("MongoDB Error:", e);
  }
}
startServer();
`);
}

// 3. Patch save functions to also save to MongoDB
const functionsToPatch = [
    { name: 'saveUsers', id: 'users', var: 'users' },
    { name: 'saveBanned', id: 'bannedEmails', var: 'bannedEmails' },
    { name: 'saveBannedIps', id: 'bannedIps', var: 'bannedIps' },
    { name: 'saveTransactions', id: 'transactions', var: 'transactions' },
    { name: 'saveCoinActivity', id: 'coinActivity', var: 'coinActivity' },
    { name: 'saveReports', id: 'reports', var: 'reports' },
    { name: 'saveMessages', id: 'contactMessages', var: 'contactMessages' },
    { name: 'saveSystemConfig', id: 'systemConfig', var: 'systemConfig' }
];

for (const fn of functionsToPatch) {
    const regex = new RegExp(`function ${fn.name}\\(\\)\\s*{[\\s\\S]*?fs\\.writeFileSync.*?[\\s\\S]*?}`, 'g');
    if (code.match(regex)) {
        code = code.replace(regex, `function ${fn.name}() {
  try { fs.writeFileSync(${fn.name === 'saveSystemConfig' ? 'SYSTEM_CONFIG_FILE' : fn.name === 'saveBanned' ? 'BANNED_FILE' : fn.name === 'saveBannedIps' ? 'BANNED_IPS_FILE' : fn.name.replace('save', '').toUpperCase() + '_FILE'}, JSON.stringify(${fn.var}, null, 2)); } catch(e){}
  if(db) db.collection("appData").updateOne({ _id: "${fn.id}" }, { $set: { data: ${fn.var} } }, { upsert: true }).catch(console.error);
}`);
    }
}

fs.writeFileSync(serverFile, code, 'utf8');
console.log("MongoDB patch applied successfully!");
