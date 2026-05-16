const express = require("express");
const { MongoClient } = require('mongodb');
const MONGO_URI = "mongodb+srv://zonemeet84:kawal%401234@cluster0.rk9oqyx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const mongoClient = new MongoClient(MONGO_URI);
let db;
const http = require("http");
const { Server } = require("socket.io");
const twilio = require("twilio");
const nodemailer = require("nodemailer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const rateLimit = require("express-rate-limit");
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Increased for Admin Dashboard polling
  message: { message: "Too many requests from this IP, please try again after a minute" }
});
app.use("/api/", apiLimiter);

// Global Logger for Debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const onlineUsers = new Map(); // userId -> socket.id

// RAZORPAY INITIALIZATION
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "YOUR_KEY_ID",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "YOUR_KEY_SECRET",
});

const JWT_SECRET = "zonemeet_secret_key_123";

const USERS_FILE = path.join(__dirname, "users.json");
const BANNED_FILE = path.join(__dirname, "banned_emails.json");
const BANNED_IPS_FILE = path.join(__dirname, "banned_ips.json");
const COIN_ACTIVITY_FILE = path.join(__dirname, "coin_activity.json");
const REPORTS_FILE = path.join(__dirname, "reports.json");
const TRANSACTIONS_FILE = path.join(__dirname, "transactions.json");
const MESSAGES_FILE = path.join(__dirname, "messages.json");

// ========= FIREBASE ADMIN CONFIG =========
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin Initialized");
} else {
  console.warn("⚠️ serviceAccountKey.json NOT FOUND. Firebase registration will fail.");
}
// =========================================

const otpStore = {}; // Memory store for OTPs (dev mode fallback): { phone: "123456" }

// ========= TWILIO CONFIG =========
// ⚠️ Step 1: Go to https://www.twilio.com and create a FREE account
// ⚠️ Step 2: Go to Console → Verify → Services → Create a new Service → Copy the Service SID
// ⚠️ Step 3: Copy your Account SID and Auth Token from: https://console.twilio.com
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "YOUR_TWILIO_ACCOUNT_SID";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "YOUR_TWILIO_AUTH_TOKEN";
const TWILIO_VERIFY_SID = process.env.TWILIO_VERIFY_SID || "YOUR_TWILIO_VERIFY_SID";

const twilioClient = (TWILIO_ACCOUNT_SID !== "YOUR_TWILIO_ACCOUNT_SID")
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;
// ==================================

// Load users
let users = [];
if (fs.existsSync(USERS_FILE)) {
  try { users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8")); } catch (err) { users = []; }
}

// Load banned emails
let bannedEmails = [];
if (fs.existsSync(BANNED_FILE)) {
  try { bannedEmails = JSON.parse(fs.readFileSync(BANNED_FILE, "utf-8")); } catch (err) { bannedEmails = []; }
}

let reports = [];
if (fs.existsSync(REPORTS_FILE)) {
  try { reports = JSON.parse(fs.readFileSync(REPORTS_FILE, "utf-8")); } catch (err) { reports = []; }
}

function saveReports() {
  try { fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2)); } catch(e){}
  if(db) db.collection("appData").updateOne({ _id: "reports" }, { $set: { data: reports } }, { upsert: true }).catch(console.error);
}

let transactions = [];
if (fs.existsSync(TRANSACTIONS_FILE)) {
  try { transactions = JSON.parse(fs.readFileSync(TRANSACTIONS_FILE, "utf-8")); } catch (err) { transactions = []; }
}
function saveTransactions() {
  try { fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2)); } catch(e){}
  if(db) db.collection("appData").updateOne({ _id: "transactions" }, { $set: { data: transactions } }, { upsert: true }).catch(console.error);
}

let coinActivity = [];
if (fs.existsSync(COIN_ACTIVITY_FILE)) {
  try { coinActivity = JSON.parse(fs.readFileSync(COIN_ACTIVITY_FILE, "utf-8")); } catch (err) { coinActivity = []; }
}
function saveCoinActivity() {
  try { fs.writeFileSync(COINACTIVITY_FILE, JSON.stringify(coinActivity, null, 2)); } catch(e){}
  if(db) db.collection("appData").updateOne({ _id: "coinActivity" }, { $set: { data: coinActivity } }, { upsert: true }).catch(console.error);
}

let contactMessages = [];
if (fs.existsSync(MESSAGES_FILE)) {
  try { contactMessages = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8")); } catch (err) { contactMessages = []; }
}
function saveMessages() {
  try { fs.writeFileSync(MESSAGES_FILE, JSON.stringify(contactMessages, null, 2)); } catch(e){}
  if(db) db.collection("appData").updateOne({ _id: "contactMessages" }, { $set: { data: contactMessages } }, { upsert: true }).catch(console.error);
}

// Generate unique referral code from name + random suffix
function generateReferralCode(name) {
  const prefix = (name || "USER").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "ZM";
  const suffix = Math.random().toString(36).toUpperCase().slice(2, 6);
  return prefix + suffix;
}

// Ensure users have new fields
function normalizeUsers(targetUsers) {
  let changed = false;
  targetUsers.forEach(u => {
    if (u.coins === undefined) { u.coins = 50; changed = true; }
    if (!u.recentStrangers) { u.recentStrangers = []; changed = true; }
    if (!u.boostExpiry) { u.boostExpiry = 0; changed = true; }
    if (u.streak === undefined) { u.streak = 0; changed = true; }
    if (u.lastLoginDate === undefined) { u.lastLoginDate = ""; changed = true; }
    if (u.bonusClaimedToday === undefined) { u.bonusClaimedToday = false; changed = true; }
    // Referral fields - Ensure they stay the same
    if (!u.referralCode) {
      let code;
      // Use name if available, otherwise random
      do { code = generateReferralCode(u.name || "ZM"); } while (targetUsers.some(x => x.referralCode === code && x !== u));
      u.referralCode = code;
      changed = true;
    }
    if (u.referredBy === undefined) { u.referredBy = null; changed = true; }
    if (u.referralCount === undefined) { u.referralCount = 0; changed = true; }
    if (u.referralCoinsEarned === undefined) { u.referralCoinsEarned = 0; changed = true; }

    // Check expired secret identity
    if (u.hasSecretIdentity && u.secretIdentityExpiry && Date.now() > u.secretIdentityExpiry) {
      u.hasSecretIdentity = false;
      u.secretIdentityExpiry = null;
      changed = true;
    }
  });
  if (changed) saveUsers();
}

// PURGE COIN TRANSACTIONS ON START (As requested)
transactions = transactions.filter(t => t.type !== "coins");
saveTransactions();

// --- AURA GUARDIAN: AI FRAUD DETECTION ENGINE ---
const userActivityLog = new Map(); // email -> [{t: timestamp, act: type}]

function zonemeetGuardianDetect() {
  const now = Date.now();
  const oneMinAgo = now - 60000;
  const fiveMinAgo = now - 300000;

  users.forEach(u => {
    if (bannedEmails.includes(u.email)) return;

    const logs = userActivityLog.get(u.email) || [];
    const recentActs = logs.filter(l => l.t > oneMinAgo);

    // 1. BOT DETECTION (High velocity spending)
    if (recentActs.filter(l => l.act === "spend").length > 8) {
      console.log(`[GUARDIAN] BOT detected: ${u.email}. Banning...`);
      banUser(u.email, "AI Detection: Bot-like transaction velocity");
      return;
    }

    // 2. COIN FARMING DETECTION (Balance jumping without payments)
    // If coins > 1000 and no coin transaction in last 5 mins (heuristic)
    const userCoinTrans = transactions.filter(t => t.userEmail === u.email && t.timestamp > fiveMinAgo && (t.type === "coins" || t.bundledCoins));
    if (u.coins > 2000 && userCoinTrans.length === 0 && !u.isPermanentPremium) {
      // Check if they just joined (welcome coins are 50)
      if (u.coins > 500) {
        console.log(`[GUARDIAN] FARMING detected: ${u.email}. Banning...`);
        banUser(u.email, "AI Detection: Unverified coin accumulation");
        return;
      }
    }

    // 3. REFUND/CHARGEBACK ABUSE
    // Pattern: Multiple failed or high-velocity payment attempts followed by success
    const paymentAttempts = recentActs.filter(l => l.act === "payment_attempt");
    if (paymentAttempts.length > 5) {
      console.log(`[GUARDIAN] REFUND ABUSE/BRUTE FORCE detected: ${u.email}. Banning...`);
      banUser(u.email, "AI Detection: Suspicious payment activity");
      return;
    }
  });
}

function banUser(email, reason) {
  if (!bannedEmails.includes(email)) {
    bannedEmails.push(email);
    saveBanned();
    console.log(`[BAN] ${email} permanently removed. Reason: ${reason}`);

    // Disconnect if online
    const user = users.find(u => u.email === email);
    if (user) {
      const socketId = onlineUsers.get(user.id);
      if (socketId) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit("banned-alert", `Your account has been banned: ${reason}`);
          socket.disconnect();
        }
      }
    }
  }
}

// Run Guardian every 2 seconds
setInterval(zonemeetGuardianDetect, 2000);

let bannedIps = [];
if (fs.existsSync(BANNED_IPS_FILE)) {
  try { bannedIps = JSON.parse(fs.readFileSync(BANNED_IPS_FILE, "utf-8")); } catch (err) { bannedIps = []; }
}

function saveBanned() {
  try { fs.writeFileSync(BANNED_FILE, JSON.stringify(bannedEmails, null, 2)); } catch(e){}
  if(db) db.collection("appData").updateOne({ _id: "bannedEmails" }, { $set: { data: bannedEmails } }, { upsert: true }).catch(console.error);
}

function saveBannedIps() {
  try { fs.writeFileSync(BANNED_IPS_FILE, JSON.stringify(bannedIps, null, 2)); } catch(e){}
  if(db) db.collection("appData").updateOne({ _id: "bannedIps" }, { $set: { data: bannedIps } }, { upsert: true }).catch(console.error);
}

// Ensure at least the test user exists
if (users.length === 0) {
  const MOCK_PASSWORD_HASH = bcrypt.hashSync("password", 10);
  users = [
    {
      id: 1,
      email: "test@test.com",
      password: MOCK_PASSWORD_HASH,
      name: "ZoneMeet Explorer",
      premium: false,
    },
  ];
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function saveUsers() {
  try { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); } catch(e){}
  if(db) {
    db.collection("appData").updateOne({ _id: "users" }, { $set: { data: users } }, { upsert: true })
      .then(() => console.log("[DB] Users saved successfully to MongoDB"))
      .catch(err => console.error("[DB] Error saving users:", err));
  }
}

// Helper for auth
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = users.find(u => u.id === decoded.id);
    if (!req.user) return res.status(401).json({ message: "User not found" });
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

app.post("/api/auth/session-login", (req, res) => {
  const { email, name, referralCode } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const clientIp = req.ip || req.connection.remoteAddress;
  let user = users.find(u => u.email === email);
  const isNewUser = !user;

  if (!user) {
    let code;
    do { code = generateReferralCode(name || email); } while (users.some(x => x.referralCode === code));
    user = {
      id: "u" + Date.now(),
      email,
      name: name || email.split("@")[0],
      password: "google_user_" + Math.random(),
      premium: email === "ds9376314@gmail.com",
      planName: email === "ds9376314@gmail.com" ? "VIP Elite" : null,
      coins: 50,
      recentStrangers: [],
      boostExpiry: 0,
      gender: "All",
      country: "All",
      friends: [],
      friendRequests: [],
      referralCode: code,
      referredBy: null,
      referralCount: 0,
      referralCoinsEarned: 0,
      signupIp: clientIp
    };
    users.push(user);

    // Process referral reward for referrer
    if (isNewUser && referralCode && referralCode !== user.referralCode) {
      const referrer = users.find(u => u.referralCode === referralCode.toUpperCase());
      if (referrer && referrer.email !== email) {
        // Security: Check referrer hasn't already been rewarded for this IP
        const alreadyRewarded = users.some(u => u.referredBy === referralCode && u.signupIp === clientIp);
        if (!alreadyRewarded) {
          user.referredBy = referralCode;
          referrer.coins = (referrer.coins || 0) + 100;
          referrer.referralCount = (referrer.referralCount || 0) + 1;
          referrer.referralCoinsEarned = (referrer.referralCoinsEarned || 0) + 100;
          coinActivity.push({ email: referrer.email, action: "Referral Reward", amount: 100, timestamp: Date.now() });
          saveCoinActivity();
          console.log(`[REFERRAL] ${referrer.email} earned 100 coins for referring ${email}`);
        }
      }
    }

    saveUsers();
  } else {
    // Existing user: check for referral if not already referred
    if (referralCode && !user.referredBy && referralCode !== user.referralCode) {
       const referrer = users.find(u => u.referralCode === referralCode.toUpperCase());
       if (referrer && referrer.email !== email) {
          user.referredBy = referralCode.toUpperCase();
          saveUsers();
       }
    }
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
  user.coinActivity = coinActivity.filter(a => a.email === email).slice(-10);
  res.json({ token, user });
});

app.post("/api/auth/login", (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or phone
  const clientIp = req.ip || req.connection.remoteAddress;

  if (bannedIps.includes(clientIp)) {
    return res.status(403).json({ message: "Your IP is banned from accessing this service." });
  }

  if (bannedEmails.includes(identifier)) {
    return res.status(403).json({ message: "Your account has been permanently banned for violating safety terms." });
  }

  console.log("Login attempt:", identifier);
  let user = users.find((u) => u.email === identifier || u.phone === identifier);

  if (user && user.email === "ds9376314@gmail.com") {
    user.premium = true;
    user.isPermanentPremium = true;
    user.planName = "VIP Elite";
  }

  if (!user) {
    console.log("User not found:", identifier);
    return res.status(400).json({ message: "User not found" });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    console.log("Invalid password for:", identifier);
    return res.status(400).json({ message: "Invalid credentials" });
  }

  // Check for subscription expiry
  if (user.premium && !user.isPermanentPremium && user.planExpiry && Date.now() > user.planExpiry) {
    user.premium = false;
    user.planName = null;
    user.planExpiry = null;
    saveUsers();
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
  user.coinActivity = coinActivity.filter(a => a.email === user.email).slice(-10);
  if (!user.unlockedFilters) user.unlockedFilters = ["None", "Smooth"];
  console.log("Login successful:", identifier);
  res.json({ token, user: { ...user, id: user.id, email: user.email, phone: user.phone, coinActivity: user.coinActivity, unlockedFilters: user.unlockedFilters } });
});

// Update Profile endpoint
app.post("/api/auth/update-profile", (req, res) => {
  const { email, gender, country, state, age, name } = req.body;
  console.log("Updating profile for:", email);

  let user = users.find((u) => u.email === email);
  if (!user) {
    user = {
      id: "u" + Date.now(),
      email,
      name: name || email.split("@")[0],
      password: "google_user_" + Math.random(),
      premium: false,
      gender,
      country,
      state,
      age,
      onboardingCompleted: true
    };
    users.push(user);
  } else {
    if (gender) user.gender = gender;
    if (country) user.country = country;
    if (state) user.state = state;
    if (age) user.age = age;
    if (name) user.name = name;
    user.onboardingCompleted = true;
  }

  saveUsers();
  res.json({ success: true, user: { ...user, id: user.id } });
});

// Send OTP endpoint (Twilio Verify - Global 180+ countries)
app.post("/api/auth/send-otp", async (req, res) => {
  let { phone } = req.body;
  if (!phone) return res.status(400).json({ message: "Phone number is required" });
  phone = phone.replace(/\s/g, ""); // Remove spaces for consistency

  const existingUser = users.find((u) => u.phone === phone);
  if (existingUser) {
    return res.status(400).json({ message: "Phone number already registered" });
  }

  // Auto-format: Add '+' if missing
  if (!phone.startsWith("+")) {
    phone = "+" + phone;
  }

  // === PRODUCTION MODE (Twilio Verify) ===
  try {
    await twilioClient.verify.v2
      .services(TWILIO_VERIFY_SID)
      .verifications.create({ to: phone, channel: "sms" });

    console.log(`[Twilio] OTP sent to ${phone}`);
    res.json({ success: true, message: "OTP sent successfully via SMS" });
  } catch (err) {
    console.error("[Twilio Error]", err);
    res.status(500).json({
      message: `Twilio Error: ${err.message}. Please check if your Twilio keys are valid and if the number is correct.`
    });
  }
});

// Register endpoint
app.post("/api/auth/register", async (req, res) => {
  let { phone, password, name, gender, country, state, age, otp, referralCode } = req.body;
  if (phone) phone = phone.replace(/\s/g, ""); // Normalize phone
  const clientIp = req.ip || req.connection.remoteAddress;

  if (bannedIps.includes(clientIp)) {
    return res.status(403).json({ message: "Your IP is banned from accessing this service." });
  }

  if (!phone || !password || !name || !gender || !country || !state || !age || !otp) {
    return res.status(400).json({ message: "All fields and OTP are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const existingUser = users.find((u) => u.phone === phone);
  if (existingUser) {
    return res.status(400).json({ message: "Phone number already registered" });
  }

  // === Verify OTP ===
  if (!twilioClient) {
    const stored = otpStore[phone];
    if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    delete otpStore[phone];
  } else {
    try {
      const check = await twilioClient.verify.v2
        .services(TWILIO_VERIFY_SID)
        .verificationChecks.create({ to: phone, code: otp });
      if (check.status !== "approved") {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
    } catch (err) {
      console.error("[Twilio] OTP check failed:", err.message);
      return res.status(400).json({ message: "OTP verification failed" });
    }
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  let code;
  do { code = generateReferralCode(name); } while (users.some(x => x.referralCode === code));

  const newUser = {
    id: "u" + Date.now(),
    phone,
    email: "",
    password: hashedPassword,
    name,
    gender,
    country,
    state,
    age,
    coins: 50,
    premium: false,
    friends: [],
    friendRequests: [],
    streak: 0,
    lastLoginDate: "",
    bonusClaimedToday: false,
    recentStrangers: [],
    boostExpiry: 0,
    unlockedFilters: ["None", "Smooth"],
    referralCode: code,
    referredBy: null,
    referralCount: 0,
    referralCoinsEarned: 0,
    signupIp: clientIp
  };
  users.push(newUser);

  // Process referral
  if (referralCode) {
    const referrer = users.find(u => u.referralCode === referralCode.toUpperCase());
    if (referrer && referrer.phone !== phone) {
      const alreadyRewarded = users.some(u => u.referredBy === referralCode && u.signupIp === clientIp);
      if (!alreadyRewarded) {
        newUser.referredBy = referralCode;
        referrer.coins = (referrer.coins || 0) + 100;
        referrer.referralCount = (referrer.referralCount || 0) + 1;
        referrer.referralCoinsEarned = (referrer.referralCoinsEarned || 0) + 100;
        coinActivity.push({ email: referrer.email || referrer.phone, action: "Referral Reward", amount: 100, timestamp: Date.now() });
        saveCoinActivity();
        console.log(`[REFERRAL] ${referrer.phone} earned 100 coins for referring ${phone}`);
      }
    }
  }

  saveUsers();
  const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: "7d" });
  console.log("New user registered:", phone);
  res.status(201).json({ token, user: { id: newUser.id, phone: newUser.phone, name: newUser.name, premium: newUser.premium, gender: newUser.gender, country: newUser.country, state: newUser.state, age: newUser.age, planName: null, unlockedFilters: newUser.unlockedFilters, referralCode: newUser.referralCode } });
});


// Firebase Registration/Login Endpoint
app.post("/api/auth/firebase-register", async (req, res) => {
  const { idToken, name, phone, password, gender, country, state, age } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  if (bannedIps.includes(clientIp)) {
    return res.status(403).json({ message: "Your IP is banned." });
  }

  try {
    // 1. Verify the ID Token from Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebasePhone = decodedToken.phone_number;

    if (!firebasePhone) {
      return res.status(400).json({ message: "Invalid Firebase token (no phone number)" });
    }

    // 2. Check if user exists
    let user = users.find(u => u.phone === firebasePhone || (u.phone === phone.replace(/\s/g, "")));

    if (!user) {
      // Create new user if they don't exist
      const hashedPassword = bcrypt.hashSync(password || "firebase_user_" + Math.random(), 10);
      user = {
        id: "u" + Date.now(),
        phone: firebasePhone,
        email: "",
        password: hashedPassword,
        name: name || "User_" + firebasePhone.slice(-4),
        gender: gender || "Other",
        country: country || "Unknown",
        state: state || "Unknown",
        age: age || "Unknown",
        coins: 50,
        premium: false,
        friends: [],
        friendRequests: [],
        streak: 0,
        lastLoginDate: "",
        bonusClaimedToday: false,
        recentStrangers: [],
        boostExpiry: 0,
        unlockedFilters: ["None", "Smooth"]
      };
      users.push(user);
      saveUsers();
      console.log("New Firebase user registered:", firebasePhone);
    } else {
      console.log("Existing user logged in via Firebase:", firebasePhone);
    }

    const jwtToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token: jwtToken, user });

  } catch (error) {
    console.error("Firebase Verification Error:", error);
    res.status(401).json({ message: "Firebase authentication failed: " + error.message });
  }
});

// Update Profile endpoint
app.post("/api/auth/update-profile", (req, res) => {
  const { email, gender, country, state, age } = req.body;
  const user = users.find((u) => u.email === email);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.gender = gender || user.gender;
  user.country = country || user.country;
  user.state = state || user.state;
  user.age = age || user.age;

  saveUsers();
  res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, premium: user.premium, gender: user.gender, country: user.country, state: user.state, age: user.age, unlockedFilters: user.unlockedFilters } });
});

// Token verification endpoint
app.get("/api/auth/verify", (req, res) => {
  console.log("Verify request received");
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ valid: false, message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Verifying token for ID:", decoded.id);
    const user = users.find((u) => u.id === decoded.id);

    if (user && user.email === "ds9376314@gmail.com") {
      user.premium = true;
      user.isPermanentPremium = true;
      user.planName = "VIP Elite";
    }
    if (!user) {
      console.log("Verify failed: User not found for ID", decoded.id);
      return res.status(401).json({ valid: false, message: "User not found" });
    }
    // Check for subscription expiry
    if (user.premium && !user.isPermanentPremium && user.planExpiry && Date.now() > user.planExpiry) {
      user.premium = false;
      user.planName = null;
      user.planExpiry = null;
      saveUsers();
    }

    // Check for Secret Identity Mode expiry
    if (user.hasSecretIdentity && user.secretIdentityExpiry && Date.now() > user.secretIdentityExpiry) {
      user.hasSecretIdentity = false;
      user.secretIdentityExpiry = null;
      saveUsers();
    }

    console.log("Verify success for user:", user.email);
    user.coinActivity = coinActivity.filter(a => a.email === user.email).slice(-10);
    if (!user.unlockedFilters) user.unlockedFilters = ["None", "Smooth"];
    res.json({ valid: true, user: { ...user, id: user.id, email: user.email, coinActivity: user.coinActivity, unlockedFilters: user.unlockedFilters } });
  } catch (err) {
    console.log("Verify failed: Token error", err.message);
    res.status(401).json({ valid: false, message: "Token expired or invalid" });
  }
});

// ===== REFERRAL SYSTEM ENDPOINTS =====
app.get("/api/referral/stats", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      referralCode: user.referralCode,
      referralCount: user.referralCount || 0,
      referralCoinsEarned: user.referralCoinsEarned || 0,
      referredBy: user.referredBy || null
    });
  } catch (e) {
    res.status(401).json({ message: "Invalid token" });
  }
});

app.post("/api/referral/redeem", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
  const token = authHeader.split(" ")[1];
  const { referralCode } = req.body;

  if (!referralCode) return res.status(400).json({ message: "Referral code is required" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.referredBy) {
      return res.status(400).json({ message: "You have already used a referral code." });
    }

    const cleanCode = referralCode.trim().toUpperCase();
    if (cleanCode === user.referralCode) {
      return res.status(400).json({ message: "You cannot use your own referral code." });
    }

    const referrer = users.find(u => u.referralCode === cleanCode);
    if (!referrer) {
      return res.status(404).json({ message: "Invalid referral code. Please check and try again." });
    }

    // Award coins to referrer
    user.referredBy = cleanCode;
    referrer.coins = (referrer.coins || 0) + 100;
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    referrer.referralCoinsEarned = (referrer.referralCoinsEarned || 0) + 100;

    coinActivity.push({
      email: referrer.email || referrer.phone,
      action: "Referral Reward (Manual)",
      amount: 100,
      timestamp: Date.now()
    });

    saveCoinActivity();
    saveUsers();

    res.json({
      success: true,
      message: "Referral code redeemed successfully!",
      user: {
        ...user,
        coins: user.coins,
        coinActivity: coinActivity.filter(a => a.email === user.email).slice(-10)
      }
    });
  } catch (e) {
    res.status(401).json({ message: "Invalid token" });
  }
});

app.post("/api/user/transfer-coins", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
  const token = authHeader.split(" ")[1];
  const { recipientId, amount } = req.body;

  if (!recipientId || !amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid recipient or amount." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const sender = users.find(u => u.id === decoded.id);
    if (!sender) return res.status(404).json({ message: "Sender not found" });

    if (sender.coins < amount && sender.email !== "ds9376314@gmail.com") {
      return res.status(400).json({ message: "Insufficient coins." });
    }

    const recipient = users.find(u => u.id === recipientId || u.email === recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found. Please check the ID." });
    }

    if (sender.id === recipient.id) {
      return res.status(400).json({ message: "You cannot transfer coins to yourself." });
    }

    // Deduct from sender (if not admin)
    if (sender.email !== "ds9376314@gmail.com") {
      sender.coins -= Number(amount);
    }

    // Add to recipient
    recipient.coins = (recipient.coins || 0) + Number(amount);

    // Record activity for both
    const transferId = "trf" + Date.now();
    coinActivity.push({
      id: transferId + "s",
      email: sender.email || sender.phone,
      type: "spend",
      amount: amount,
      feature: `Transfer to ${recipient.name}`,
      timestamp: new Date().toISOString()
    });
    coinActivity.push({
      id: transferId + "r",
      email: recipient.email || recipient.phone,
      type: "earn",
      amount: amount,
      feature: `Received from ${sender.name}`,
      timestamp: new Date().toISOString()
    });

    saveCoinActivity();
    saveUsers();

    res.json({
      success: true,
      message: `Successfully transferred ${amount} coins to ${recipient.name}!`,
      newBalance: sender.coins,
      coinActivity: coinActivity.filter(a => a.email === sender.email).slice(-10)
    });
  } catch (e) {
    res.status(401).json({ message: "Invalid token" });
  }
});

// DAILY LOGIN & STREAK SYSTEM
const DAILY_REWARDS = [5, 10, 15, 20, 25, 50, 100]; // Coins per day 1-7

app.post("/api/user/daily-check", (req, res) => {
  const { email, phone } = req.body;
  const user = users.find(u => (email && u.email === email) || (phone && u.phone === phone));
  if (!user) return res.json({ success: false, message: "User not found" });

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  // Calculate yesterday BEFORE mutating `now`
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  // Already checked today — just return current state
  if (user.lastLoginDate === today) {
    return res.json({
      success: true,
      streak: user.streak,
      status: "already_checked",
      coins: user.coins,
      canCollect: !user.bonusClaimedToday,
      todayReward: DAILY_REWARDS[Math.min((user.streak || 1) - 1, 6)],
      coinActivity: coinActivity.filter(a => a.email === user.email).slice(-10)
    });
  }

  // Consecutive login — increase streak
  if (user.lastLoginDate === yesterday) {
    user.streak = (user.streak || 0) + 1;
    user.lastLoginDate = today;
    user.bonusClaimedToday = false; // Fresh day — reward ready to collect
    saveUsers();
    const todayReward = DAILY_REWARDS[Math.min(user.streak - 1, 6)];
    return res.json({
      success: true,
      streak: user.streak,
      status: user.streak >= 7 ? "streak_complete" : "streak_increased",
      coins: user.coins,
      canCollect: true,
      todayReward,
      coinActivity: coinActivity.filter(a => a.email === user.email).slice(-10)
    });
  }

  // Streak broken (missed a day or more)
  const oldStreak = user.streak;
  user.streak = 1;
  user.lastLoginDate = today;
  user.bonusClaimedToday = false;
  saveUsers();

  if (oldStreak > 1) {
    return res.json({
      success: true,
      streak: 1,
      oldStreak,
      status: "streak_broken",
      coins: user.coins,
      canCollect: true,
      todayReward: DAILY_REWARDS[0],
      coinActivity: coinActivity.filter(a => a.email === user.email).slice(-10)
    });
  }

  return res.json({
    success: true,
    streak: 1,
    status: "new_streak",
    coins: user.coins,
    canCollect: true,
    todayReward: DAILY_REWARDS[0],
    coinActivity: coinActivity.filter(a => a.email === user.email).slice(-10)
  });
});

// COLLECT DAILY REWARD — called when user clicks "Collect" button
app.post("/api/user/collect-daily-reward", (req, res) => {
  const { email, phone } = req.body;
  const user = users.find(u => (email && u.email === email) || (phone && u.phone === phone));
  if (!user) return res.json({ success: false, message: "User not found" });

  if (user.bonusClaimedToday) {
    return res.json({ success: false, message: "Already collected today!" });
  }

  const dayIndex = Math.min((user.streak || 1) - 1, 6);
  const reward = DAILY_REWARDS[dayIndex];

  // Day 7 gives 100 coins and resets streak
  if (user.streak >= 7) {
    user.coins += 100;
    user.bonusClaimedToday = true;
    user.streak = 0; // Reset for next cycle
  } else {
    user.coins += reward;
    user.bonusClaimedToday = true;
  }

  const activity = {
    id: "act" + Date.now(),
    email: user.email,
    type: "earn",
    amount: reward,
    feature: `Day ${dayIndex + 1} Login Bonus`,
    timestamp: new Date().toISOString()
  };
  coinActivity.push(activity);
  saveCoinActivity();
  saveUsers();

  res.json({
    success: true,
    coins: user.coins,
    streak: user.streak,
    rewardGiven: reward,
    message: `+${reward} Coins added!`,
    coinActivity: coinActivity.filter(a => a.email === user.email).slice(-10)
  });
});

app.post("/api/user/collect-custom-reward", (req, res) => {
  const { email, coins, day } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.json({ success: false, message: "User not found" });

  user.coins += coins;

  const activity = {
    id: "act" + Date.now(),
    email: user.email,
    type: "earn",
    amount: coins,
    feature: `Manual Collection (Day ${day})`,
    timestamp: new Date().toISOString()
  };
  coinActivity.push(activity);
  saveCoinActivity();
  saveUsers();

  res.json({ success: true, coins: user.coins, message: `+${coins} Coins added!` });
});


app.post("/api/user/save-streak", (req, res) => {
  const { email, oldStreak } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.json({ success: false, message: "User not found" });

  if (user.coins < 50) {
    return res.json({ success: false, message: "Not enough coins to save streak!" });
  }

  user.coins -= 50;
  user.streak = oldStreak;

  const activity = {
    id: "act" + Date.now(),
    email: user.email,
    type: "spend",
    amount: 50,
    feature: "Streak Savior",
    timestamp: new Date().toISOString()
  };
  coinActivity.push(activity);
  saveCoinActivity();
  saveUsers();

  res.json({ success: true, streak: user.streak, coins: user.coins });
});

// MYSTERY BOX SYSTEM
const MYSTERY_BOXES = {
  bronze: { name: "Bronze Box", price: 50, color: "#cd7f32" },
  silver: { name: "Silver Box", price: 150, color: "#c0c0c0" },
  gold: { name: "Gold Box", price: 500, color: "#ffd700" }
};

app.post("/api/user/open-box", (req, res) => {
  const { email, boxType } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const box = MYSTERY_BOXES[boxType];
  if (!box) return res.status(400).json({ success: false, message: "Invalid box type" });

  const isAdmin = user.email === "ds9376314@gmail.com";

  if (!isAdmin && user.coins < box.price) {
    return res.status(400).json({ success: false, message: `Insufficient coins! Need ${box.price} coins.` });
  }

  // Deduct coins (Skip for Admin)
  if (!isAdmin) {
    user.coins -= box.price;
    // Track monthly spend for leaderboard
    user.monthlySpend = (user.monthlySpend || 0) + box.price;
    checkLeaderboardReset();
  }

  let prize = { name: "Consolation", type: "coins", value: 5 };
  const rand = Math.random() * 100;

  if (boxType === "bronze") {
    // BRONZE BOX: High Empty/Coins, Low Boost, Very Low VIP/Stickers
    if (rand < 45) prize = { name: "Better luck next time!", type: "none", value: 0 };
    else if (rand < 85) {
      const val = Math.floor(Math.random() * (20 - 10 + 1)) + 10; // 10-20
      prize = { name: `${val} Coins`, type: "coins", value: val };
    }
    else if (rand < 97.4) { // Increased from 97 to 97.4
      const val = Math.floor(Math.random() * (7 - 5 + 1)) + 5; // 5-7
      prize = { name: `${val} Mins Boost`, type: "boost", value: val };
    }
    else if (rand < 98.5) prize = { name: "Heart Sticker", type: "sticker", value: "heart" };
    else if (rand < 99.9) prize = { name: "Rose Sticker", type: "sticker", value: "rose" }; // Increased range for Rose
    else prize = { name: "1 Hour VIP", type: "vip", value: 1 }; // Now 0.1% (99.9 to 100)
  } else if (boxType === "silver") {
    // SILVER BOX: Better Coins/Boost, Moderate Stickers
    if (rand < 35) prize = { name: "Better luck next time!", type: "none", value: 0 };
    else if (rand < 75) {
      const val = Math.floor(Math.random() * (80 - 40 + 1)) + 40; // 40-80
      prize = { name: `${val} Coins`, type: "coins", value: val };
    }
    else if (rand < 93.3) { // Increased slightly
      const val = Math.floor(Math.random() * (20 - 15 + 1)) + 15; // 15-20
      prize = { name: `${val} Mins Boost`, type: "boost", value: val };
    }
    else if (rand < 96) prize = { name: "Heart Sticker", type: "sticker", value: "heart" };
    else if (rand < 98.5) prize = { name: "Rose Sticker", type: "sticker", value: "rose" };
    else if (rand < 99.8) prize = { name: "Diamond Sticker", type: "sticker", value: "diamond" }; // Increased range
    else prize = { name: "6 Hours VIP", type: "vip", value: 6 }; // Now 0.2% (99.8 to 100)
  } else if (boxType === "gold") {
    // GOLD BOX: No Empty, No Coins, High Price Stickers, High VIP
    if (rand < 83) { // Increased boost chance from 75 to 83 (+8%)
      const val = Math.floor(Math.random() * (120 - 60 + 1)) + 60; // 60-120
      prize = { name: `${Math.floor(val / 60)} Hour ${val % 60} Mins Boost`, type: "boost", value: val };
    }
    else if (rand < 93) prize = { name: "Crown Sticker", type: "sticker", value: "crown" }; // 10%
    else if (rand < 98) prize = { name: "Supercar Sticker", type: "sticker", value: "car" }; // 5%
    else prize = { name: "2 Days VIP Elite", type: "vip", value: 48 }; // Now 2% (98 to 100)
  }

  // Apply Prize
  if (prize.type === "coins") {
    user.coins += prize.value;
  } else if (prize.type === "boost") {
    const currentExpiry = user.boostExpiry > Date.now() ? user.boostExpiry : Date.now();
    user.boostExpiry = currentExpiry + (prize.value * 60 * 1000);
  } else if (prize.type === "vip") {
    user.premium = true;
    user.planName = "VIP Elite";
    const currentExpiry = user.planExpiry > Date.now() ? user.planExpiry : Date.now();
    user.planExpiry = currentExpiry + (prize.value * 60 * 60 * 1000);
  } else if (prize.type === "sticker") {
    if (!user.stickers) user.stickers = [];
    user.stickers.push(prize.value);
  }

  // Log transaction
  const activity = {
    id: "act" + Date.now(),
    email: user.email,
    type: prize.type === "coins" ? "earn" : "reward",
    amount: prize.type === "coins" ? prize.value : 0,
    feature: `Box Prize: ${prize.name}`,
    timestamp: new Date().toISOString()
  };
  coinActivity.push(activity);
  saveCoinActivity();
  saveUsers();

  res.json({
    success: true,
    message: `${box.name} opened!`,
    prize: prize.name,
    coins: user.coins,
    user: { ...user, id: user.id }
  });
});

app.post("/api/user/claim-7day-bonus", (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.json({ success: false, message: "User not found" });

  if (user.streak < 7) {
    return res.json({ success: false, message: "Streak must be 7 days!" });
  }

  if (user.bonusClaimedToday) {
    return res.json({ success: false, message: "Bonus already claimed for this streak cycle!" });
  }

  user.coins += 100;
  user.bonusClaimedToday = true;
  user.streak = 0; // Reset streak after claiming or keep it? User said "after 7 days 100 coins". Usually it resets.

  const activity = {
    id: "act" + Date.now(),
    email: user.email,
    type: "earn",
    amount: 100,
    feature: "7-Day Login Bonus",
    timestamp: new Date().toISOString()
  };
  coinActivity.push(activity);
  saveCoinActivity();
  saveUsers();

  res.json({ success: true, coins: user.coins, streak: 0, message: "100 Coins added!" });
});

// SEND GIFT / STICKER ENDPOINT
app.post("/api/user/send-gift", authenticateToken, (req, res) => {
  const { recipientId, stickerId, amount, stickerIcon } = req.body;
  const senderId = req.user.id;

  const sender = users.find(u => u.id === senderId);
  const recipient = users.find(u => u.id === recipientId);

  if (!sender || !recipient) return res.status(404).json({ success: false, message: "User not found" });

  let usedFreeSticker = false;
  if (sender.stickers && sender.stickers.includes(stickerId)) {
    // Free send! Remove one instance
    const idx = sender.stickers.indexOf(stickerId);
    sender.stickers.splice(idx, 1);
    usedFreeSticker = true;
  } else {
    // Paid send
    if (sender.coins < amount && sender.email !== "ds9376314@gmail.com") {
      return res.status(400).json({ success: false, message: "Insufficient coins" });
    }
    if (sender.email !== "ds9376314@gmail.com") {
      sender.coins -= amount;
      sender.monthlySpend = (sender.monthlySpend || 0) + amount;
      checkLeaderboardReset();
    }
  }

  // Add coins to recipient (Optional but good for economy)
  recipient.coins = (recipient.coins || 0) + amount;

  // Track activity
  const activity = {
    id: "act" + Date.now(),
    email: sender.email,
    type: "spend",
    amount: usedFreeSticker ? 0 : amount,
    feature: `Sent ${stickerIcon} to ${recipient.name} ${usedFreeSticker ? '(Free)' : ''}`,
    timestamp: new Date().toISOString()
  };
  coinActivity.push(activity);
  
  const recvActivity = {
    id: "act" + Date.now() + 1,
    email: recipient.email,
    type: "earn",
    amount: amount,
    feature: `Received ${stickerIcon} from ${sender.name}`,
    timestamp: new Date().toISOString()
  };
  coinActivity.push(recvActivity);
  
  saveCoinActivity();
  saveUsers();

  // Send socket event to receiver
  const targetSocketId = onlineUsers.get(recipient.id);
  if (targetSocketId) {
    io.to(targetSocketId).emit("receive-sticker", { 
      stickerIcon, 
      senderName: sender.name, 
      amount 
    });
  }

  res.json({ 
    success: true, 
    coins: sender.coins,
    stickers: sender.stickers,
    coinActivity: coinActivity.filter(a => a.email === sender.email).slice(-10) 
  });
});

app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!email || !message) {
    return res.status(400).json({ success: false, message: "Email and message are required" });
  }

  const newMessage = {
    id: "msg_" + Date.now(),
    name: name || "Anonymous",
    email,
    subject: subject || "General Inquiry",
    message,
    timestamp: new Date().toISOString(),
    status: "Unread"
  };

  contactMessages.push(newMessage);
  saveMessages();

  // --- REAL EMAIL NOTIFICATION ---
  // ⚠️ TODO: Setup your Gmail App Password to enable real email sending
  // 1. Enable 2-Factor Authentication on your Gmail.
  // 2. Search for "App Passwords" in Google Account settings.
  // 3. Create a new app password for "Mail".
  const GMAIL_USER = "zonemeet84@gmail.com";
  const GMAIL_PASS = "lebc mnmw kvjg penk"; // Paste your 16-character app password here

  if (GMAIL_PASS && GMAIL_PASS !== "kawal@1234") {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS
      }
    });

    const mailOptions = {
      from: `ZoneMeet Support <${GMAIL_USER}>`,
      to: GMAIL_USER, // Sending to yourself (admin)
      replyTo: email, // So you can reply directly to the user
      subject: `New Support Message: ${subject || "General Inquiry"}`,
      text: `You have received a new support message from ZoneMeet platform.\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  } else {
    console.log("[DEV MODE] Real email skipped. Set GMAIL_PASS in server.js to enable.");
  }

  // Keep the 3s delay as requested for UX
  setTimeout(() => {
    res.json({ success: true, message: "Message sent successfully" });
  }, 3000);
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Helper for auth was moved up

// Friends API
app.get("/api/users/search", authenticateToken, (req, res) => {
  const { email } = req.query;
  const targetUser = users.find(u => u.email === email);
  if (!targetUser) return res.status(404).json({ message: "User not found" });
  res.json({ id: targetUser.id, name: targetUser.name, email: targetUser.email });
});

app.post("/api/friends/request", authenticateToken, (req, res) => {
  const { targetId, type } = req.body; // type can be 'reconnect'
  const targetUser = users.find(u => u.id === targetId);
  if (!targetUser) return res.status(404).json({ message: "User not found" });

  if (!targetUser.friendRequests) targetUser.friendRequests = [];

  // Check if already requested (as ID or Object)
  const alreadyRequested = targetUser.friendRequests.some(r => (typeof r === 'string' ? r : r.id) === req.user.id);
  if (alreadyRequested || (targetUser.friends && targetUser.friends.includes(req.user.id))) {
    return res.status(400).json({ message: "Request already sent or already friends" });
  }

  const requestObj = type === 'reconnect' ? { id: req.user.id, type: 'reconnect' } : req.user.id;
  targetUser.friendRequests.push(requestObj);
  saveUsers();
  res.json({ message: "Request sent" });
});

app.post("/api/friends/accept", authenticateToken, (req, res) => {
  const { requesterId } = req.body;
  const requester = users.find(u => u.id === requesterId);
  if (!requester) return res.status(404).json({ message: "Requester not found" });

  // Reconnect logic: Check if requester sent a reconnect request
  const request = (req.user.friendRequests || []).find(r => (typeof r === 'string' ? r : r.id) === requesterId);

  if (request && request.type === 'reconnect') {
    // Admin Immunity: Skip deduction for ds9376314@gmail.com
    if (requester.email !== "ds9376314@gmail.com") {
      requester.coins = Math.max(0, requester.coins - 40);
    }
  }

  if (!req.user.friends) req.user.friends = [];
  if (!requester.friends) requester.friends = [];

  req.user.friends.push(requester.id);
  requester.friends.push(req.user.id);

  // Remove from requests
  req.user.friendRequests = req.user.friendRequests.filter(r => (typeof r === 'string' ? r : r.id) !== requesterId);
  saveUsers();

  res.json({ message: "Friend request accepted" });
});

app.post("/api/report", authenticateToken, (req, res) => {
  const { targetId, reason, details, evidence } = req.body;
  const targetUser = users.find(u => u.id === targetId);
  if (!targetUser) return res.status(404).json({ message: "User not found" });

  // Track reports
  if (!targetUser.reportCount) targetUser.reportCount = 0;
  targetUser.reportCount += 1;

  console.log(`[REPORT] User ${targetId} (${targetUser.email}) reported by ${req.user.id}. Total reports: ${targetUser.reportCount}`);
  console.log(`Reason: ${reason}`);
  console.log(`Details: ${details || "No additional details"}`);
  if (evidence) {
    console.log(`[EVIDENCE] Screenshot captured (Base64 length: ${evidence.length})`);
    // In a real app, you'd save this as a file: fs.writeFileSync(`reports/${targetId}_${Date.now()}.jpg`, evidence.split(',')[1], 'base64');
  }

  reports.push({
    id: Date.now(),
    reporterId: req.user.id,
    targetId: targetId,
    targetName: targetUser.name,
    targetEmail: targetUser.email,
    reason: reason,
    details: details,
    evidence: evidence,
    timestamp: new Date().toISOString()
  });
  saveReports();

  // Auto-ban if 3 reports reached
  if (targetUser.reportCount >= 3) {
    console.log(`User ${targetUser.email} has reached 3 reports. Banning permanently...`);
    if (!bannedEmails.includes(targetUser.email)) {
      bannedEmails.push(targetUser.email);
      saveBanned();
    }

    const targetSocketId = onlineUsers.get(targetId);
    if (targetSocketId) {
      const socket = io.sockets.sockets.get(targetSocketId);
      if (socket) {
        const ip = socket.handshake.address;
        if (!bannedIps.includes(ip)) {
          bannedIps.push(ip);
          saveBannedIps();
        }
        socket.emit("banned-alert", "Your account has been permanently banned due to multiple reports.");
        socket.disconnect();
      }
    }
  }

  saveUsers();
  res.json({ success: true, message: "User reported successfully" });
});

app.get("/api/friends/list", authenticateToken, (req, res) => {
  const friends = (req.user.friends || []).map(id => {
    const f = users.find(u => u.id === id);
    return f ? { id: f.id, name: f.name, email: f.email, country: f.country, online: onlineUsers.has(f.id) } : null;
  }).filter(Boolean);

  const requests = (req.user.friendRequests || []).map(id => {
    const f = users.find(u => u.id === id);
    return f ? { id: f.id, name: f.name, email: f.email, country: f.country } : null;
  }).filter(Boolean);

  res.json({ friends, requests });
});

let waitingUsers = [];

function matchUsers() {
  // Sort waiting users by boost status then by entry time
  waitingUsers = waitingUsers.filter(Boolean);
  waitingUsers.sort((a, b) => {
    const aUser = users.find(u => u.id === a?.userId);
    const bUser = users.find(u => u.id === b?.userId);
    const aBoost = aUser?.boostExpiry > Date.now();
    const bBoost = bUser?.boostExpiry > Date.now();
    if (aBoost && !bBoost) return -1;
    if (!aBoost && bBoost) return 1;
    return 0; // Maintain order otherwise
  });

  let i = 0;
  while (i < waitingUsers.length) {
    const user1 = waitingUsers[i];
    let matched = false;

    for (let j = i + 1; j < waitingUsers.length; j++) {
      const user2 = waitingUsers[j];

      // Matching logic with filters
      const matchesGender = (user1.filters?.gender === "all" || user2.gender === user1.filters?.gender || !user1.filters?.gender) &&
        (user2.filters?.gender === "all" || user1.gender === user2.filters?.gender || !user2.filters?.gender);

      const matchesCountry = (user1.filters?.country === "all" || user2.country === user1.filters?.country || !user1.filters?.country) &&
        (user2.filters?.country === "all" || user1.country === user2.filters?.country || !user2.filters?.country);

      const matchesState = (user1.filters?.state === "All States" || user2.state === user1.filters?.state || !user1.filters?.state) &&
        (user2.filters?.state === "All States" || user1.state === user2.filters?.state || !user2.filters?.state);

      const matchesAge = (user1.filters?.age === "All Ages" || user2.age === user1.filters?.age || !user1.filters?.age) &&
        (user2.filters?.age === "All Ages" || user1.age === user2.filters?.age || !user2.filters?.age);

      if (matchesGender && matchesCountry && matchesState && matchesAge) {
        // Remove them from waiting list
        waitingUsers.splice(j, 1);
        waitingUsers.splice(i, 1);

        user1.partner = user2;
        user2.partner = user1;

        // UPDATE STRANGER HISTORY
        const u1 = users.find(u => u.id === user1.userId);
        const u2 = users.find(u => u.id === user2.userId);
        if (u1 && u2) {
          u1.recentStrangers = [
            { id: u2.id, name: u2.name, email: u2.email, country: user2.country, timestamp: Date.now() },
            ...u1.recentStrangers.filter(s => s.id !== u2.id)
          ].slice(0, 10);

          u2.recentStrangers = [
            { id: u1.id, name: u1.name, email: u1.email, country: user1.country, timestamp: Date.now() },
            ...u2.recentStrangers.filter(s => s.id !== u1.id)
          ].slice(0, 10);
          saveUsers();
        }

        const u1Friends = u1?.friends || [];
        const u2Friends = u2?.friends || [];
        const areFriends = (u2 && u1Friends.includes(u2.id)) || (u1 && u2Friends.includes(u1.id));

        user1.emit("matched", {
          partnerId: user2.id,
          initiator: true,
          partnerInfo: {
            id: user2.userId,
            name: user2.name,
            country: user2.country,
            gender: user2.gender,
            premium: user2.premium,
            planName: user2.planName,
            isFriend: areFriends
          }
        });

        user2.emit("matched", {
          partnerId: user1.id,
          initiator: false,
          partnerInfo: {
            id: user1.userId,
            name: user1.name,
            country: user1.country,
            gender: user1.gender,
            premium: user1.premium,
            planName: user1.planName,
            isFriend: areFriends
          }
        });

        matched = true;
        break;
      }
    }

    if (!matched) {
      i++;
    }
  }
}

const queueUser = (socket) => {
  if (!socket) return;
  if (socket.queueTimeout) clearTimeout(socket.queueTimeout);

  const isPremium = socket.premium || (socket.planName && socket.planName !== "Free");
  // 5 seconds delay for free users, instant for premium
  const delay = isPremium ? 0 : 5000;

  if (delay === 0) {
    if (!waitingUsers.includes(socket)) {
      waitingUsers.push(socket);
    }
    matchUsers();
  } else {
    socket.queueTimeout = setTimeout(() => {
      if (socket.connected && !socket.partner) {
        if (!waitingUsers.includes(socket)) {
          waitingUsers.push(socket);
        }
        matchUsers();
      }
    }, delay);
  }
};

// Global Moderation State
const BAD_WORDS_LIST = [
  "abuse", "fake", "sex", "scam", "nude", "porn", "pussy", "dick", "xxx", "fuck", "bitch",
  "lund", "chod", "gand", "porn", "madarchod", "behenchod", "bhenchod", "chutiya", "loda", "lauda",
  "kamine", "haramkhor", "bsdk", "bhonsdi", "gaand", "randi", "saala", "saali", "harami"
];
const userStrikes = new Map(); // email -> strike count

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  // Initialize with default filters/info
  socket.filters = { gender: "all", country: "all" };

  socket.on("register-user", (userId) => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);

    // Broadcast online status to friends
    const user = users.find(u => u.id === userId);
    if (user && user.friends) {
      user.friends.forEach(fId => {
        const friendSocketId = onlineUsers.get(fId);
        if (friendSocketId) {
          io.to(friendSocketId).emit("friend-status", { friendId: userId, online: true });
        }
      });
    }
  });

  socket.on("set-profile", (profile) => {
    // Re-verify premium status from DB to prevent client-side manipulation
    const dbUser = users.find(u => u.email === profile.email);
    let isPremium = dbUser ? dbUser.premium : false;
    let pName = dbUser ? dbUser.planName : null;

    // Hardcoded admin check
    if (profile.email === "ds9376314@gmail.com") {
      isPremium = true;
      pName = "VIP Elite";
    }

    socket.user = { ...profile, premium: isPremium, planName: pName };
    socket.userId = dbUser ? dbUser.id : profile.id;
    socket.name = profile.name;
    socket.gender = profile.gender || (Math.random() > 0.5 ? "Male" : "Female");
    socket.country = profile.country || "India";
    socket.state = profile.state || "All States";
    socket.age = profile.age || "18-24";
    socket.premium = isPremium;
    socket.planName = pName;

    console.log(`User ${socket.id} profile set securely:`, profile.name, socket.premium ? "PREMIUM" : "FREE");

    if (socket.userId) {
      onlineUsers.set(socket.userId, socket.id);
    }

    if (profile.roomId) {
      return;
    }

    queueUser(socket);
  });

  socket.on("update-filters", (filters) => {
    socket.filters = filters;
    console.log(`User ${socket.id} updated filters:`, filters);
  });

  socket.on("send-message", ({ text, to }) => {
    if (socket.user) {
      const email = socket.user.email;
      const lowerText = text.toLowerCase();
      const hasBadWord = BAD_WORDS_LIST.some(word => lowerText.includes(word));

      /*
      // AI Chat Guard Temporarily Disabled
      if (hasBadWord) {
        let strikes = (userStrikes.get(email) || 0) + 1;
        userStrikes.set(email, strikes);

        if (strikes >= 2) {
          console.log(`[GUARDIAN] CHAT ABUSE detected: ${email}. Banning...`);
          banUser(email, "AI Detection: Repeated use of restricted words in chat");
          return;
        } else {
          socket.emit("warning-alert", `Warning: Your message contains restricted words. Strike ${strikes}/2. Continued abuse will lead to a permanent ban.`);
          return; 
        }
      }
      */
    }

    io.to(to).emit("receive-message", {
      text,
      senderId: socket.id,
    });
  });

  socket.on("friend-request", ({ to }) => {
    // 'to' is the partner's socket ID in chat, but we can also use userId if available
    // Let's assume 'to' is the socket ID here for immediate feedback, 
    // but also try to find the userId if it's a direct request.
    const targetSocketId = to;
    io.to(targetSocketId).emit("friend-request-received", {
      from: socket.userId,
      fromName: socket.name || "ZoneMeet User"
    });
  });

  // Direct Call Signaling
  socket.on("direct-call-request", ({ toUserId, fromUser, roomId }) => {
    const targetSocketId = onlineUsers.get(toUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming-direct-call", { fromUser, fromSocketId: socket.id, roomId });
    }
  });

  socket.on("direct-call-accept", ({ toSocketId, roomId }) => {
    io.to(toSocketId).emit("direct-call-accepted", { bySocketId: socket.id, roomId });
  });

  socket.on("direct-call-reject", ({ toSocketId }) => {
    io.to(toSocketId).emit("direct-call-rejected");
  });

  socket.on("offer", ({ offer, to }) => {
    io.to(to).emit("offer", {
      offer,
      from: socket.id,
    });
  });

  socket.on("answer", ({ answer, to }) => {
    io.to(to).emit("answer", {
      answer,
      from: socket.id,
    });
  });

  socket.on("ice-candidate", ({ candidate, to }) => {
    io.to(to).emit("ice-candidate", {
      candidate,
      from: socket.id,
    });
  });

  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.emit("partner-disconnected");
      socket.partner.partner = null;
      queueUser(socket.partner);
    }

    socket.partner = null;
    queueUser(socket);
  });

  socket.on("stop-matching", () => {
    if (socket.partner) {
      socket.partner.emit("partner-disconnected");
      socket.partner.partner = null;
      queueUser(socket.partner);
    }
    socket.partner = null;

    if (socket.queueTimeout) {
      clearTimeout(socket.queueTimeout);
      socket.queueTimeout = null;
    }

    const index = waitingUsers.indexOf(socket);
    if (index !== -1) {
      waitingUsers.splice(index, 1);
    }
  });

  // NSFW Detection Ban (3 Strikes)
  socket.on("nsfw-detected", () => {
    if (socket.user) {
      const email = socket.user.email;
      let strikes = (userStrikes.get(email) || 0) + 1;
      userStrikes.set(email, strikes);

      console.log(`[AI-GUARD] NSFW detected: ${email}. Strike ${strikes}/2`);

      if (strikes >= 2) {
        if (!bannedEmails.includes(email)) {
          bannedEmails.push(email);
          saveBanned();
        }
        const ip = socket.handshake.address;
        if (!bannedIps.includes(ip)) {
          bannedIps.push(ip);
          saveBannedIps();
        }
        socket.emit("banned-alert", "Your account has been permanently banned for repeated 18+ Adult Content.");
        socket.disconnect();
      } else {
        socket.emit("warning-alert", `Warning: AI detected inappropriate content. Strike ${strikes}/2. One more violation will result in a permanent ban.`);
      }
    }
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;

    // Check if room has 2 users
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    if (roomSockets && roomSockets.size === 2) {
      const [id1, id2] = Array.from(roomSockets);
      const s1 = io.sockets.sockets.get(id1);
      const s2 = io.sockets.sockets.get(id2);

      s1.partner = s2;
      s2.partner = s1;
      const u1 = users.find(u => u.id === s1.userId);
      const u2 = users.find(u => u.id === s2.userId);
      const areFriends = (u1?.friends || []).includes(s2.userId) || (u2?.friends || []).includes(s1.userId);

      s1.emit("matched", { partnerId: s2.id, initiator: true, partnerInfo: { id: s2.userId, name: s2.name, country: s2.country, gender: s2.gender, premium: s2.premium, planName: s2.planName, isFriend: areFriends } });
      s2.emit("matched", { partnerId: s1.id, initiator: false, partnerInfo: { id: s1.userId, name: s1.name, country: s1.country, gender: s1.gender, premium: s1.premium, planName: s1.planName, isFriend: areFriends } });
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);

    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      const user = users.find(u => u.id === socket.userId);
      if (user && user.friends) {
        user.friends.forEach(fId => {
          const friendSocketId = onlineUsers.get(fId);
          if (friendSocketId) {
            io.to(friendSocketId).emit("friend-status", { friendId: socket.userId, online: false });
          }
        });
      }
    }

    const index = waitingUsers.indexOf(socket);
    if (index !== -1) waitingUsers.splice(index, 1);

    if (socket.partner) {
      socket.partner.emit("partner-disconnected");
      socket.partner.partner = null;
    }
  });
});

// --- PAYMENT ENDPOINTS ---

// 1. Create Razorpay Order
app.post('/api/payment/razorpay/order', async (req, res) => {
  try {
    const { amount, currency } = req.body; // Amount in INR (e.g. 89)

    const options = {
      amount: amount * 100, // Razorpay works in paisa
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ success: false, message: "Could not create order" });
  }
});

// 2. Verify Razorpay Payment
app.post('/api/payment/razorpay/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userEmail,
      planName,
      giftRecipientId
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "YOUR_KEY_SECRET")
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // If it's a gift, find the recipient. Otherwise find the payer.
      const targetUser = giftRecipientId
        ? users.find(u => u.id === giftRecipientId || u.email === giftRecipientId)
        : users.find(u => u.email === userEmail);

      if (targetUser) {
        const user = targetUser; // Reuse the variable name to minimize changes
        // DETECT PRODUCT TYPE
        const isCoinPurchase = planName.includes("Coins");

        if (isCoinPurchase) {
          const coinAmount = parseInt(planName.split(" ")[0]); // e.g. "100 Coins" -> 100
          user.coins = (user.coins || 0) + coinAmount;

          transactions.push({
            id: razorpay_payment_id,
            userEmail,
            planName,
            amount: planName.includes("100") ? 49 : planName.includes("200") ? 99 : planName.includes("500") ? 199 : 499,
            timestamp: Date.now(),
            type: "coins"
          });
        } else {
          user.premium = true;
          user.planName = planName;
          let days = 30;
          let amount = 349;
          let bundledCoins = 0;

          if (planName === "Starter") { days = 7; amount = 99; bundledCoins = 50; }
          else if (planName === "Silver") { days = 90; amount = 999; bundledCoins = 500; }
          else if (planName === "VIP Elite") { days = 30; amount = 899; bundledCoins = 400; }
          else if (planName === "Prime") { days = 30; amount = 349; bundledCoins = 150; }

          user.planExpiry = Date.now() + (days * 24 * 60 * 60 * 1000);
          user.coins = (user.coins || 0) + bundledCoins;

          transactions.push({
            id: razorpay_payment_id,
            userEmail,
            planName,
            amount,
            timestamp: Date.now(),
            type: "subscription",
            bundledCoins
          });
        }

        saveTransactions();
        saveUsers();
        const updatedUser = {
          ...user,
          coinActivity: coinActivity.filter(a => a.email === user.email).slice(-10)
        };
        return res.json({ success: true, message: "Transaction completed successfully", user: updatedUser });
      }
      return res.status(404).json({ success: false, message: "User not found" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature, payment verification failed" });
    }
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ success: false, message: "Internal server error during verification" });
  }
});

// --- COINS & HISTORY ENDPOINTS ---

app.post("/api/user/spend-coins", (req, res) => {
  const { email, userId, amount, feature } = req.body;
  const user = users.find(u => (userId && u.id === userId) || (email && u.email === email));
  if (!user) {
    console.log("Spend-coins error: User not found for", { email, userId });
    return res.status(404).json({ message: "User not found" });
  }

  // Admin Immunity: ds9376314@gmail.com uses coins for free
  if (email !== "ds9376314@gmail.com") {
    if (user.coins < amount) {
      return res.status(400).json({ success: false, message: "Not enough coins!" });
    }
    user.coins -= amount;
    // Track monthly spend for leaderboard
    user.monthlySpend = (user.monthlySpend || 0) + amount;
    checkLeaderboardReset();
  }

  // LOG ACTIVITY FOR GUARDIAN & DASHBOARD
  if (!userActivityLog.has(email)) userActivityLog.set(email, []);
  const activityEntry = {
    id: Date.now() + Math.random(),
    email,
    name: user.name,
    feature: feature || "Generic",
    amount: amount,
    timestamp: Date.now()
  };

  userActivityLog.get(email).push({ t: activityEntry.timestamp, act: "spend", amt: amount });
  coinActivity.push(activityEntry);
  saveCoinActivity();

  if (feature === "boost" || feature === "profile_boost") {
    const expiry = Date.now() + (10 * 60 * 1000);
    user.boostExpiry = expiry;
    const uIndex = users.findIndex(u => u.id === user.id);
    if (uIndex > -1) {
      users[uIndex].boostExpiry = expiry;
    }
  }

  // SAVE UNLOCKED FILTERS
  if (feature && feature.startsWith("Unlock Filter: ")) {
    const { filterId } = req.body;
    if (!user.unlockedFilters) {
      user.unlockedFilters = ["None", "Smooth"];
    }
    if (filterId && !user.unlockedFilters.includes(filterId)) {
      user.unlockedFilters.push(filterId);
    }
    // Force write back to the user object just in case
    const uIndex = users.findIndex(u => u.id === user.id);
    if (uIndex > -1) {
      users[uIndex].unlockedFilters = user.unlockedFilters;
    }
    console.log("Saving filter:", filterId, "New list:", user.unlockedFilters);
  }

  // SAVE SECRET IDENTITY MODE
  if (feature === "secret_identity" || feature === "secret_identity_mode") {
    const expiry = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 Days in ms
    user.hasSecretIdentity = true;
    user.secretIdentityExpiry = expiry;
    const uIndex = users.findIndex(u => u.id === user.id);
    if (uIndex > -1) {
      users[uIndex].hasSecretIdentity = true;
      users[uIndex].secretIdentityExpiry = expiry;
    }
  }

  saveUsers();
  res.json({
    success: true,
    coins: user.coins,
    boostExpiry: user.boostExpiry,
    coinActivity: coinActivity.filter(a => a.email === user.email).slice(-10),
    unlockedFilters: user.unlockedFilters || ["None", "Smooth"],
    hasSecretIdentity: user.hasSecretIdentity
  });
});

app.get("/api/user/history", (req, res) => {
  const { email } = req.query;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user.recentStrangers || []);
});

// ADMIN DASHBOARD ENDPOINTS
app.get("/api/admin/stats", authenticateToken, (req, res) => {
  if (req.user.email !== "ds9376314@gmail.com") return res.status(403).send("Forbidden");

  res.json({
    totalUsers: users.length,
    premiumUsers: users.filter(u => u.premium).length,
    liveCalls: Math.floor(onlineUsers.size / 2),
    totalReports: reports.length,
    onlineCount: onlineUsers.size
  });
});

app.get("/api/admin/reports", authenticateToken, (req, res) => {
  if (req.user.email !== "ds9376314@gmail.com") return res.status(403).send("Forbidden");
  res.json(reports);
});

app.get("/api/admin/messages", (req, res) => {
  res.json(contactMessages);
});

app.post("/api/admin/messages/delete", authenticateToken, (req, res) => {
  if (req.user.email !== "ds9376314@gmail.com") return res.status(403).send("Forbidden");
  const { id } = req.body;
  contactMessages = contactMessages.filter(m => m.id !== id);
  saveMessages();
  res.json({ success: true, message: "Message deleted" });
});

app.get("/api/admin/live-users", authenticateToken, (req, res) => {
  if (req.user.email !== "ds9376314@gmail.com") return res.status(403).send("Forbidden");

  const liveList = [];
  onlineUsers.forEach((socketId, userId) => {
    const u = users.find(usr => usr.id === userId);
    if (u) {
      liveList.push({ id: u.id, name: u.name, country: u.country, email: u.email });
    }
  });
  res.json(liveList);
});

app.get("/api/admin/analytics", authenticateToken, (req, res) => {
  if (req.user.email !== "ds9376314@gmail.com") return res.status(403).send("Forbidden");

  const countryCounts = {};
  users.forEach(u => {
    const c = u.country || "Unknown";
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });

  // Calculate real revenue
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const todayRevenue = transactions
    .filter(t => t.timestamp >= startOfDay)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const monthlyRevenue = transactions
    .filter(t => t.timestamp >= startOfMonth)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const lifetimeRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  // COIN SPECIFIC ANALYTICS
  const totalCoinsSold = transactions.reduce((sum, t) => {
    let coins = 0;
    if (t.type === "coins") {
      coins = parseInt(t.planName.split(" ")[0]) || 0;
    } else if (t.bundledCoins) {
      coins = t.bundledCoins;
    }
    return sum + coins;
  }, 0);

  const revenueFromCoins = transactions
    .filter(t => t.type === "coins")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Coins Spent Today
  let coinsSpentToday = 0;
  userActivityLog.forEach((logs, email) => {
    logs.forEach(l => {
      if (l.t >= startOfDay && l.act === "spend") {
        coinsSpentToday += (l.amt || 0);
      }
    });
  });

  // Top Spender
  let topSpender = { name: "N/A", email: "N/A", count: 0 };
  userActivityLog.forEach((logs, email) => {
    const spendCount = logs.filter(l => l.act === "spend").length;
    if (spendCount > topSpender.count) {
      const u = users.find(usr => usr.email === email);
      topSpender = { name: u ? u.name : email, email, count: spendCount };
    }
  });

  res.json({
    countryCounts,
    revenue: {
      today: todayRevenue,
      monthly: monthlyRevenue,
      lifetime: lifetimeRevenue,
      premiumSales: users.filter(u => u.premium).length,
      coinPurchases: transactions.filter(t => t.type === "coins").length,
      history: transactions.slice(-20).reverse()
    },
    coins: {
      totalSold: totalCoinsSold,
      spentToday: coinsSpentToday,
      revenue: revenueFromCoins,
      topSpender,
      recentActivity: coinActivity.slice(-50).reverse() // Last 50 spend events
    }
  });
});

app.post("/api/admin/update-user-premium", authenticateToken, (req, res) => {
  if (req.user.email !== "ds9376314@gmail.com") return res.status(403).send("Forbidden");
  const { email, premium, planName, planExpiry, isVIP } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.premium = premium;
  if (planName === "Free") {
    user.premium = false;
    user.planName = null;
    user.planExpiry = null;
  } else {
    user.planName = planName || (premium ? "Prime" : null);
    user.planExpiry = planExpiry || (premium ? Date.now() + (30 * 24 * 60 * 60 * 1000) : null);
  }
  user.isVIP = isVIP || false;

  saveUsers();
  res.json({ success: true, message: "User updated successfully" });
});

app.get("/api/admin/all-users", authenticateToken, (req, res) => {
  if (req.user.email !== "ds9376314@gmail.com") return res.status(403).send("Forbidden");
  res.json(users);
});

app.get("/api/admin/banned-users", authenticateToken, (req, res) => {
  if (req.user.email !== "ds9376314@gmail.com") return res.status(403).send("Forbidden");
  res.json(bannedEmails);
});

app.post("/api/admin/unban", authenticateToken, (req, res) => {
  if (req.user.email !== "ds9376314@gmail.com") return res.status(403).send("Forbidden");
  const { email } = req.body;
  const index = bannedEmails.indexOf(email);
  if (index > -1) {
    bannedEmails.splice(index, 1);
    saveBanned();
    res.json({ success: true, message: "User unbanned" });
  } else {
    res.json({ success: false, message: "Not found in banned list" });
  }
});

app.post("/api/admin/ban", authenticateToken, (req, res) => {
  if (req.user.email !== "zonemeet84@gmail.com") return res.status(403).send("Forbidden");
  const { email } = req.body;
  if (!bannedEmails.includes(email)) {
    bannedEmails.push(email);
    saveBanned();
    res.json({ success: true, message: "User banned" });
  } else {
    res.json({ success: false, message: "Already banned" });
  }
});


// ========= LEADERBOARD LOGIC =========
const SYSTEM_CONFIG_FILE = path.join(__dirname, "system_config.json");
let systemConfig = { lastResetMonth: new Date().getMonth(), lastResetYear: new Date().getFullYear() };
if (fs.existsSync(SYSTEM_CONFIG_FILE)) {
  try { systemConfig = JSON.parse(fs.readFileSync(SYSTEM_CONFIG_FILE, "utf-8")); } catch (e) {}
}

function saveSystemConfig() {
  try { fs.writeFileSync(SYSTEM_CONFIG_FILE, JSON.stringify(systemConfig, null, 2)); } catch(e){}
  if(db) db.collection("appData").updateOne({ _id: "systemConfig" }, { $set: { data: systemConfig } }, { upsert: true }).catch(console.error);
}

function checkLeaderboardReset() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  if (currentMonth !== systemConfig.lastResetMonth || currentYear !== systemConfig.lastResetYear) {
    console.log("🏆 Monthly Leaderboard Reset Triggered!");
    
    // 1. Award Prizes to Global Top 3
    const globalTop = [...users]
      .filter(u => u.email !== "ds9376314@gmail.com") // Exclude admin
      .sort((a, b) => (b.monthlySpend || 0) - (a.monthlySpend || 0))
      .slice(0, 3);

    const prizes = [1000, 500, 200];
    globalTop.forEach((u, i) => {
      if ((u.monthlySpend || 0) > 0) {
        u.coins += prizes[i];
        coinActivity.push({
          id: "prize-" + Date.now() + "-" + i,
          email: u.email,
          name: u.name,
          type: "earn",
          amount: prizes[i],
          feature: `Leaderboard Rank #${i + 1} Monthly Prize`,
          timestamp: Date.now()
        });
      }
    });

    // 2. Reset All Users' monthlySpend
    users.forEach(u => u.monthlySpend = 0);
    
    // 3. Update Config
    systemConfig.lastResetMonth = currentMonth;
    systemConfig.lastResetYear = currentYear;
    
    saveSystemConfig();
    saveCoinActivity();
    saveUsers();
  }
}

app.get("/api/user/leaderboard", (req, res) => {
  console.log("Leaderboard request received", req.query);
  checkLeaderboardReset();
  
  if (users.length < 1000) {
    return res.json({
      success: true,
      comingSoon: true,
      currentCount: users.length,
      targetCount: 1000
    });
  }

  const { filter } = req.query; // 'india' or 'all'
  
  let leaderboardUsers = [...users].filter(u => u.email !== "ds9376314@gmail.com");
  
  if (filter === 'india') {
    leaderboardUsers = leaderboardUsers.filter(u => u.country === 'India');
  }
  
  const sorted = leaderboardUsers
    .sort((a, b) => (b.monthlySpend || 0) - (a.monthlySpend || 0))
    .slice(0, 10)
    .map((u, i) => ({
      rank: i + 1,
      name: u.name,
      country: u.country,
      monthlySpend: u.monthlySpend || 0,
      isMe: u.email === req.query.email // For highlighting
    }));
    
  res.json({
    success: true,
    leaderboard: sorted,
    month: new Date().toLocaleString('default', { month: 'long' })
  });
});

// ========= TWILIO TURN SERVER CREDENTIALS =========
app.get("/api/turn-credentials", (req, res) => {
  if (!twilioClient) {
    // Fallback to Google STUN only if Twilio not configured
    return res.json({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });
  }
  // Generate temporary Twilio TURN credentials (valid for 1 hour)
  twilioClient.tokens.create().then(token => {
    res.json({ iceServers: token.iceServers });
  }).catch(err => {
    console.error("Twilio TURN error:", err);
    res.json({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });
  });
});
// ==================================================

// ========= KEEP ALIVE LOGIC =========
app.get("/api/ping", (req, res) => {
  res.json({ status: "alive", timestamp: Date.now() });
});

// Self-ping every 10 minutes to stay awake on Render
setInterval(() => {
  const url = `https://meetzone-backend.onrender.com/api/ping`;
  axios.get(url).catch(() => {}); // Ignore errors
}, 600000); 
// =====================================

async function startServer() {
  const PORT = process.env.PORT || 5000;
  
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoClient.connect();
    db = mongoClient.db("meetzone");
    console.log("Connected to MongoDB Atlas Successfully");
    
    // Load data from DB into memory
    const d1 = await db.collection("appData").findOne({ _id: "users" }); 
    if(d1 && d1.data) {
      // Merge with any local users that might have registered during downtime if possible, 
      // but usually DB is source of truth.
      users = d1.data;
      console.log(`[DB] Loaded ${users.length} users from MongoDB`);
    }
    
    const d2 = await db.collection("appData").findOne({ _id: "bannedEmails" }); if(d2 && d2.data) bannedEmails = d2.data;
    const d3 = await db.collection("appData").findOne({ _id: "bannedIps" }); if(d3 && d3.data) bannedIps = d3.data;
    const d4 = await db.collection("appData").findOne({ _id: "transactions" }); if(d4 && d4.data) transactions = d4.data;
    const d5 = await db.collection("appData").findOne({ _id: "coinActivity" }); if(d5 && d5.data) coinActivity = d5.data;
    const d6 = await db.collection("appData").findOne({ _id: "reports" }); if(d6 && d6.data) reports = d6.data;
    const d7 = await db.collection("appData").findOne({ _id: "contactMessages" }); if(d7 && d7.data) contactMessages = d7.data;
    const d8 = await db.collection("appData").findOne({ _id: "systemConfig" }); if(d8 && d8.data) systemConfig = d8.data;

    // IMPORTANT: Normalize after loading from DB
    normalizeUsers(users);

  } catch(e) {
    console.error("CRITICAL: MongoDB Connection Failed!", e.message);
    console.log("Server will continue running in LOCAL MODE (using local JSON files)");
    normalizeUsers(users); // Still normalize local users
  }

  // Start listening AFTER data is loaded to prevent race conditions
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();

