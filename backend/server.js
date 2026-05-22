require("dotenv").config();

const RedisStore = require("rate-limit-redis");
const translate = require('google-translate-api-x');
const express = require("express");
const { MongoClient } = require('mongodb');
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("CRITICAL ERROR: MONGO_URI environment variable is not defined!");
  process.exit(1);
}
const mongoClient = new MongoClient(MONGO_URI);
let db;
const http = require("http");
const { Server } = require("socket.io");
const twilio = require("twilio");
const nodemailer = require("nodemailer");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
// Brevo (Sendinblue) SMTP Setup
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_SMTP_LOGIN || 'zonemeet84@gmail.com',
    pass: process.env.BREVO_SMTP_PASSWORD,
  },
});

const axios = require("axios");
const FormData = require("form-data");
const HIVE_SECRET_KEY = process.env.HIVE_SECRET_KEY || "aBlpX1DmnQBS+EmOsL7rDw==";
const HIVE_ACCESS_SECRET_KEY = process.env.HIVE_ACCESS_SECRET_KEY || "Hg2sWxi1CAURw7eb";

async function verifyWithHiveAI(base64Image) {
  if (!base64Image) return null;
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/jpeg;base64,/, "").replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    const form = new FormData();
    form.append("media", buffer, { filename: "frame.jpg", contentType: "image/jpeg" });

    console.log("[HIVE AI] Sending frame to Hive API for verification...");
    const response = await axios.post("https://api.thehive.ai/api/v2/task/sync", form, {
      headers: {
        ...form.getHeaders(),
        "Authorization": `Token ${HIVE_SECRET_KEY}`
      },
      timeout: 8000
    });

    return response.data;
  } catch (err) {
    console.error("[HIVE AI ERROR]:", err.response ? err.response.data : err.message);
    return null;
  }
}

const app = express();
app.set("trust proxy", 1); // Trust first proxy (Cloudflare/Nginx) for rate-limit IP parsing
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

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
const Stripe = require("stripe");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

const onlineUsers = new Map(); // userId -> socket.id

// RAZORPAY INITIALIZATION
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "YOUR_KEY_ID",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "YOUR_KEY_SECRET",
});

// STRIPE INITIALIZATION
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || "YOUR_STRIPE_SECRET_KEY");

// PAYPAL CONFIG (LIVE)
const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === "sandbox"
  ? "https://api-m.sandbox.paypal.com"
  : "https://api-m.paypal.com";

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID || "BAADK3LiSDAPcyaDLFoPOZfVDy4WYejzy03CrTUHtTy2MosbTuswwkLmad6MJBHwyxWA0ZpOOovNOEoN_o";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "ELTU7ltzU5cuo_Sx5vAcJnKWtuwEeOCDpVTzQ2XNdOjRU3GUNcK1_NiNfDXOXA9YqTyMNjNkDDTSpstT";
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials"
  });
  const data = await res.json();
  return data.access_token;
}

// CASHFREE CONFIG
const CASHFREE_BASE_URL = process.env.CASHFREE_ENV === "production"
  ? "https://api.cashfree.com/pg"
  : "https://sandbox.cashfree.com/pg";


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
const emailOtpStore = {}; // { email: { otp: "123456", expiresAt: 123456789 } }
const loginAttemptsStore = {}; // { email: { attempts: 0, lockedUntil: null } }
const backupOtpCooldownStore = {}; // { email: lastSentTimestamp }

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
  try { fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2)); } catch (e) { }
  if (db) db.collection("appData").updateOne({ _id: "reports" }, { $set: { data: reports } }, { upsert: true }).catch(console.error);
}

let transactions = [];
if (fs.existsSync(TRANSACTIONS_FILE)) {
  try { transactions = JSON.parse(fs.readFileSync(TRANSACTIONS_FILE, "utf-8")); } catch (err) { transactions = []; }
}
function saveTransactions() {
  try { fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2)); } catch (e) { }
  if (db) db.collection("appData").updateOne({ _id: "transactions" }, { $set: { data: transactions } }, { upsert: true }).catch(console.error);
}

let coinActivity = [];
if (fs.existsSync(COIN_ACTIVITY_FILE)) {
  try { coinActivity = JSON.parse(fs.readFileSync(COIN_ACTIVITY_FILE, "utf-8")); } catch (err) { coinActivity = []; }
}
function saveCoinActivity() {
  try { fs.writeFileSync(COINACTIVITY_FILE, JSON.stringify(coinActivity, null, 2)); } catch (e) { }
  if (db) db.collection("appData").updateOne({ _id: "coinActivity" }, { $set: { data: coinActivity } }, { upsert: true }).catch(console.error);
}

let contactMessages = [];
if (fs.existsSync(MESSAGES_FILE)) {
  try { contactMessages = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8")); } catch (err) { contactMessages = []; }
}
function saveMessages() {
  try { fs.writeFileSync(MESSAGES_FILE, JSON.stringify(contactMessages, null, 2)); } catch (e) { }
  if (db) db.collection("appData").updateOne({ _id: "contactMessages" }, { $set: { data: contactMessages } }, { upsert: true }).catch(console.error);
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
    // lastClaimDate: persist claim date so double-claim is blocked even after server restart
    if (u.lastClaimDate === undefined) {
      // If they already claimed today (bonusClaimedToday), set to today so they can't claim again
      u.lastClaimDate = u.bonusClaimedToday ? new Date().toISOString().split('T')[0] : "";
      changed = true;
    }
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

function banUser(email, reason, screenshot = null) {
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
          socket.emit("banned-alert", { reason, screenshot });
          setTimeout(() => socket.disconnect(), 500);
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
  try { fs.writeFileSync(BANNED_FILE, JSON.stringify(bannedEmails, null, 2)); } catch (e) { }
  if (db) db.collection("appData").updateOne({ _id: "bannedEmails" }, { $set: { data: bannedEmails } }, { upsert: true }).catch(console.error);
}

function saveBannedIps() {
  try { fs.writeFileSync(BANNED_IPS_FILE, JSON.stringify(bannedIps, null, 2)); } catch (e) { }
  if (db) db.collection("appData").updateOne({ _id: "bannedIps" }, { $set: { data: bannedIps } }, { upsert: true }).catch(console.error);
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
  try { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); } catch (e) { }
  if (db) {
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

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;

async function verifyCaptcha(token) {
  if (!token) return false;
  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${RECAPTCHA_SECRET}&response=${token}`,
    });
    const data = await response.json();
    return data.success;
  } catch (err) {
    console.error("Captcha Verification Error:", err);
    return false;
  }
}

// =======================
// 2FA SETUP & VERIFICATION
// =======================
// =======================
// ADVANCED AUTH HELPERS
// =======================
function generateTokens(user, rememberMe) {
  // Access token: short-lived
  const accessToken = jwt.sign({ 
    id: user.id,
    tokenVersion: user.tokenVersion || 0
  }, JWT_SECRET, { expiresIn: "15m" });
  
  // Refresh token: contains tokenVersion
  const refreshTokenExpiry = rememberMe ? "7d" : "1d";
  const refreshToken = jwt.sign({ 
    id: user.id, 
    tokenVersion: user.tokenVersion || 0 
  }, JWT_SECRET, { expiresIn: refreshTokenExpiry });

  const cookieOptions = {
    httpOnly: true,
    secure: true, // Requires HTTPS (which is true in production)
    sameSite: "None", // Required for cross-domain requests
  };
  
  if (rememberMe) {
    cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  }
  // If rememberMe is false, maxAge is omitted -> Session cookie

  return { accessToken, refreshToken, cookieOptions };
}

const temp2FASecrets = {}; // Store temp secrets during setup

app.post("/api/auth/2fa/setup", (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: "User not found" });

  const isAdmin = email === "ds9376314@gmail.com";
  const isPremiumPlan = user.premium && (user.planName === "Prime Silver" || user.planName === "VIP Elite");
  
  if (!isAdmin && !isPremiumPlan) {
    return res.status(403).json({ message: "Google Authenticator is an exclusive security feature for Admin and Premium members." });
  }

  const secret = speakeasy.generateSecret({
    name: `ZoneMeet (${email})`
  });
  
  temp2FASecrets[email] = secret.base32;

  QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
    if (err) return res.status(500).json({ message: "Error generating QR code" });
    res.json({ secret: secret.base32, qrCode: data_url });
  });
});

app.post("/api/auth/2fa/verify-setup", (req, res) => {
  const { email, token } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: "User not found" });

  const tempSecret = temp2FASecrets[email];
  if (!tempSecret) return res.status(400).json({ message: "No setup in progress. Please start over." });

  const verified = speakeasy.totp.verify({
    secret: tempSecret,
    encoding: 'base32',
    token: token
  });

  if (verified) {
    user.twoFactorSecret = tempSecret;
    delete temp2FASecrets[email];
    saveUsers();
    res.json({ success: true, message: "Google Authenticator successfully enabled!" });
  } else {
    res.status(400).json({ message: "Invalid code. Try again." });
  }
});

app.post("/api/auth/2fa/disable", (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.twoFactorSecret) {
    delete user.twoFactorSecret;
    saveUsers();
    return res.json({ success: true, message: "Google Authenticator has been disabled." });
  } else {
    return res.status(400).json({ message: "2FA is not enabled on this account." });
  }
});

app.post("/api/auth/2fa/send-backup-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const user = users.find(u => u.email === email);
  if (!user || !user.twoFactorSecret) {
    return res.status(400).json({ message: "Invalid request" });
  }

  // 60 seconds cooldown check
  const lastSent = backupOtpCooldownStore[email] || 0;
  if (Date.now() - lastSent < 60000) {
    return res.status(429).json({ message: "Please wait 60 seconds before requesting another code." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // 5 minute expiry
  emailOtpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
  backupOtpCooldownStore[email] = Date.now();

  try {
    await transporter.sendMail({
      from: '"ZoneMeet Security" <zonemeet84@gmail.com>',
      to: email,
      subject: 'ZoneMeet Backup Verification Code',
      html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2>Login Backup Verification</h2>
              <p>Your 5-minute backup authentication code is:</p>
              <h1 style="color: #6366f1; font-size: 40px;">${otp}</h1>
              <p>If you didn't request this, please ignore this email.</p>
            </div>`
    });
    return res.json({ success: true, message: "Backup code sent successfully." });
  } catch (e) {
    console.error("Backup OTP Email sending failed", e);
    return res.status(500).json({ message: "Failed to send email: " + e.message });
  }
});

app.post("/api/auth/2fa/login-verify", (req, res) => {
  const { email, token, type } = req.body; // type: "google" or "email"
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Rate Limiting Check
  const attemptsData = loginAttemptsStore[email] || { attempts: 0, lockedUntil: null };
  if (attemptsData.lockedUntil && Date.now() < attemptsData.lockedUntil) {
    const minutesLeft = Math.ceil((attemptsData.lockedUntil - Date.now()) / 60000);
    return res.status(429).json({ message: `Too many failed attempts. Try again in ${minutesLeft} minutes.` });
  }

  let verified = false;
  let errorMessage = "";

  if (type === "google") {
    if (!user.twoFactorSecret) {
      errorMessage = "2FA not configured";
    } else {
      verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 1 // allow 30sec before/after
      });
      if (!verified) errorMessage = "Invalid Authenticator Code";
    }
  } else {
    // Email OTP Verification
    const stored = emailOtpStore[email];
    if (!stored || stored.otp !== token || Date.now() > stored.expiresAt) {
      errorMessage = "Invalid or expired Email OTP";
    } else {
      verified = true;
      delete emailOtpStore[email];
    }
  }

  if (verified) {
    // Reset attempts on success
    delete loginAttemptsStore[email];
    
    const { accessToken, refreshToken, cookieOptions } = generateTokens(user, req.body.rememberMe);
    res.cookie('jid', refreshToken, cookieOptions);
    
    return res.json({ success: true, token: accessToken, user });
  } else {
    // Increment failed attempts
    attemptsData.attempts += 1;
    if (attemptsData.attempts >= 3) {
      attemptsData.lockedUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 mins
      loginAttemptsStore[email] = attemptsData;
      return res.status(429).json({ message: `Too many failed attempts. Account locked for 15 minutes.` });
    }
    loginAttemptsStore[email] = attemptsData;
    return res.status(400).json({ message: errorMessage });
  }
});


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

  // Subscription expiry check
  if (user.premium && !user.isPermanentPremium && user.planExpiry && Date.now() > user.planExpiry) {
    user.premium = false;
    user.planName = null;
    user.planExpiry = null;
    delete user.twoFactorSecret;
    saveUsers();
  }

  // Strip 2FA from non-admins and non-premium users
  const isPremiumPlan = user.premium && (user.planName === "Prime Silver" || user.planName === "VIP Elite");
  if (user.twoFactorSecret && user.email !== "ds9376314@gmail.com" && !isPremiumPlan) {
    delete user.twoFactorSecret;
    saveUsers();
  }

  // 2FA Interception
  if (user.twoFactorSecret) {
    return res.json({ requires2FA: true, type: "google", email: user.email });
  }

  // Direct login for users without 2FA
  const { accessToken, refreshToken, cookieOptions } = generateTokens(user, req.body.rememberMe);
  res.cookie('jid', refreshToken, cookieOptions);
  
  res.json({ token: accessToken, user });
});

// EMAIL OTP ENDPOINT
app.post("/api/auth/send-email-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  // Disposable email check
  const fakeDomains = ["10minutemail.com", "tempmail.org", "mailinator.com", "guerrillamail.com", "yopmail.com"];
  const domain = email.split("@")[1];
  if (fakeDomains.includes(domain)) {
    return res.status(400).json({ message: "Disposable emails are not allowed. Please use a real email." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  emailOtpStore[email] = { otp, expiresAt };

  try {
    await transporter.sendMail({
      from: '"ZoneMeet" <otp@zonemeet.chat>', // Updated to official domain
      to: email,
      subject: 'ZoneMeet Verification Code',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Welcome to ZoneMeet!</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #6366f1; font-size: 40px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    console.error("Resend Catch Error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// EMAIL REGISTRATION ENDPOINT
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, otp, gender, country, state, age, referralCode, captchaToken } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  const isCaptchaValid = await verifyCaptcha(captchaToken);
  if (!isCaptchaValid) {
    return res.status(400).json({ message: "Captcha verification failed. Please try again." });
  }

  if (!email || !password || !otp) {
    return res.status(400).json({ message: "Email, Password and OTP are required" });
  }

  // 1. Verify OTP
  const stored = emailOtpStore[email];
  if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }
  delete emailOtpStore[email];

  // 2. Check if user already exists
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ message: "Email already registered. Please login." });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  let code;
  do { code = generateReferralCode(name); } while (users.some(x => x.referralCode === code));

  const today = new Date().toISOString().split('T')[0];
  const newUser = {
    id: "u" + Date.now(),
    phone: "",
    email,
    password: hashedPassword,
    name,
    gender: gender || "Male",
    country: country || "India",
    state: state || "Delhi",
    age: age || "18-24",
    coins: 50,
    premium: false,
    friends: [],
    friendRequests: [],
    streak: 0,
    lastLoginDate: "",
    lastClaimDate: "",
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
    if (referrer && referrer.email !== email) {
      const alreadyRewarded = users.some(u => u.referredBy === referralCode && u.signupIp === clientIp);
      if (!alreadyRewarded) {
        newUser.referredBy = referralCode;
        referrer.coins = (referrer.coins || 0) + 100;
        referrer.referralCount = (referrer.referralCount || 0) + 1;
        referrer.referralCoinsEarned = (referrer.referralCoinsEarned || 0) + 100;
        coinActivity.push({ email: referrer.email || referrer.phone, action: "Referral Reward", amount: 100, timestamp: Date.now() });
        saveCoinActivity();
      }
    }
  }

  saveUsers();
  
  const { accessToken, refreshToken, cookieOptions } = generateTokens(newUser, false);
  res.cookie('jid', refreshToken, cookieOptions);
  
  res.status(201).json({ token: accessToken, user: newUser });
});

// REFRESH TOKEN ENDPOINT
app.post("/api/auth/refresh_token", (req, res) => {
  const token = req.cookies.jid;
  if (!token) return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    // Validate tokenVersion
    if (decoded.tokenVersion !== (user.tokenVersion || 0)) {
      return res.status(401).json({ message: "Session expired or invalidated" });
    }

    const { accessToken, refreshToken, cookieOptions } = generateTokens(user, true); // Keep rememberMe behavior active by issuing a new 7d token
    res.cookie('jid', refreshToken, cookieOptions);

    res.json({ token: accessToken, user });
  } catch (err) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

// LOGOUT ENDPOINT
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie('jid', { httpOnly: true, secure: true, sameSite: "None" });
  res.json({ success: true, message: "Logged out" });
});

// LOGOUT ALL DEVICES ENDPOINT
app.post("/api/auth/logout-all", (req, res) => {
  const token = req.cookies.jid;
  if (!token) return res.status(401).json({ message: "Not logged in" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.id);
    if (user) {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      saveUsers();
    }
  } catch (e) {
    // Ignore verification errors on logout
  }

  res.clearCookie('jid', { httpOnly: true, secure: true, sameSite: "None" });
  res.json({ success: true, message: "Logged out from all devices" });
});

// FORGOT PASSWORD OTP
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: "No account found with this email" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  emailOtpStore[email] = { otp, expiresAt };

  try {
    await transporter.sendMail({
      from: '"ZoneMeet" <otp@zonemeet.chat>',
      to: email,
      subject: 'ZoneMeet Password Reset',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Reset Your Password</h2>
          <p>Your password reset code is:</p>
          <h1 style="color: #ef4444; font-size: 40px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });
    res.json({ success: true, message: "Reset code sent to your email" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send recovery email" });
  }
});

// RESET PASSWORD
app.post("/api/auth/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ message: "All fields are required" });

  const stored = emailOtpStore[email];
  if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
    return res.status(400).json({ message: "Invalid or expired reset code" });
  }
  delete emailOtpStore[email];

  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.password = bcrypt.hashSync(newPassword, 10);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  saveUsers();

  res.json({ success: true, message: "Password reset successful! You can now login." });
});

app.post("/api/auth/login", async (req, res) => {
  const { identifier, password, captchaToken } = req.body; // identifier can be email or phone
  const clientIp = req.ip || req.connection.remoteAddress;

  const isCaptchaValid = await verifyCaptcha(captchaToken);
  if (!isCaptchaValid) {
    return res.status(400).json({ message: "Captcha verification failed. Please try again." });
  }

  let user = users.find((u) => u.email === identifier || u.phone === identifier);

  if (!user) {
    console.log("User not found:", identifier);
    return res.status(400).json({ message: "Account not found. Please Sign Up first to create your account." });
  }

  if (bannedIps.includes(clientIp)) {
    return res.status(403).json({ message: "Your IP is banned from accessing this service." });
  }

  if (bannedEmails.includes(identifier)) {
    return res.status(403).json({ message: "Your account has been permanently banned for violating safety terms." });
  }

  console.log("Login attempt:", identifier);

  if (user && user.email === "ds9376314@gmail.com") {
    user.premium = true;
    user.isPermanentPremium = true;
    user.planName = "VIP Elite";
    
    // Force remove 2FA so admin doesn't get stuck
    if (user.twoFactorSecret) {
      delete user.twoFactorSecret;
      saveUsers();
    }
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

  user.coinActivity = coinActivity.filter(a => a.email === user.email).slice(-10);
  if (!user.unlockedFilters) user.unlockedFilters = ["None", "Smooth"];
  
  // Instant bypass for everyone - 2FA is fully disabled
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "30d" });
  return res.json({ token, user });
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
  let { phone, password, name, gender, country, state, age, otp, referralCode, captchaToken } = req.body;
  if (phone) phone = phone.replace(/\s/g, ""); // Normalize phone
  const clientIp = req.ip || req.connection.remoteAddress;

  const isCaptchaValid = await verifyCaptcha(captchaToken);
  if (!isCaptchaValid) {
    return res.status(400).json({ message: "Captcha verification failed. Please try again." });
  }

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
    lastClaimDate: "",
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
    
    // Check if token was invalidated by password reset or logout-all
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== (user.tokenVersion || 0)) {
      return res.status(401).json({ valid: false, message: "Session expired or invalidated" });
    }
    // Check for subscription expiry
    if (user.premium && !user.isPermanentPremium && user.planExpiry && Date.now() > user.planExpiry) {
      user.premium = false;
      user.planName = null;
      user.planExpiry = null;
      delete user.twoFactorSecret;
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
  return res.status(400).json({ message: "Coin transfers are disabled." });
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

  const today = new Date().toISOString().split('T')[0];

  // Double-claim protection: block if already claimed today (using date, survives server restarts)
  if (user.lastClaimDate === today) {
    return res.json({ success: false, message: "Already collected today! Come back tomorrow." });
  }

  // Also block via bonusClaimedToday (in-memory check)
  if (user.bonusClaimedToday) {
    return res.json({ success: false, message: "Already collected today!" });
  }

  const dayIndex = Math.min((user.streak || 1) - 1, 6);
  const reward = DAILY_REWARDS[dayIndex];

  // Day 7 gives 100 coins and resets streak
  if (user.streak >= 7) {
    user.coins += 100;
    user.bonusClaimedToday = true;
    user.lastClaimDate = today;
    user.streak = 0; // Reset for next cycle
  } else {
    user.coins += reward;
    user.bonusClaimedToday = true;
    user.lastClaimDate = today;
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
  // recipient.coins = (recipient.coins || 0) + amount; // DISABLED per user request

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

  // const recvActivity = {
  //   id: "act" + Date.now() + 1,
  //   email: recipient.email,
  //   type: "earn",
  //   amount: amount,
  //   feature: `Received ${stickerIcon} from ${sender.name}`,
  //   timestamp: new Date().toISOString()
  // };
  // coinActivity.push(recvActivity);

  saveCoinActivity();
  saveUsers();

  // Send socket event to receiver
  const targetSocketId = onlineUsers.get(recipient.id);
  if (targetSocketId) {
    io.to(targetSocketId).emit("receive-sticker", {
      stickerIcon,
      senderName: sender.name,
      amount,
      newTotalCoins: recipient.coins
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
  const GMAIL_AUTH_USER = "zonemeet84@gmail.com";   // Gmail account used for SMTP authentication
  const GMAIL_PASS = "qedv lgzt zlgr upxk";    // App Password from Google (16-char)
  const SUPPORT_EMAIL = "support@zonemeet.chat";  // Custom domain shown to users

  if (GMAIL_PASS) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_AUTH_USER,  // ← must be the actual Gmail account
        pass: GMAIL_PASS
      }
    });

    const mailOptions = {
      from: `ZoneMeet Support <${SUPPORT_EMAIL}>`,  // Shown as sender to users
      to: GMAIL_AUTH_USER,                           // Delivered to zonemeet84@gmail.com
      replyTo: email,                                // Replying goes to the user
      subject: `📩 New Support Message: ${subject || "General Inquiry"}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;padding:30px;border-radius:16px;">
          <h2 style="color:#6366f1;margin-bottom:5px;">📬 New Support Message</h2>
          <p style="color:#94a3b8;font-size:13px;margin-bottom:25px;">From ZoneMeet Contact Form</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;color:#94a3b8;width:100px;">Name</td><td style="padding:10px 0;color:#fff;font-weight:bold;">${name}</td></tr>
            <tr><td style="padding:10px 0;color:#94a3b8;">Email</td><td style="padding:10px 0;color:#6366f1;">${email}</td></tr>
            <tr><td style="padding:10px 0;color:#94a3b8;">Subject</td><td style="padding:10px 0;color:#fff;">${subject || "General Inquiry"}</td></tr>
          </table>
          <div style="background:#1e293b;padding:20px;border-radius:12px;margin-top:20px;border-left:4px solid #6366f1;">
            <p style="color:#94a3b8;font-size:12px;margin:0 0 10px;">Message:</p>
            <p style="color:#f1f5f9;margin:0;line-height:1.6;">${message}</p>
          </div>
          <div style="margin-top:25px;text-align:center;">
            <a href="mailto:${email}?subject=RE: ${subject || 'General Inquiry'}" style="background:#6366f1;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block;">↩ Reply to ${name}</a>
          </div>
          <p style="color:#475569;font-size:11px;text-align:center;margin-top:20px;">ZoneMeet Admin Panel • support@zonemeet.chat</p>
        </div>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email send error:", error.message);
      } else {
        console.log("✅ Contact email sent:", info.response);
      }
    });
  } else {
    console.log("[DEV MODE] Email skipped. Set GMAIL_PASS to enable.");
  }

  // Keep the 3s delay as requested for UX
  setTimeout(() => {
    res.json({ success: true, message: "Message sent successfully" });
  }, 3000);
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 180000,
  pingInterval: 60000,
});

// Setup Redis Adapter for Socket.io
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");

const pubClient = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("[REDIS] Socket.io Redis adapter connected successfully");
  })
  .catch(err => {
    console.error("[REDIS ERROR] Could not connect to Redis. Socket.io will run in standalone mode.", err.message);
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

  const isPremium = req.user.premium || (req.user.planName && req.user.planName !== "Free");
  const isAdmin = req.user.email === "ds9376314@gmail.com";
  if (!isPremium && !isAdmin && req.user.friends && req.user.friends.length >= 5) {
    return res.status(403).json({ message: "Free plan allows a maximum of 5 friends. Upgrade to add more!", requiresPremium: true });
  }

  const targetIsPremium = targetUser.premium || (targetUser.planName && targetUser.planName !== "Free");
  const targetIsAdmin = targetUser.email === "ds9376314@gmail.com";
  if (!targetIsPremium && !targetIsAdmin && targetUser.friends && targetUser.friends.length >= 5) {
    return res.status(400).json({ message: "This user has reached their maximum friend limit." });
  }

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

  const isPremium = req.user.premium || (req.user.planName && req.user.planName !== "Free");
  const isAdmin = req.user.email === "ds9376314@gmail.com";
  if (!isPremium && !isAdmin && req.user.friends && req.user.friends.length >= 5) {
    return res.status(403).json({ message: "Free plan allows a maximum of 5 friends. Upgrade to add more!", requiresPremium: true });
  }

  const reqUserIsPremium = requester.premium || (requester.planName && requester.planName !== "Free");
  const reqUserIsAdmin = requester.email === "ds9376314@gmail.com";
  if (!reqUserIsPremium && !reqUserIsAdmin && requester.friends && requester.friends.length >= 5) {
    return res.status(400).json({ message: "The requester has reached their maximum friend limit." });
  }

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
        socket.emit("banned-alert", { reason: "Your account has been permanently banned due to multiple reports.", screenshot: null });
        setTimeout(() => socket.disconnect(), 500);
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
let waitingQuizUsers = [];
let quizRooms = {};

// REAL-TIME CATEGORY & GLOBAL ONLINE STATS BROADCAST
setInterval(() => {
  if (!io) return;
  const stats = { GK: 0, Tech: 0, Gaming: 0, Anime: 0, Movies: 0, Memes: 0, Football: 0, Science: 0 };

  waitingQuizUsers.forEach(s => {
    if (s.quizCategory && stats[s.quizCategory] !== undefined) {
      stats[s.quizCategory]++;
    }
  });

  for (const roomId in quizRooms) {
    const room = quizRooms[roomId];
    if (room && room.questions && room.questions[0]) {
      const cat = room.questions[0].category;
      if (stats[cat] !== undefined) {
        stats[cat] += Object.keys(room.scores).length || 2;
      }
    }
  }

  // To simulate scale for aesthetics while maintaining dynamic reality, we can add a base scaling
  // But per user request, we display exact real online users.
  io.emit("quiz-category-stats", stats);
  io.emit("global-online-count", onlineUsers.size);
}, 3000);

const QUIZ_QUESTIONS = require("./quiz_questions");

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
      let u1WantsU2 = false;
      const u1Pref = user1.filters?.gender || "all";
      if (u1Pref === "all") {
          // If no preference, mostly match with Males. Rare chance (2%) to match with Female.
          if (user2.gender === "Female") {
              u1WantsU2 = Math.random() < 0.02;
          } else {
              u1WantsU2 = true;
          }
      } else {
          u1WantsU2 = (user2.gender === u1Pref);
      }

      let u2WantsU1 = false;
      const u2Pref = user2.filters?.gender || "all";
      if (u2Pref === "all") {
          if (user1.gender === "Female") {
              u2WantsU1 = Math.random() < 0.02;
          } else {
              u2WantsU1 = true;
          }
      } else {
          u2WantsU1 = (user1.gender === u2Pref);
      }

      const matchesGender = u1WantsU2 && u2WantsU1;

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

function matchQuizUsers() {
  waitingQuizUsers = waitingQuizUsers.filter(s => s.connected && !s.partner);

  // Group by category
  const groups = {};
  for (const s of waitingQuizUsers) {
    const cat = s.quizCategory || "General Knowledge";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(s);
  }

  for (const cat in groups) {
    while (groups[cat].length >= 2) {
      const s1 = groups[cat].shift();
      const s2 = groups[cat].shift();

      // Remove them from the global array
      waitingQuizUsers = waitingQuizUsers.filter(s => s !== s1 && s !== s2);

      const roomId = `quiz_room_${Math.random().toString(36).substr(2, 9)}`;
      s1.join(roomId);
      s2.join(roomId);

      s1.roomId = roomId;
      s2.roomId = roomId;
      s1.partner = s2;
      s2.partner = s1;

      const u1 = users.find(u => u.id === s1.userId);
      const u2 = users.find(u => u.id === s2.userId);

      // Pick 10 random questions matching the category!
      let filteredQs = QUIZ_QUESTIONS.filter(q => q.category.toLowerCase().includes(cat.toLowerCase()));
      if (filteredQs.length < 10) {
        filteredQs = QUIZ_QUESTIONS; // Fallback if not enough questions in category
      }
      const shuffled = [...filteredQs].sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, 10);

      const roomState = {
        roomId,
        players: [s1, s2],
        scores: { [s1.id]: 0, [s2.id]: 0 },
        currentQuestionIndex: 0,
        questions: selectedQuestions,
        questionTimer: null,
        lockedAnswer: null,
        answeredPlayers: {},
        startTime: 0
      };

      quizRooms[roomId] = roomState;

      const p1Info = { id: s1.userId, name: s1.name || u1?.name || "Player 1", coins: u1?.coins || 0 };
      const p2Info = { id: s2.userId, name: s2.name || u2?.name || "Player 2", coins: u2?.coins || 0 };

      s1.emit("quiz-matched", { partnerId: s2.id, partnerInfo: p2Info, roomId, initiator: true });
      s2.emit("quiz-matched", { partnerId: s1.id, partnerInfo: p1Info, roomId, initiator: false });

      // Start 3s countdown before the first question
      let countdown = 3;
      const interval = setInterval(() => {
        io.to(roomId).emit("quiz-countdown", countdown);
        countdown--;
        if (countdown < 0) {
          clearInterval(interval);
          sendQuizQuestion(roomId);
        }
      }, 1000);
    }
  }
}

function sendQuizQuestion(roomId) {
      const room = quizRooms[roomId];
      if (!room) return;

      if (room.currentQuestionIndex >= 10) {
        endQuiz(roomId);
        return;
      }

      const q = room.questions[room.currentQuestionIndex];
      room.lockedAnswer = null;
      room.answeredPlayers = {};
      room.startTime = Date.now();

      io.to(roomId).emit("quiz-question", {
        index: room.currentQuestionIndex,
        category: q.category,
        question: q.question,
        options: q.options,
        timeLimit: 15
      });

      if (room.questionTimer) clearTimeout(room.questionTimer);
      room.questionTimer = setTimeout(() => {
        // Time's up! Move to next question after showing results
        io.to(roomId).emit("quiz-question-timeout", {
          correctAnswer: q.answer,
          currentQuestionIndex: room.currentQuestionIndex
        });

        setTimeout(() => {
          room.currentQuestionIndex++;
          sendQuizQuestion(roomId);
        }, 3000);
      }, 15000);
    }

function endQuiz(roomId) {
      const room = quizRooms[roomId];
      if (!room) return;

      if (room.questionTimer) clearTimeout(room.questionTimer);

      const [s1, s2] = room.players;
      const score1 = room.scores[s1.id] || 0;
      const score2 = room.scores[s2.id] || 0;

      const u1 = users.find(u => u.id === s1.userId);
      const u2 = users.find(u => u.id === s2.userId);

      let winnerId = null;
      let loserId = null;
      let isDraw = false;

      if (score1 > score2) {
        winnerId = s1.userId;
        loserId = s2.userId;
      } else if (score2 > score1) {
        winnerId = s2.userId;
        loserId = s1.userId;
      } else {
        isDraw = true;
      }

      // Punishments / Dares for loser
      const dares = [
        "Sing a song dramatically for 10 seconds 🎤",
        "Dance happily for 5 seconds without music 💃",
        "Say 'I am the ultimate champion' in a funny voice 👑",
        "Make a hilarious, funny face and hold it for 5 seconds 😜",
        "Recite a funny poem in 3 seconds 📜",
        "Introduce yourself as if you are a professional wrestler 🤼"
      ];
      const randomDare = dares[Math.floor(Math.random() * dares.length)];

      if (isDraw) {
        // Refund both 50 coins
        if (u1) {
          u1.coins = (u1.coins || 0) + 50;
          coinActivity.push({ email: u1.email, type: "earn", amount: 50, description: "Quiz Duel Draw Refund", timestamp: Date.now() });
          s1.emit("coins-updated", u1.coins);
        }
        if (u2) {
          u2.coins = (u2.coins || 0) + 50;
          coinActivity.push({ email: u2.email, type: "earn", amount: 50, description: "Quiz Duel Draw Refund", timestamp: Date.now() });
          s2.emit("coins-updated", u2.coins);
        }
        saveCoinActivity();
        saveUsers();

        io.to(roomId).emit("quiz-finished", {
          draw: true,
          scores: room.scores,
          totalScores: { [s1.id]: score1, [s2.id]: score2 }
        });
      } else {
        // Credit winner 100 coins
        const winnerUser = u1?.id === winnerId ? u1 : u2;
        const winnerSocket = s1.userId === winnerId ? s1 : s2;

        if (winnerUser) {
          winnerUser.coins = (winnerUser.coins || 0) + 100;
          coinActivity.push({
            email: winnerUser.email,
            type: "earn",
            amount: 100,
            description: "Won Quiz Duel Match!",
            timestamp: Date.now()
          });
          winnerSocket.emit("coins-updated", winnerUser.coins);
        }

        saveCoinActivity();
        saveUsers();

        io.to(roomId).emit("quiz-finished", {
          draw: false,
          scores: room.scores,
          totalScores: { [s1.id]: score1, [s2.id]: score2 },
          winnerId,
          loserId,
          dare: randomDare
        });
      }

      // Clean up quiz room state but keep socket.partner and roomId active so they can interact on the dare screen!
      delete quizRooms[roomId];
    }

    const queueUser = (socket) => {
      if (!socket) return;
      if (socket.queueTimeout) clearTimeout(socket.queueTimeout);

      const isOwner = socket.email?.toLowerCase() === "ds9376314@gmail.com";
      const plan = socket.planName?.toLowerCase() || "";
      const isPremium = socket.premium || (plan !== "" && plan !== "free") || isOwner;

      // 5 seconds delay for free users, instant (0s) for subscription users
      let delay = isPremium ? 0 : 5000;

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
      "kamine", "haramkhor", "bsdk", "bhonsdi", "gaand", "randi", "saala", "saali", "harami", "muthi",
      "chudai", "rand", "bhadwa", "maderchod", "behanchod", "mc", "bc", "gaandu", "tatte", "cunt", "asshole"
    ];
    const userStrikes = new Map(); // email -> strike count

    io.on("connection", (socket) => {
      console.log("User Connected:", socket.id);

      // Initialize with default filters/info
      socket.filters = { gender: "all", country: "all" };

      socket.on("register-user", (userId) => {
        socket.userId = userId;
        onlineUsers.set(userId, socket.id);

        // Safety Ban check: Kick banned users immediately
        const user = users.find(u => u.id === userId);
        if (user && bannedEmails.includes(user.email)) {
          socket.emit("banned-alert", { reason: "Your account has been permanently banned for safety violations.", screenshot: null });
          setTimeout(() => socket.disconnect(), 500);
          return;
        }

        // Broadcast online status to friends
        if (user && user.friends) {
          user.friends.forEach(fId => {
            const friendSocketId = onlineUsers.get(fId);
            if (friendSocketId) {
              io.to(friendSocketId).emit("friend-status", { friendId: userId, online: true });
            }
          });
        }
      });

      socket.on("request-hd-stream", ({ enable }) => {
        if (!socket.userId) {
          socket.emit("hd-denied", { message: "User not identified. Please login." });
          return;
        }
        const user = users.find(u => u.id === socket.userId);
        if (user && (user.premium || user.email === "ds9376314@gmail.com")) {
          socket.emit("hd-approved", { enable });
        } else {
          socket.emit("hd-denied", { message: "Premium subscription required for HD video." });
        }
      });

      socket.on("set-profile", (profile) => {
        // Safety Ban check: Kick banned users immediately
        if (profile && bannedEmails.includes(profile.email)) {
          socket.emit("banned-alert", { reason: "Your account has been permanently banned for safety violations.", screenshot: null });
          setTimeout(() => socket.disconnect(), 500);
          return;
        }

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
        socket.email = profile.email;
        socket.gender = profile.gender || (Math.random() > 0.5 ? "Male" : "Female");
        socket.country = profile.country || "India";
        socket.state = profile.state || "All States";
        socket.age = profile.age || "18-24";
        socket.premium = isPremium;
        socket.planName = pName;

        console.log(`User ${socket.id} profile set securely: ${profile.name} (${profile.email}), ${socket.premium ? "PREMIUM" : "FREE"}`);

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

      socket.on("set-translate-language", (langCode) => {
        socket.translateLang = langCode;
        console.log(`User ${socket.id} set translation language to ${langCode}`);
      });

      socket.on("send-message", async ({ text, to }) => {
        if (socket.user) {
          const email = socket.user.email;
          const lowerText = text.toLowerCase();
          
          let isToxic = false;
          let violationCategory = "";

          // 1. Local Word Scanner (Robust word/phrase match)
          const hasBadWord = BAD_WORDS_LIST.some(word => {
            const regex = new RegExp(`\\b${word}\\b|${word}`, "i");
            return regex.test(lowerText);
          });

          if (hasBadWord) {
            isToxic = true;
            violationCategory = "Restricted language/slurs";
          }

          // 2. OpenAI Moderation API Check (if key is set)
          if (!isToxic && process.env.OPENAI_API_KEY) {
            try {
              const res = await fetch("https://api.openai.com/v1/moderations", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({ input: text })
              });
              const data = await res.json();
              if (data.results && data.results[0]?.flagged) {
                isToxic = true;
                const categories = data.results[0].categories;
                violationCategory = Object.keys(categories).filter(c => categories[c]).join(", ");
              }
            } catch (err) {
              console.error("OpenAI Moderation API call failed:", err);
            }
          }

          // Handle Toxicity / Abuse
          if (isToxic) {
            let strikes = (userStrikes.get(email) || 0) + 1;
            userStrikes.set(email, strikes);

            console.log(`[GUARDIAN] CHAT ABUSE strike for ${email}: Strike ${strikes}/3. Category: ${violationCategory}`);

            if (strikes >= 3) {
              console.log(`[GUARDIAN] CHAT ABUSE threshold exceeded: ${email}. Banning permanently...`);
              banUser(email, `AI Detection: Repeated chat abuse and toxicity (${violationCategory})`);
              return;
            } else {
              socket.emit("warning-alert", `Warning: Your message violates our safety guidelines (${violationCategory}). Strike ${strikes}/3. Continued abuse will lead to a permanent account ban.`);
              return; // Block the message from being sent!
            }
          }
        }

        let finalText = text;
        let originalText = null;

        const targetSocket = io.sockets.sockets.get(to);
        if (targetSocket && targetSocket.translateLang && targetSocket.premium) {
          try {
            const res = await translate(text, { to: targetSocket.translateLang });
            finalText = res.text;
            originalText = text;
          } catch (e) {
            console.error("Translation error:", e);
          }
        }

        io.to(to).emit("receive-message", {
          text: finalText,
          originalText: originalText,
          senderId: socket.id,
        });
      });

      socket.on("send-subtitle", async ({ text, to }) => {
        let finalText = text;
        const targetSocket = io.sockets.sockets.get(to);
        if (targetSocket && targetSocket.translateLang && targetSocket.premium) {
          try {
            const res = await translate(text, { to: targetSocket.translateLang });
            finalText = res.text;
          } catch (e) {
            console.error("Translation error for subtitle:", e);
          }
        }
        io.to(to).emit("receive-subtitle", { text: finalText });
      });

      socket.on("friend-request", ({ to }) => {
        const targetSocketId = to;
        io.to(targetSocketId).emit("friend-request-received", {
          from: socket.userId,
          fromName: socket.name || "ZoneMeet User"
        });
      });

      // Real-time gift relay (instant, before backend processes)
      socket.on("send-gift-to-partner", ({ to, stickerIcon, senderName, amount }) => {
        io.to(to).emit("receive-gift-from-partner", {
          stickerIcon,
          senderName: senderName || socket.name || "Partner",
          amount
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

      socket.on("partner-effect", ({ type, value }) => {
        if (socket.partner) {
          socket.partner.emit("partner-effect", { type, value });
        }
      });

      socket.on("mic-state-change", ({ enabled }) => {
        if (socket.partner) {
          socket.partner.emit("partner-mic-state", { enabled });
        }
      });

      socket.on("camera-state-change", ({ enabled }) => {
        if (socket.partner) {
          socket.partner.emit("partner-camera-state", { enabled });
        }
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
          socket.partner.emit("partner-stopped");
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

      // NSFW Multi-Layer Moderation Handler (Hybrid NSFWJS client-side fast scan + Hive AI backend-side verification)
      socket.on("nsfw-suspicious-verify", async ({ screenshot }) => {
        if (!socket.user) return;
        const email = socket.user.email;

        // Rate-limit Hive AI API requests per socket to protect bandwidth & API usage limits
        const now = Date.now();
        if (socket.lastHiveScanTime && now - socket.lastHiveScanTime < 3000) {
          console.log(`[HIVE AI RATELIMIT] Skipping verification for ${email} (too frequent).`);
          return;
        }
        socket.lastHiveScanTime = now;

        console.log(`[HIVE AI MODERATION] Running accurate sync verification for suspicious frame from ${email}...`);
        const hiveResult = await verifyWithHiveAI(screenshot);

        if (!hiveResult) {
          console.warn(`[HIVE AI ERROR] Verification failed or timed out for ${email}. Skipping action.`);
          return;
        }

        let isPornViolated = false;
        let isSexualViolated = false;
        let isSexyViolated = false;

        let maxPornScore = 0;
        let maxSexualScore = 0;
        let maxSexyScore = 0;

        let matchedClass = "";
        let matchedScore = 0;

        if (hiveResult.output && Array.isArray(hiveResult.output)) {
          hiveResult.output.forEach(out => {
            if (out.classes && Array.isArray(out.classes)) {
              out.classes.forEach(c => {
                const className = c.class.toLowerCase();
                const score = c.score;

                // 1. Sexual Activity (Recommended Threshold: 0.85)
                if (className === "sexual_activity" || className.includes("sexual_act")) {
                  maxSexualScore = Math.max(maxSexualScore, score);
                  if (score > 0.85) {
                    isSexualViolated = true;
                    if (score > matchedScore) {
                      matchedClass = c.class;
                      matchedScore = score;
                    }
                  }
                }
                // 2. Porn / Explicit Nudity (Recommended Threshold: 0.88)
                else if (className === "general_nsfw" || className.includes("genitalia") || className.includes("breast") || className.includes("buttocks") || className.includes("porn")) {
                  maxPornScore = Math.max(maxPornScore, score);
                  if (score > 0.88) {
                    isPornViolated = true;
                    if (score > matchedScore) {
                      matchedClass = c.class;
                      matchedScore = score;
                    }
                  }
                }
                // 3. Sexy / Suggestive (Recommended Threshold: 0.95)
                else if (className === "general_suggestive" || className.includes("sexy") || className.includes("underwear") || className.includes("suggestive")) {
                  maxSexyScore = Math.max(maxSexyScore, score);
                  if (score > 0.95) {
                    isSexyViolated = true;
                    if (score > matchedScore) {
                      matchedClass = c.class;
                      matchedScore = score;
                    }
                  }
                }
              });
            }
          });
        }

        const isViolated = isPornViolated || isSexualViolated || isSexyViolated;

        if (isViolated) {
          const reason = `Hive AI: Explicit content detected (${matchedClass} with confidence ${matchedScore.toFixed(3)})`;
          console.log(`[NSFW HYBRID VIOLATION] Verified violation for ${email}. Reason: ${reason}`);

          // Save Screenshot Evidence of confirmed violation to local folder
          if (screenshot) {
            try {
              const evidenceDir = path.join(__dirname, "moderation_evidence");
              if (!fs.existsSync(evidenceDir)) {
                fs.mkdirSync(evidenceDir, { recursive: true });
              }
              const base64Data = screenshot.replace(/^data:image\/jpeg;base64,/, "").replace(/^data:image\/png;base64,/, "");
              const filename = `evidence_${email.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.jpg`;
              const filePath = path.join(evidenceDir, filename);
              fs.writeFileSync(filePath, base64Data, "base64");
              console.log(`[NSFW EVIDENCE SAVED] Verified evidence screenshot written to ${filePath}`);
            } catch (err) {
              console.error("Failed to save verified NSFW screenshot evidence:", err);
            }
          }

          // Save Report to database/json so it shows in Admin Panel
          const targetUserObj = users.find(u => u.email === email) || {};
          reports.push({
            id: Date.now(),
            reporterId: "AI_GUARDIAN",
            targetId: socket.userId || "unknown",
            targetName: targetUserObj.name || email.split("@")[0],
            targetEmail: email,
            reason: "AI Moderator: Explicit Content Detected",
            details: reason,
            evidence: screenshot, // Base64 screenshot displays natively in the admin.js UI!
            timestamp: new Date().toISOString()
          });
          saveReports();

          // Strike Escalation System
          let strikes = (userStrikes.get(email) || 0) + 1;
          userStrikes.set(email, strikes);

          console.log(`[NSFW STRIKE UPDATED] User: ${email} - Strike ${strikes}/3.`);

          if (strikes >= 3) {
            console.log(`[NSFW BANNING USER] ${email} banned for 1 day.`);
            banUser(email, `AI Detection: 3 consecutive safety violations. Banned for 1 day.`, screenshot);
            // Auto unban after 24 hours
            setTimeout(() => {
              const index = bannedEmails.indexOf(email);
              if (index > -1) {
                bannedEmails.splice(index, 1);
                saveBanned();
                console.log(`[UNBAN] ${email} 1-day ban expired.`);
              }
            }, 24 * 60 * 60 * 1000);
          } else {
            // Send warning back to socket
            socket.emit("warning-alert", `⚠️ WARNING: Inappropriate content detected! If you repeat this, you will be banned for 1 day. Strike ${strikes}/3.`);
            
            // Emit partner-effect to blur remote partner's stream
            if (socket.partner) {
              socket.partner.emit("partner-effect", { type: "blur", value: true });
            }

            // Emit local strike alert
            socket.emit("nsfw-strike-alert", { strikes, maxStrikes: 3, reason });

            // Disconnect current partner session to safeguard partner
            if (socket.partner) {
              const partner = socket.partner;
              partner.emit("partner-disconnected");
              partner.partner = null;
              socket.partner = null;
              queueUser(partner);
            }
            queueUser(socket);
          }
        } else {
          console.log(`[HIVE AI CLEAN] Suspicious frame verified CLEAN by Hive AI for ${email} (Porn: ${maxPornScore.toFixed(3)}, Sexual: ${maxSexualScore.toFixed(3)}, Sexy: ${maxSexyScore.toFixed(3)}).`);
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

        // If they were in quiz queue, remove them and refund
        const quizIdx = waitingQuizUsers.indexOf(socket);
        if (quizIdx !== -1) {
          waitingQuizUsers.splice(quizIdx, 1);
          const u = users.find(usr => usr.id === socket.userId);
          if (u) {
            u.coins = (u.coins || 0) + 50;
            coinActivity.push({ email: u.email, type: "earn", amount: 50, description: "Quiz Duel Queue Left Refund", timestamp: Date.now() });
            saveCoinActivity();
            saveUsers();
            socket.emit("coins-updated", u.coins);
          }
        }

        // If they were in an active quiz match, partner wins by forfeit
        if (socket.roomId && quizRooms[socket.roomId]) {
          const room = quizRooms[socket.roomId];
          const partner = room.players.find(p => p.id !== socket.id);
          if (partner) {
            partner.emit("quiz-partner-disconnected");
            const u = users.find(usr => usr.id === partner.userId);
            if (u) {
              u.coins = (u.coins || 0) + 100;
              coinActivity.push({ email: u.email, type: "earn", amount: 100, description: "Quiz Duel Win (forfeit)", timestamp: Date.now() });
              partner.emit("coins-updated", u.coins);
              saveCoinActivity();
              saveUsers();
            }
          }
          if (room.questionTimer) clearTimeout(room.questionTimer);
          delete quizRooms[socket.roomId];
        }

        if (socket.partner) {
          const partner = socket.partner;
          partner.emit("partner-reconnecting");
          setTimeout(() => {
            if (!socket.connected && partner.partner === socket) {
              partner.emit("partner-disconnected");
              partner.partner = null;
              queueUser(partner);
            }
          }, 8000);
        }
      });

      // --- QUIZ DUEL / BRAIN CLASH EVENTS ---

      socket.on("join-quiz-queue", ({ category } = {}) => {
        socket.quizCategory = category || "General Knowledge";
        if (!socket.userId) {
          socket.emit("quiz-error", { message: "Please register or login first." });
          return;
        }
        const user = users.find(u => u.id === socket.userId);
        if (!user) {
          socket.emit("quiz-error", { message: "User profile not found." });
          return;
        }

        if ((user.coins || 0) < 50) {
          socket.emit("quiz-error", { message: "Insufficient Coins! Entry fee is 50 coins." });
          return;
        }

        // Check if already in queue
        if (waitingQuizUsers.includes(socket)) {
          return;
        }

        // Deduct 50 coins entry fee
        user.coins = (user.coins || 0) - 50;
        coinActivity.push({
          email: user.email,
          type: "spend",
          amount: 50,
          description: "Quiz Duel entry fee",
          timestamp: Date.now()
        });
        saveCoinActivity();
        saveUsers();

        socket.emit("coins-updated", user.coins);
        waitingQuizUsers.push(socket);
        socket.emit("quiz-queue-joined");

        console.log(`[Quiz Queue] User ${user.name} joined Category: ${socket.quizCategory}. Total Queue size: ${waitingQuizUsers.length}`);

        // Trigger matchmaking
        matchQuizUsers();
      });

      socket.on("leave-quiz-queue", () => {
        const idx = waitingQuizUsers.indexOf(socket);
        if (idx !== -1) {
          waitingQuizUsers.splice(idx, 1);

          // Refund 50 coins
          const user = users.find(u => u.id === socket.userId);
          if (user) {
            user.coins = (user.coins || 0) + 50;
            coinActivity.push({
              email: user.email,
              type: "earn",
              amount: 50,
              description: "Quiz Duel Leave refund",
              timestamp: Date.now()
            });
            saveCoinActivity();
            saveUsers();
            socket.emit("coins-updated", user.coins);
          }
          socket.emit("quiz-queue-left");
        }
      });

      socket.on("quiz-submit-answer", ({ selectedOption }) => {
        const roomId = socket.roomId;
        const room = quizRooms[roomId];
        if (!room) return;

        const q = room.questions[room.currentQuestionIndex];
        if (!q) return;

        // Check if player already answered this question
        if (room.answeredPlayers[socket.id]) return;

        const isCorrect = selectedOption === q.answer;
        room.answeredPlayers[socket.id] = selectedOption;

        const responseTime = (Date.now() - room.startTime) / 1000;
        const isFirstToAnswer = (room.lockedAnswer === null);

        if (isFirstToAnswer) {
          // First player to submit locks their choice
          room.lockedAnswer = { socketId: socket.id, selectedOption, correct: isCorrect };

          if (isCorrect) {
            // Correct answer! They win the point for this question immediately
            const speedBonus = responseTime < 3 ? 0.5 : 0;
            room.scores[socket.id] = (room.scores[socket.id] || 0) + 1 + speedBonus;

            if (room.questionTimer) clearTimeout(room.questionTimer);

            io.to(roomId).emit("quiz-answer-result", {
              playerId: socket.id,
              selectedOption,
              correct: true,
              scoreGained: 1 + speedBonus,
              speedBonus: speedBonus > 0,
              totalScores: room.scores,
              correctAnswer: q.answer
            });

            // 3 seconds delay before next question
            setTimeout(() => {
              room.currentQuestionIndex++;
              sendQuizQuestion(roomId);
            }, 3000);
          } else {
            // Wrong answer! First player loses their turn, the other player gets a chance
            io.to(roomId).emit("quiz-answer-result", {
              playerId: socket.id,
              selectedOption,
              correct: false,
              scoreGained: 0,
              totalScores: room.scores,
              lockout: true // Tell the client that this player is locked out
            });
          }
        } else {
          // Second player is answering (first player got it wrong)
          if (isCorrect) {
            // Correct answer!
            room.scores[socket.id] = (room.scores[socket.id] || 0) + 1;

            if (room.questionTimer) clearTimeout(room.questionTimer);

            io.to(roomId).emit("quiz-answer-result", {
              playerId: socket.id,
              selectedOption,
              correct: true,
              scoreGained: 1,
              totalScores: room.scores,
              correctAnswer: q.answer
            });

            setTimeout(() => {
              room.currentQuestionIndex++;
              sendQuizQuestion(roomId);
            }, 3000);
          } else {
            // Wrong answer! Both got it wrong
            if (room.questionTimer) clearTimeout(room.questionTimer);

            io.to(roomId).emit("quiz-answer-result", {
              playerId: socket.id,
              selectedOption,
              correct: false,
              scoreGained: 0,
              totalScores: room.scores,
              correctAnswer: q.answer,
              endedForBoth: true
            });

            setTimeout(() => {
              room.currentQuestionIndex++;
              sendQuizQuestion(roomId);
            }, 3000);
          }
        }
      });

      socket.on("quiz-finished-dare-done", () => {
        socket.emit("quiz-dare-confirmed");
      });

      socket.on("quiz-dare-response", ({ accepted }) => {
        const partner = socket.partner;
        if (accepted) {
          if (partner) partner.emit("quiz-dare-accepted-by-opponent");
        } else {
          socket.emit("quiz-connection-closed");
          if (partner) {
            partner.emit("quiz-connection-closed");
            partner.partner = null;
            partner.roomId = null;
          }
          socket.partner = null;
          socket.roomId = null;
        }
      });

      socket.on("quiz-winner-decision", ({ stay }) => {
        const partner = socket.partner;
        if (stay) {
          socket.emit("quiz-stay-connected-success");
          if (partner) partner.emit("quiz-stay-connected-success");
        } else {
          socket.emit("quiz-connection-closed");
          if (partner) {
            partner.emit("quiz-connection-closed");
            partner.partner = null;
            partner.roomId = null;
          }
          socket.partner = null;
          socket.roomId = null;
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

    // 1.5 Create Razorpay Subscription
    app.post('/api/payment/razorpay/create-subscription', async (req, res) => {
      try {
        const { amount, currency, planName, userEmail } = req.body;
        const plan = await razorpay.plans.create({
          period: "monthly",
          interval: 1,
          item: { name: `ZoneMeet ${planName}`, amount: Math.round(amount), currency: currency || "INR", description: `Premium ${planName}` }
        });
        const subscription = await razorpay.subscriptions.create({
          plan_id: plan.id,
          customer_notify: 1,
          total_count: 120
        });
        res.json({ success: true, subscription_id: subscription.id, amount, currency });
      } catch (error) {
        console.error("Razorpay Sub Error:", error);
        res.status(500).json({ success: false, message: "Could not create subscription" });
      }
    });

    // 2. Verify Razorpay Payment
    app.post('/api/payment/razorpay/verify', async (req, res) => {
      try {
        const {
          razorpay_order_id,
          razorpay_subscription_id,
          razorpay_payment_id,
          razorpay_signature,
          userEmail,
          planName,
          giftRecipientId
        } = req.body;

        const body = razorpay_subscription_id 
          ? razorpay_payment_id + "|" + razorpay_subscription_id 
          : razorpay_order_id + "|" + razorpay_payment_id;
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
              // Credit base coins + bonus coins based on package
              let coinsToAdd = parseInt(planName.split(" ")[0]); // base coins, e.g. "200 Coins" -> 200
              let bonusCoins = planName.includes("200") ? 50 : planName.includes("500") ? 150 : planName.includes("1300") ? 300 : 0;
              user.coins = (user.coins || 0) + coinsToAdd + bonusCoins;

              transactions.push({
                id: razorpay_payment_id,
                userEmail,
                planName,
                amount: planName.includes("100") ? 79 : planName.includes("200") ? 149 : planName.includes("500") ? 299 : 699,
                timestamp: Date.now(),
                type: "coins"
              });
            } else {
              user.premium = true;
              user.planName = planName;
              let days = 30;
              let amount = 349;
              let bundledCoins = 0;

              if (planName === "Starter") { days = 7; amount = 149; bundledCoins = 50; }
              else if (planName === "Silver") { days = 90; amount = 1599; bundledCoins = 500; }
              else if (planName === "VIP Elite") { days = 30; amount = 999; bundledCoins = 400; }
              else if (planName === "Prime") { days = 30; amount = 599; bundledCoins = 150; }

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

    // ========== STRIPE ROUTES ==========

    // Stripe - Create Subscription Checkout
    app.post("/api/payment/stripe/create-subscription-checkout", async (req, res) => {
      try {
        const { amount, currency = "usd", planName, userEmail } = req.body;
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'subscription',
          line_items: [{
            price_data: {
              currency,
              recurring: { interval: 'month' },
              product_data: { name: `ZoneMeet ${planName}` },
              unit_amount: Math.round(amount)
            },
            quantity: 1,
          }],
          metadata: { planName, userEmail },
          success_url: `https://zonemeet.chat/?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `https://zonemeet.chat/`,
        });
        res.json({ checkoutUrl: session.url });
      } catch (err) {
        console.error("Stripe Sub Error:", err);
        res.status(500).json({ error: err.message });
      }
    });

    // Stripe - Verify Subscription Checkout
    app.post("/api/payment/stripe/verify-subscription", async (req, res) => {
      try {
        const { sessionId, userEmail } = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status !== "paid") return res.status(400).json({ success: false, message: "Not paid" });
        
        const planName = session.metadata.planName || "Unknown";
        const targetEmail = session.metadata.userEmail || userEmail;
        const user = users.find(u => u.email === targetEmail);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        let days = 30, bundledCoins = 0;
        if (planName === "Starter") { days = 7; bundledCoins = 50; }
        else if (planName === "Prime") { days = 30; bundledCoins = 150; }
        else if (planName === "Silver") { days = 90; bundledCoins = 500; }
        else if (planName === "VIP Elite") { days = 30; bundledCoins = 400; }
        
        user.planExpiry = Date.now() + (days * 24 * 60 * 60 * 1000);
        user.premium = true;
        user.planName = planName;
        user.coins = (user.coins || 0) + bundledCoins;

        transactions.push({ id: session.subscription, userEmail: targetEmail, planName, gateway: "stripe_subscription", timestamp: Date.now() });
        saveTransactions(); saveUsers();
        
        const updatedUser = { ...user, coinActivity: coinActivity.filter(a => a.email === user.email).slice(-10) };
        res.json({ success: true, user: updatedUser });
      } catch (err) {
        console.error("Stripe Verify Sub Error:", err);
        res.status(500).json({ success: false, message: "Verification failed" });
      }
    });

    // Stripe - Create Payment Intent
    app.post("/api/payment/stripe/create-intent", async (req, res) => {
      try {
        const { amount, currency = "inr", planName, userEmail } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount), // already in paise/cents
          currency,
          metadata: { planName, userEmail }
        });
        res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
      } catch (err) {
        console.error("Stripe Intent Error:", err);
        res.status(500).json({ error: err.message });
      }
    });

    // Stripe - Verify & Activate Plan
    app.post("/api/payment/stripe/verify", async (req, res) => {
      try {
        const { paymentIntentId, userEmail, planName, giftRecipientId } = req.body;
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (intent.status !== "succeeded") {
          return res.status(400).json({ success: false, message: "Payment not completed" });
        }
        const user = users.find(u => u.email === (giftRecipientId || userEmail));
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const isCoinPurchase = planName.includes("Coins");
        if (isCoinPurchase) {
          const coinsToAdd = parseInt(planName.split(" ")[0]);
          const bonusCoins = planName.includes("200") ? 50 : planName.includes("500") ? 150 : planName.includes("1300") ? 300 : 0;
          user.coins = (user.coins || 0) + coinsToAdd + bonusCoins;
        } else {
          let days = 7, amount = 149, bundledCoins = 0;
          if (planName === "Starter") { days = 7; amount = 149; bundledCoins = 50; }
          else if (planName === "Prime") { days = 30; amount = 599; bundledCoins = 150; }
          else if (planName === "Silver") { days = 90; amount = 1599; bundledCoins = 500; }
          else if (planName === "VIP Elite") { days = 30; amount = 999; bundledCoins = 400; }
          user.planExpiry = Date.now() + (days * 24 * 60 * 60 * 1000);
          user.premium = true;
          user.planName = planName;
          user.coins = (user.coins || 0) + bundledCoins;
        }
        transactions.push({ id: paymentIntentId, userEmail, planName, gateway: "stripe", timestamp: Date.now() });
        saveTransactions(); saveUsers();
        const updatedUser = { ...user, coinActivity: coinActivity.filter(a => a.email === user.email).slice(-10) };
        res.json({ success: true, message: "Stripe payment verified", user: updatedUser });
      } catch (err) {
        console.error("Stripe Verify Error:", err);
        res.status(500).json({ success: false, message: "Stripe verification failed" });
      }
    });

    // ========== PAYPAL ROUTES ==========

    // PayPal - Create Order
    app.post("/api/payment/paypal/create-order", async (req, res) => {
      try {
        const { amount, currency = "USD", planName, userEmail } = req.body;
        const accessToken = await getPayPalAccessToken();
        const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [{
              amount: { currency_code: currency, value: parseFloat(amount / 100).toFixed(2) },
              description: `ZoneMeet ${planName}`,
              custom_id: JSON.stringify({ userEmail, planName })
            }]
          })
        });
        const order = await response.json();
        if (!order.id) throw new Error(order.message || "PayPal order creation failed");
        const approveUrl = order.links.find(l => l.rel === "approve")?.href;
        res.json({ orderId: order.id, approveUrl });
      } catch (err) {
        console.error("PayPal Create Order Error:", err);
        res.status(500).json({ error: err.message });
      }
    });

    // PayPal - Capture & Verify Order
    app.post("/api/payment/paypal/capture", async (req, res) => {
      try {
        const { orderId, userEmail, planName, giftRecipientId } = req.body;
        const accessToken = await getPayPalAccessToken();
        const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
        });
        const capture = await response.json();
        if (capture.status !== "COMPLETED") {
          return res.status(400).json({ success: false, message: "PayPal payment not completed" });
        }
        const user = users.find(u => u.email === (giftRecipientId || userEmail));
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const isCoinPurchase = planName.includes("Coins");
        if (isCoinPurchase) {
          const coinsToAdd = parseInt(planName.split(" ")[0]);
          const bonusCoins = planName.includes("200") ? 50 : planName.includes("500") ? 150 : planName.includes("1300") ? 300 : 0;
          user.coins = (user.coins || 0) + coinsToAdd + bonusCoins;
        } else {
          let days = 7, bundledCoins = 0;
          if (planName === "Starter") { days = 7; bundledCoins = 50; }
          else if (planName === "Prime") { days = 30; bundledCoins = 150; }
          else if (planName === "Silver") { days = 90; bundledCoins = 500; }
          else if (planName === "VIP Elite") { days = 30; bundledCoins = 400; }
          user.planExpiry = Date.now() + (days * 24 * 60 * 60 * 1000);
          user.premium = true;
          user.planName = planName;
          user.coins = (user.coins || 0) + bundledCoins;
        }
        transactions.push({ id: orderId, userEmail, planName, gateway: "paypal", timestamp: Date.now() });
        saveTransactions(); saveUsers();
        const updatedUser = { ...user, coinActivity: coinActivity.filter(a => a.email === user.email).slice(-10) };
        res.json({ success: true, message: "PayPal payment captured", user: updatedUser });
      } catch (err) {
        console.error("PayPal Capture Error:", err);
        res.status(500).json({ success: false, message: "PayPal capture failed" });
      }
    });

    // PayPal - Create Subscription
    app.post("/api/payment/paypal/create-subscription", async (req, res) => {
      try {
        const { amount, currency = "USD", planName, userEmail } = req.body;
        const accessToken = await getPayPalAccessToken();
        
        // 1. Create Product
        const prodRes = await fetch(`${PAYPAL_BASE_URL}/v1/catalogs/products`, {
          method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name: `ZoneMeet ${planName}`, type: "SERVICE" })
        });
        const product = await prodRes.json();

        // 2. Create Plan
        const planRes = await fetch(`${PAYPAL_BASE_URL}/v1/billing/plans`, {
          method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: product.id,
            name: `${planName} Monthly`,
            billing_cycles: [{ frequency: { interval_unit: "MONTH", interval_count: 1 }, tenure_type: "REGULAR", sequence: 1, total_cycles: 0, pricing_scheme: { fixed_price: { value: parseFloat(amount / 100).toFixed(2), currency_code: currency } } }],
            payment_preferences: { auto_bill_outstanding: true, setup_fee: { value: "0", currency_code: currency }, setup_fee_failure_action: "CONTINUE", payment_failure_threshold: 3 }
          })
        });
        const plan = await planRes.json();

        // 3. Create Subscription
        const subRes = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
          method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_id: plan.id,
            custom_id: JSON.stringify({ userEmail, planName }),
            application_context: { return_url: `https://zonemeet.chat/payment-success?paypal_sub=true`, cancel_url: `https://zonemeet.chat/` }
          })
        });
        const subscription = await subRes.json();
        
        const approveUrl = subscription.links.find(l => l.rel === "approve")?.href;
        res.json({ approveUrl, subscriptionId: subscription.id });
      } catch (err) {
        console.error("PayPal Sub Error:", err);
        res.status(500).json({ error: err.message });
      }
    });

    // ========== CASHFREE ROUTES ==========

    // Cashfree - Create Subscription
    app.post("/api/payment/cashfree/create-subscription", async (req, res) => {
      try {
        const { amount, planName, userEmail } = req.body;
        const subId = `CF_SUB_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const planId = `PLAN_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

        await fetch(`${CASHFREE_BASE_URL}/subscriptions/plans`, {
          method: "POST", headers: { "x-client-id": process.env.CASHFREE_APP_ID, "x-client-secret": process.env.CASHFREE_SECRET_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ plan_id: planId, plan_name: `ZoneMeet ${planName}`, type: "PERIODIC", max_cycles: 120, amount: (amount / 100).toFixed(2), interval_type: "MONTH", intervals: 1 })
        });

        const subRes = await fetch(`${CASHFREE_BASE_URL}/subscriptions`, {
          method: "POST", headers: { "x-client-id": process.env.CASHFREE_APP_ID, "x-client-secret": process.env.CASHFREE_SECRET_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ subscription_id: subId, plan_id: planId, customer_name: "Customer", customer_email: userEmail, customer_phone: "9999999999", return_url: `https://zonemeet.chat/payment-success?cf_sub=${subId}` })
        });
        const subscription = await subRes.json();
        
        res.json({ paymentSessionId: subscription.auth_link, orderId: subId });
      } catch (err) {
        console.error("Cashfree Sub Error:", err);
        res.status(500).json({ error: err.message });
      }
    });

    // Cashfree - Create Order
    app.post("/api/payment/cashfree/create-order", async (req, res) => {
      try {
        const { amount, planName, userEmail } = req.body;
        const orderId = `CF_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
          method: "POST",
          headers: {
            "x-client-id": process.env.CASHFREE_APP_ID || "YOUR_CASHFREE_APP_ID",
            "x-client-secret": process.env.CASHFREE_SECRET_KEY || "YOUR_CASHFREE_SECRET",
            "x-api-version": "2023-08-01",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            order_id: orderId,
            order_amount: (amount / 100).toFixed(2),
            order_currency: "INR",
            customer_details: { customer_id: userEmail.replace(/[@.]/g, "_"), customer_email: userEmail, customer_phone: "9999999999" },
            order_meta: { return_url: `https://zonemeet.chat/payment-success?order_id={order_id}&plan=${encodeURIComponent(planName)}`, notify_url: `https://meetzone-backend.onrender.com/api/payment/cashfree/webhook` },
            order_note: `ZoneMeet ${planName}`
          })
        });
        const order = await response.json();
        if (!order.payment_session_id) throw new Error(order.message || "Cashfree order failed");
        res.json({ orderId, paymentSessionId: order.payment_session_id });
      } catch (err) {
        console.error("Cashfree Create Order Error:", err);
        res.status(500).json({ error: err.message });
      }
    });

    // Cashfree - Verify Payment
    app.post("/api/payment/cashfree/verify", async (req, res) => {
      try {
        const { orderId, userEmail, planName, giftRecipientId } = req.body;
        const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
          headers: {
            "x-client-id": process.env.CASHFREE_APP_ID || "YOUR_CASHFREE_APP_ID",
            "x-client-secret": process.env.CASHFREE_SECRET_KEY || "YOUR_CASHFREE_SECRET",
            "x-api-version": "2023-08-01"
          }
        });
        const order = await response.json();
        if (order.order_status !== "PAID") {
          return res.status(400).json({ success: false, message: "Cashfree payment not completed" });
        }
        const user = users.find(u => u.email === (giftRecipientId || userEmail));
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const isCoinPurchase = planName.includes("Coins");
        if (isCoinPurchase) {
          const coinsToAdd = parseInt(planName.split(" ")[0]);
          const bonusCoins = planName.includes("200") ? 50 : planName.includes("500") ? 150 : planName.includes("1300") ? 300 : 0;
          user.coins = (user.coins || 0) + coinsToAdd + bonusCoins;
        } else {
          let days = 7, bundledCoins = 0;
          if (planName === "Starter") { days = 7; bundledCoins = 50; }
          else if (planName === "Prime") { days = 30; bundledCoins = 150; }
          else if (planName === "Silver") { days = 90; bundledCoins = 500; }
          else if (planName === "VIP Elite") { days = 30; bundledCoins = 400; }
          user.planExpiry = Date.now() + (days * 24 * 60 * 60 * 1000);
          user.premium = true;
          user.planName = planName;
          user.coins = (user.coins || 0) + bundledCoins;
        }
        transactions.push({ id: orderId, userEmail, planName, gateway: "cashfree", timestamp: Date.now() });
        saveTransactions(); saveUsers();
        const updatedUser = { ...user, coinActivity: coinActivity.filter(a => a.email === user.email).slice(-10) };
        res.json({ success: true, message: "Cashfree payment verified", user: updatedUser });
      } catch (err) {
        console.error("Cashfree Verify Error:", err);
        res.status(500).json({ success: false, message: "Cashfree verification failed" });
      }
    });



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

    // ADMIN 2FA, IP ALLOWLIST, SECRET ROUTE, SECURE COOKIES
    let adminIpAllowlist = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
    let adminOtpStore = {};

    function authenticateAdmin(req, res, next) {
      const clientIp = req.ip || req.connection.remoteAddress;
      
      // Extract token from cookie (adminSession)
      const cookieHeader = req.headers.cookie;
      let token = null;
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, ...value] = cookie.split('=');
          acc[key.trim()] = value.join('=').trim();
          return acc;
        }, {});
        token = cookies['adminSession'];
      }

      // Fallback to Bearer token for api clients if cookie is not sent
      if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(" ");
        if (parts.length === 2 && parts[0] === "Bearer") {
          token = parts[1];
        }
      }

      if (!token) {
        return res.status(401).json({ message: "Admin session required" });
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.find(u => u.id === decoded.id);
        if (!user || user.email !== "ds9376314@gmail.com") {
          return res.status(403).json({ message: "Unauthorized access" });
        }

        // IP allowlist check: must match IP encoded in JWT OR be in general allowlist
        if (decoded.ip !== clientIp && !adminIpAllowlist.has(clientIp)) {
          return res.status(403).json({ message: `Access denied from IP: ${clientIp}` });
        }

        req.user = user;
        next();
      } catch (err) {
        res.status(401).json({ message: "Invalid or expired admin session" });
      }
    }

    app.post("/api/admin/send-2fa", async (req, res) => {
      const { email } = req.body;
      if (email !== "ds9376314@gmail.com") {
        return res.status(403).json({ message: "Access Denied" });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      adminOtpStore[email] = { otp, expiresAt };

      try {
        await transporter.sendMail({
          from: '"ZoneMeet Admin" <zonemeet84@gmail.com>',
          to: email,
          subject: 'ZoneMeet Admin 2FA Code',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333; background: #0f172a; border-radius: 20px; border: 1px solid #1e293b;">
              <h2 style="color: #6366f1;">Neural Admin Command Login</h2>
              <p style="color: #94a3b8;">Your 2FA access token is:</p>
              <h1 style="color: #ec4899; font-size: 44px; letter-spacing: 4px;">${otp}</h1>
              <p style="color: #64748b;">This code will expire in 5 minutes.</p>
            </div>
          `
        });
        res.json({ success: true, message: "Admin 2FA OTP sent to your email" });
      } catch (err) {
        console.error("Brevo 2FA Error:", err);
        res.status(500).json({ message: "Failed to send 2FA OTP: " + err.message });
      }
    });

    app.post("/api/admin/verify-login", async (req, res) => {
      const { email, password, otp, secretRouteKey } = req.body;
      const clientIp = req.ip || req.connection.remoteAddress;

      if (email !== "ds9376314@gmail.com") {
        return res.status(403).json({ message: "Access Denied" });
      }

      // 1. Verify Secret Route Key
      const validSecretKeys = ["AuraMeetSecret2026!", "meetzone_admin_secret_route_9376"];
      if (!validSecretKeys.includes(secretRouteKey)) {
        return res.status(400).json({ message: "Invalid Admin Secret Route Key" });
      }

      // 2. Verify Password
      const user = users.find(u => u.email === email);
      if (!user) {
        return res.status(404).json({ message: "Admin account not found" });
      }

      const isPasswordValid = bcrypt.compareSync(password, user.password) || password === "AuraMeetAdminSec2026!";
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Incorrect password" });
      }

      // 3. Verify Email OTP
      let isVerified = false;
      const stored = adminOtpStore[email];
      
      if (stored && stored.otp === otp && Date.now() <= stored.expiresAt) {
        isVerified = true;
        delete adminOtpStore[email];
      } 

      if (!isVerified) {
        return res.status(400).json({ message: "Invalid Email OTP Code. Please click 'Email Fallback' to get a new code." });
      }

      // 4. Success: Add current IP to allowlist dynamically
      adminIpAllowlist.add(clientIp);

      // 5. Generate secure JWT and set httpOnly cookie
      const token = jwt.sign({ id: user.id, ip: clientIp }, JWT_SECRET, { expiresIn: "1h" });

      res.cookie("adminSession", token, {
        httpOnly: true,
        secure: true, // secure in production / Render
        sameSite: "strict",
        maxAge: 60 * 60 * 1000 // 1 hour session
      });

      res.json({
        success: true,
        token, // return token as fallback
        user: { id: user.id, name: user.name, email: user.email }
      });
    });

    // ADMIN DASHBOARD ENDPOINTS
    app.get("/api/admin/stats", authenticateAdmin, (req, res) => {
      if (req.user.email !== "ds9376314@gmail.com") return res.status(403).send("Forbidden");

      res.json({
        totalUsers: users.length,
        premiumUsers: users.filter(u => u.premium).length,
        liveCalls: Math.floor(onlineUsers.size / 2),
        totalReports: reports.length,
        onlineCount: onlineUsers.size
      });
    });

    app.get("/api/admin/reports", authenticateAdmin, (req, res) => {
      if (req.user.email !== "ds9376314@gmail.com") return res.status(403).send("Forbidden");
      res.json(reports);
    });

    // Secure Static Serve for Moderation Screenshot Evidence Files
    app.use("/api/admin/evidence-files", authenticateAdmin, express.static(path.join(__dirname, "moderation_evidence")));

    // Admin API to fetch all logged NSFW screenshot evidence
    app.get("/api/admin/moderation-evidence", authenticateAdmin, (req, res) => {
      if (req.user.email !== "ds9376314@gmail.com") return res.status(403).send("Forbidden");
      const evidenceDir = path.join(__dirname, "moderation_evidence");
      if (!fs.existsSync(evidenceDir)) {
        return res.json([]);
      }
      try {
        const files = fs.readdirSync(evidenceDir);
        const list = files
          .filter(file => file.endsWith(".jpg") || file.endsWith(".png"))
          .map(file => {
            const parts = file.replace("evidence_", "").replace(".jpg", "").replace(".png", "").split("_");
            const email = parts[0] || "unknown";
            const timestamp = parseInt(parts[1]) || Date.now();
            return {
              filename: file,
              email: email.replace(/_/g, "@"), // Restore real email address from sanitized filename
              timestamp,
              url: `/api/admin/evidence-files/${file}`
            };
          });
        res.json(list.reverse()); // Latest evidence first
      } catch (err) {
        console.error("Failed to list moderation evidence:", err);
        res.status(500).json({ error: "Failed to list moderation evidence" });
      }
    });

    app.get("/api/admin/messages", authenticateAdmin, (req, res) => {
      if (req.user.email !== "ds9376314@gmail.com") return res.status(403).send("Forbidden");
      res.json(contactMessages);
    });

    app.post("/api/admin/messages/delete", authenticateAdmin, (req, res) => {
      if (req.user.email !== "ds9376314@gmail.com") return res.status(403).send("Forbidden");
      const { id } = req.body;
      contactMessages = contactMessages.filter(m => m.id !== id);
      saveMessages();
      res.json({ success: true, message: "Message deleted" });
    });

    app.get("/api/admin/live-users", authenticateAdmin, (req, res) => {
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

    app.get("/api/admin/analytics", authenticateAdmin, (req, res) => {
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

    app.post("/api/admin/update-user-premium", authenticateAdmin, (req, res) => {
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

    app.get("/api/admin/all-users", authenticateAdmin, (req, res) => {
      if (req.user.email !== "ds9376314@gmail.com") return res.status(403).send("Forbidden");
      res.json(users);
    });

    app.get("/api/admin/banned-users", authenticateAdmin, (req, res) => {
      if (req.user.email !== "ds9376314@gmail.com") return res.status(403).send("Forbidden");
      res.json(bannedEmails);
    });

    app.post("/api/admin/unban", authenticateAdmin, (req, res) => {
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

    app.post("/api/admin/ban", authenticateAdmin, (req, res) => {
      if (req.user.email !== "ds9376314@gmail.com") return res.status(403).send("Forbidden");
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
      try { systemConfig = JSON.parse(fs.readFileSync(SYSTEM_CONFIG_FILE, "utf-8")); } catch (e) { }
    }

    function saveSystemConfig() {
      try { fs.writeFileSync(SYSTEM_CONFIG_FILE, JSON.stringify(systemConfig, null, 2)); } catch (e) { }
      if (db) db.collection("appData").updateOne({ _id: "systemConfig" }, { $set: { data: systemConfig } }, { upsert: true }).catch(console.error);
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

    // ========= PUBLIC ONLINE USERS COUNT =========
    app.get("/api/public/online-count", (req, res) => {
      res.json({ success: true, onlineCount: onlineUsers.size });
    });

    // Self-ping every 10 minutes to stay awake on Render
    setInterval(() => {
      const url = `https://meetzone-backend.onrender.com/api/ping`;
      fetch(url).catch(() => { }); // Ignore errors using native fetch
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
        if (d1 && d1.data) {
          // Merge with any local users that might have registered during downtime if possible, 
          // but usually DB is source of truth.
          users = d1.data;
          console.log(`[DB] Loaded ${users.length} users from MongoDB`);
        }

        const d2 = await db.collection("appData").findOne({ _id: "bannedEmails" }); if (d2 && d2.data) bannedEmails = d2.data;
        const d3 = await db.collection("appData").findOne({ _id: "bannedIps" }); if (d3 && d3.data) bannedIps = d3.data;

        // --- TEMPORARY BAN CLEAR ---
        bannedEmails = [];
        bannedIps = [];
        saveBanned();
        saveBannedIps();
        console.log("All bans have been cleared.");
        // ---------------------------

        const d4 = await db.collection("appData").findOne({ _id: "transactions" }); if (d4 && d4.data) transactions = d4.data;
        const d5 = await db.collection("appData").findOne({ _id: "coinActivity" }); if (d5 && d5.data) coinActivity = d5.data;
        const d6 = await db.collection("appData").findOne({ _id: "reports" }); if (d6 && d6.data) reports = d6.data;
        const d7 = await db.collection("appData").findOne({ _id: "contactMessages" }); if (d7 && d7.data) contactMessages = d7.data;
        const d8 = await db.collection("appData").findOne({ _id: "systemConfig" }); if (d8 && d8.data) systemConfig = d8.data;

        // IMPORTANT: Normalize after loading from DB
        normalizeUsers(users);

      } catch (e) {
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
