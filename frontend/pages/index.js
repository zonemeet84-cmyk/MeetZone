import PremiumModal from "../components/PremiumModal";
import ZoneMeetLogo from "../components/ZoneMeetLogo";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Head from "next/head";
import Image from "next/image";
import Script from "next/script";
import { useRouter } from "next/router";
import axios from "axios";
import { useSession, signOut } from "next-auth/react";
import { isSiteAdmin } from "../lib/admin";
import io from "socket.io-client";

let socket;

// A lightweight static mapping of country names to ISO-2 codes
const countryNameToCode = {
  "afghanistan": "af", "albania": "al", "algeria": "dz", "american samoa": "as", "andorra": "ad",
  "angola": "ao", "anguilla": "ai", "antarctica": "aq", "antigua and barbuda": "ag", "argentina": "ar",
  "armenia": "am", "aruba": "aw", "australia": "au", "austria": "at", "azerbaijan": "az",
  "bahamas": "bs", "bahrain": "bh", "bangladesh": "bd", "barbados": "bb", "belarus": "by",
  "belgium": "be", "belize": "bz", "benin": "bj", "bermuda": "bm", "bhutan": "bt",
  "bolivia": "bo", "bosnia and herzegovina": "ba", "botswana": "bw", "brazil": "br", "brunei": "bn",
  "bulgaria": "bg", "burkina faso": "bf", "burundi": "bi", "cambodia": "kh", "cameroon": "cm",
  "canada": "ca", "cape verde": "cv", "cayman islands": "ky", "central african republic": "cf", "chad": "td",
  "chile": "cl", "china": "cn", "colombia": "co", "comoros": "km", "congo": "cg",
  "costa rica": "cr", "croatia": "hr", "cuba": "cu", "cyprus": "cy", "czech republic": "cz",
  "denmark": "dk", "djibouti": "dj", "dominica": "dm", "dominican republic": "do", "ecuador": "ec",
  "egypt": "eg", "el salvador": "sv", "equatorial guinea": "gq", "eritrea": "er", "estonia": "ee",
  "ethiopia": "et", "fiji": "fj", "finland": "fi", "france": "fr", "gabon": "ga",
  "gambia": "gm", "georgia": "ge", "germany": "de", "ghana": "gh", "greece": "gr",
  "grenada": "gd", "guatemala": "gt", "guinea": "gn", "guyana": "gy", "haiti": "ht",
  "honduras": "hn", "hong kong": "hk", "hungary": "hu", "iceland": "is", "india": "in",
  "indonesia": "id", "iran": "ir", "iraq": "iq", "ireland": "ie", "israel": "il",
  "italy": "it", "jamaica": "jm", "japan": "jp", "jordan": "jo", "kazakhstan": "kz",
  "kenya": "ke", "kiribati": "ki", "kuwait": "kw", "kyrgyzstan": "kg", "laos": "la",
  "latvia": "lv", "lebanon": "lb", "lesotho": "ls", "liberia": "lr", "libya": "ly",
  "liechtenstein": "li", "lithuania": "lt", "luxembourg": "lu", "macau": "mo", "macedonia": "mk",
  "madagascar": "mg", "malawi": "mw", "malaysia": "my", "maldives": "mv", "mali": "ml",
  "malta": "mt", "mauritania": "mr", "mauritius": "mu", "mexico": "mx", "micronesia": "fm",
  "moldova": "md", "monaco": "mc", "mongolia": "mn", "montenegro": "me", "morocco": "ma",
  "mozambique": "mz", "myanmar": "mm", "namibia": "na", "nepal": "np", "netherlands": "nl",
  "new zealand": "nz", "nicaragua": "ni", "niger": "ne", "nigeria": "ng", "norway": "no",
  "oman": "om", "pakistan": "pk", "palestine": "ps", "panama": "pa", "papua new guinea": "pg",
  "paraguay": "py", "peru": "pe", "philippines": "ph", "poland": "pl", "portugal": "pt",
  "puerto rico": "pr", "qatar": "qa", "romania": "ro", "russia": "ru", "rwanda": "rw",
  "samoa": "ws", "san marino": "sm", "saudi arabia": "sa", "senegal": "sn", "serbia": "rs",
  "seychelles": "sc", "sierra leone": "sl", "singapore": "sg", "slovakia": "sk", "slovenia": "si",
  "somalia": "so", "south africa": "za", "spain": "es", "sri lanka": "lk", "sudan": "sd",
  "suriname": "sr", "swaziland": "sz", "sweden": "se", "switzerland": "ch", "syria": "sy",
  "taiwan": "tw", "tajikistan": "tj", "tanzania": "tz", "thailand": "th", "timor-leste": "tl",
  "togo": "tg", "tonga": "to", "trinidad and tobago": "tt", "tunisia": "tn", "turkey": "tr",
  "turkmenistan": "tm", "uganda": "ug", "ukraine": "ua", "united arab emirates": "ae",
  "united kingdom": "gb", "united states": "us", "uruguay": "uy", "uzbekistan": "uz",
  "vanuatu": "vu", "vatican": "va", "venezuela": "ve", "vietnam": "vn", "yemen": "ye",
  "zambia": "zm", "zimbabwe": "zw"
};

// Helper to get Country Flag Image URL from name or ISO code
const getFlagUrl = (countryInput) => {
  if (!countryInput) return null;
  let code = countryInput;
  if (countryInput.length !== 2) {
    const key = countryInput.toLowerCase();
    code = countryNameToCode[key] || null;
    if (!code) return null;
  }
  return `https://flagcdn.com/w20/${code.toLowerCase()}.png`;
};

function getHeaderSubscriptionLabel(user) {
  if (!user?.premium) return null;
  const planName = String(user.planName || "").trim();
  if (!planName || planName.toLowerCase() === "free") return null;
  if (user.planExpiry && !user.isPermanentPremium && Date.now() > Number(user.planExpiry)) return null;
  return planName;
}

export default function Dashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    gender: "Male",
    countryCode: "IN",
    stateCode: "",
    age: "18-24"
  });
  const [countriesList, setCountriesList] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [banInfo, setBanInfo] = useState(null); // { reason, screenshot }
  const [isOnline, setIsOnline] = useState(true); // Default to true

  useEffect(() => {
    // Sync with browser's online status
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      if (socket) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) {
      socket = io("https://api.zonemeet.chat");
    }

    const handleConnect = () => {
      setIsSocketConnected(true);
      if (user && user.id) socket.emit("register-user", user.id);
      console.log("Global Socket Connected");
    };

    const handleDisconnect = () => setIsSocketConnected(false);
    const handleOnlineCount = (count) => setOnlineCount(count || 1);

    const handleIncoming = (callInfo) => setIncomingCall(callInfo);
    const handleAccepted = ({ roomId }) => router.push(`/chat?room=${roomId}`);
    const handleRejected = () => alert("Call was declined.");

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("global-online-count", handleOnlineCount);
    
    socket.on("incoming-direct-call", handleIncoming);
    socket.on("direct-call-accepted", handleAccepted);
    socket.on("direct-call-rejected", handleRejected);

    // Ban alert handler
    const handleBanned = (data) => {
      const reason = typeof data === "object" ? (data.reason || "Your account has been banned for violating our safety terms.") : data;
      const screenshot = typeof data === "object" ? (data.screenshot || null) : null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setBanInfo({ reason, screenshot });
    };
    socket.on("banned-alert", handleBanned);

    if (socket.connected) handleConnect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("global-online-count", handleOnlineCount);
      socket.off("incoming-direct-call", handleIncoming);
      socket.off("direct-call-accepted", handleAccepted);
      socket.off("direct-call-rejected", handleRejected);
      socket.off("banned-alert", handleBanned);
    };
  }, [user]);

  const acceptCall = () => {
    if (incomingCall) {
      socket.emit("direct-call-accept", { toSocketId: incomingCall.fromSocketId, roomId: incomingCall.roomId });
      router.push(`/chat?room=${incomingCall.roomId}`);
      setIncomingCall(null);
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      socket.emit("direct-call-reject", { toSocketId: incomingCall.fromSocketId });
      setIncomingCall(null);
    }
  };

  const [currency, setCurrency] = useState("INR");
  useEffect(() => {
    if (user?.country) {
      if (user.country !== "India" && user.country !== "IN") {
        setCurrency("USD");
      } else {
        setCurrency("INR");
      }
    }
  }, [user?.country]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentStep, setPaymentStep] = useState("methods");
  const [showProfileDrop, setShowProfileDrop] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [news, setNews] = useState([]);
  const [dailyStatus, setDailyStatus] = useState(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (showProfileDrop && news.length === 0) {
      axios.get("https://api.zonemeet.chat/api/news")
        .then(res => setNews(res.data))
        .catch(err => console.error("Failed to load news", err));
    }
  }, [showProfileDrop]);

  useEffect(() => {
    const updateViewport = () => setIsMobileView(window.innerWidth <= 768);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!showProfileDrop || !isMobileView) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [showProfileDrop, isMobileView]);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCoinPopup, setShowCoinPopup] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(0);
  const [purchaseFeature, setPurchaseFeature] = useState("");
  const [referralStats, setReferralStats] = useState(null);
  const [referralCopied, setReferralCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [isGifting, setIsGifting] = useState(false);
  const [isAutoRenew, setIsAutoRenew] = useState(false);
  const [giftRecipientId, setGiftRecipientId] = useState("");
  const [incomingCall, setIncomingCall] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(5248);

  // The fetchOnlineCount REST API interval has been removed.
  // Online count is now dynamically driven by real-time WebSocket events.

  // ZoneMeetBot State
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [botMessages, setBotMessages] = useState([
    { text: "Hi there! I'm ZoneMeetBot 🤖. I know everything about this platform. Ask me about Coins, VIP Elite, Rules, or how to Video Chat!", sender: "bot" }
  ]);
  const [botInput, setBotInput] = useState("");
  const botEndRef = useRef(null);

  // 2FA Setup State
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [setupError, setSetupError] = useState("");

  // Leaderboard State
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardFilter, setLeaderboardFilter] = useState('all'); // 'all' or 'india'
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [showRewardsInfo, setShowRewardsInfo] = useState(false);
  const [leaderboardMonth, setLeaderboardMonth] = useState("");
  const [leaderboardComingSoon, setLeaderboardComingSoon] = useState(null); // { current, target }

  const fetchLeaderboard = async (filterType = leaderboardFilter) => {
    setLeaderboardLoading(true);
    try {
      const res = await axios.get(`https://api.zonemeet.chat/api/user/leaderboard?filter=${filterType}&email=${user?.email || ''}`);
      if (res.data.success) {
        if (res.data.comingSoon) {
          setLeaderboardComingSoon({ current: res.data.currentCount, target: res.data.targetCount });
        } else {
          setLeaderboardComingSoon(null);
          setLeaderboardData(res.data.leaderboard);
          setLeaderboardMonth(res.data.month);
        }
      }
    } catch (err) {
      console.error("Leaderboard Fetch Error", err);
    }
    setLeaderboardLoading(false);
  };

  useEffect(() => {
    if (isLeaderboardOpen) {
      fetchLeaderboard();
    }
  }, [isLeaderboardOpen, leaderboardFilter]);

  const [reconnectConfirm, setReconnectConfirm] = useState(null);
  const [historyReportTarget, setHistoryReportTarget] = useState(null);
  const [showHistoryReportModal, setShowHistoryReportModal] = useState(false);
  const [historyReportReason, setHistoryReportReason] = useState('');
  const [historyReportDetails, setHistoryReportDetails] = useState('');

  // Premium Modal State
  const [premiumModal, setPremiumModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    confirmText: "OK",
    cancelText: "",
    onConfirm: null
  });

  const showModal = (config) => {
    setPremiumModal({
      isOpen: true,
      title: config.title || "Message",
      message: config.message || "",
      type: config.type || "info",
      confirmText: config.confirmText || "OK",
      cancelText: config.cancelText || "",
      onConfirm: config.onConfirm || null
    });
  };

  const hideModal = () => setPremiumModal(prev => ({ ...prev, isOpen: false }));

  const handleBotSubmit = (e) => {
    e.preventDefault();
    if (!botInput.trim()) return;

    const userMsg = botInput.trim();
    setBotMessages(prev => [...prev, { text: userMsg, sender: "user" }]);
    setBotInput("");

    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      const isHindi = /\b(bhai|kya|kaise|hai|hu|ka|ke|ki|aur|magar|lekin|dost|paisa|acha|thik|mera|aap|tum|karo|raha|rahi|tha|thi)\b/i.test(lower);
      const matches = (keywords) => keywords.some(k => lower.includes(k));

      const KNOWLEDGE = {
        coins: {
          keywords: ['coin', 'paisa', 'money', 'balance', 'buy', 'kharid', 'token', 'recharge', 'store', 'kamaye', 'free'],
          en: "ZoneMeet Coins are the currency of our world! 🪙 You can earn them by: 1. Inviting friends (100 coins each), 2. Daily Login Streaks (up to 100 coins), 3. Buying bundles in the Store. Use them for Boosts, Mystery Boxes, or Reconnecting!",
          hi: "ZoneMeet Coins humari currency hai! 🪙 Aap inhe kama sakte hain: 1. Doston ko invite karke (100 coins), 2. Daily Login karke (7 din pe 100 coins), 3. Store se kharid kar. Inse aap Mystery Boxes khol sakte hain ya profile boost kar sakte hain!"
        },
        vip: {
          keywords: ['vip', 'premium', 'elite', 'plan', 'membership', 'filter', 'gender', 'country', 'age', 'pricing', 'starter', 'prime', 'silver', 'price', 'kharch', 'subscription'],
          en: "Our Premium Plans are designed for the best experience: \n\n✨ **Starter (₹149 / 7 days):** Gender & Country filters, priority matching, unlimited friends, 50 coins.\n🚀 **Prime (₹599 / 30 days):** Same filters + auto-translate, stronger priority, 150 coins.\n💎 **Silver (₹1599 / 90 days):** All Prime perks + badge, 500 coins.\n👑 **VIP Elite (₹999 / 30 days):** Gender, Country, State & Age filters + avatars/voice/privacy tools, 400 coins. \n\nCheck the 'Pricing' section for full details!",
          hi: "Humare VIP plans: \n\n✨ **Starter (₹149 / 7 din):** Gender & Country filter, priority matching, unlimited friends, 50 coins.\n🚀 **Prime (₹599 / 30 din):** Wahi filters + auto-translate, zyada priority, 150 coins.\n💎 **Silver (₹1599 / 90 din):** Prime ke saare fayde + badge, 500 coins.\n👑 **VIP Elite (₹999 / 30 din):** Gender, Country, State & Age + elite tools, 400 coins. \n\nPoori detail 'Pricing' section mein hai!"
        },
        mystery: {
          keywords: ['box', 'mystery', 'gift', 'dabba', 'reward', 'win', 'bronze', 'silver', 'gold', 'luck', 'chest'],
          en: "Try your luck with Mystery Boxes! 📦 Bronze (50 coins), Silver (150 coins), and the Legendary Golden Chest (500 coins). The **Golden Chest** is high-tier—it has NO coins and NO losses, meaning you always win a premium Boost or VIP Elite pass!",
          hi: "Mystery Boxes se prizes jeetein! 📦 Bronze (50 coins), Silver (150 coins), aur Legendary Gold Box (500 coins). **Gold Box** sabse khaas hai—isme koi loss nahi hota aur coins ki jagah hamesha bade prizes jaise VIP ya Boost milta hai!"
        },
        leaderboard: {
          keywords: ['leaderboard', 'rank', 'top', 'spender', 'hall of fame', 'monthly', 'prize', 'reward', 'paisa milega', '1st', '2nd', '3rd', 'reset'],
          en: "The **Hall of Fame** ranks the top coin spenders monthly! 🏆 Top 3 players win massive prizes: #1 gets 1000 Coins, #2 gets 500 Coins, and #3 gets 200 Coins. Rankings reset every month. Click 'Show Rewards' in the leaderboard to see more!",
          hi: "Leaderboard (Hall of Fame) mein har mahine top spenders ko prizes milte hain! 🏆 Rank #1 ko 1000 Coins, #2 ko 500, aur #3 ko 200 Coins milte hain mahina khatam hone par. Rankings har mahine reset hoti hain!"
        },
        video: {
          keywords: ['video', 'chat', 'start', 'call', 'match', 'peer', 'secure', 'camera', 'mic'],
          en: "Click 'Start Video Chat' to match instantly! Use 'Next' to skip, 'Stop' to end the search, or 'Add Friend' to stay in touch for free later.",
          hi: "Video chat shuru karne ke liye 'Start Video Chat' dabayein. 'Next' se partner badlein, 'Stop' se matching rokein, aur 'Add Friend' se unhe hamesha ke liye dost banayein!"
        },
        friends: {
          keywords: ['friend', 'add', 'baat', 'dost', 'list', 'accept', 'request', 'direct', 'online'],
          en: "Accepted friends appear in your Friends Tab. You can see their online status and Direct Call them for **FREE** anytime! No coins required for calling friends.",
          hi: "Jab koi friend request accept kar leta hai, toh vo list mein dikhta hai. Aap unhe kabhi bhi FREE mein Direct Call kar sakte hain!"
        },
        safety: {
          keywords: ['ban', 'report', 'safe', 'rule', 'nude', 'bad', 'block', 'ganda', 'safety', 'guardian', 'harass'],
          en: "Safety is #1! 🛡️ Our AI Guardian monitors calls. Harassment or 18+ content results in a permanent ban. Report users using the 🚩 button to keep the community safe.",
          hi: "Safety humari priority hai! 🛡️ Ganda kaam karne walo ko AI Guardian turant ban kar deta hai. Kisi ko report karne ke liye 🚩 button dabayein."
        },
        referral: {
          keywords: ['refer', 'invite', 'earn', 'code', 'link', 'friend', 'share', 'gift', 'bonus'],
          en: "Get **100 Coins FREE** for every friend who joins! 🎯 Share your referral link from the 'Invite & Earn' section. When they join, your coins are added instantly.",
          hi: "Doston ko bulane par **100 Coins FREE** paayein! 🎯 Apna referral link 'Invite & Earn' section se share karein, aur coins turant paayein."
        },
        daily: {
          keywords: ['daily', 'streak', 'reward', 'bonus', 'claim', 'day', 'free coins', 'login bonus', 'streak broke'],
          en: "Login daily to maintain your streak! 🔥 Day 1-6 give small rewards, and Day 7 gives a **100 Coins Grand Prize**. If your streak breaks, you can save it for 50 coins!",
          hi: "Roz login karein aur streak banayein! 🔥 7 din tak lagaatar aane par **100 Coins** milte hain. Agar streak toot jaye, toh 50 coins dekar bachai ja sakti hai!"
        },
        stop: {
          keywords: ['stop', 'matching', 'wait', 'cancel', 'matching ruk', 'matching stop'],
          en: "You can use the **🛑 Stop** button during matching if you want to take a break or change your filters.",
          hi: "Matching ke waqt aap **🛑 Stop** button use kar sakte hain agar aap thoda break lena chahte hain."
        },
        history: {
          keywords: ['history', 'recent', 'connections', 'missed', 'reconnect'],
          en: "Missed someone? Check your **Recent Connections** icon. You can request to Reconnect for only 30 coins!",
          hi: "Agar koi miss ho jaye, toh 'Recent Connections' mein jaake 30 coins mein firse connect kar sakte hain!"
        }
      };

      let reply = isHindi
        ? "Main ZoneMeet AI hoon. Main aapki Coins, VIP, Mystery Boxes, Safety, ya Friends system mein help kar sakta hoon. Aap kya puchna chahte hain?"
        : "I am ZoneMeet AI. I can help you with Coins, VIP Plans, Mystery Boxes, Safety rules, or the Friends system. What would you like to know?";

      // Iterate through knowledge base
      for (const key in KNOWLEDGE) {
        if (matches(KNOWLEDGE[key].keywords)) {
          reply = isHindi ? KNOWLEDGE[key].hi : KNOWLEDGE[key].en;
          break;
        }
      }

      setBotMessages(prev => [...prev, { text: reply, sender: "bot" }]);
    }, 800);
  };

  useEffect(() => {
    if (botMessages.length > 1) {
      const timer = setTimeout(() => {
        setBotMessages([
          { text: "Hi there! I'm ZoneMeetBot 🤖. I know everything about this platform. Ask me about Coins, VIP Elite, Rules, or how to Video Chat!", sender: "bot" }
        ]);
      }, 300000); // 5 minutes in ms
      return () => clearTimeout(timer);
    }
  }, [botMessages]);

  useEffect(() => {
    if (botEndRef.current) botEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [botMessages, isBotOpen]);

  const localVideo = useRef(null);

  // Capture referral code from URL and save to localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("referral", ref);
    }
  }, []);

  // Stripe verify-subscription removed — Stripe gateway is no longer active.

  useEffect(() => {
    // Removed auto-success timer to prevent free subscriptions
  }, [paymentStep]);

  useEffect(() => {
    if (window.location.hash === "#pricing-section") {
      const element = document.getElementById("pricing-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }

    // Sync state across tabs / same page navigation
    const handleStorage = (e) => {
      if (e.key === "user" && e.newValue) {
        setUser(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", handleStorage);

    const timerInterval = setInterval(() => setCurrentTime(Date.now()), 1000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(timerInterval);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Wake up the backend immediately
    axios.get("https://api.zonemeet.chat/api/ping").catch(() => { });

    const checkAuth = async () => {
      // 0. IMMEDIATE CACHE LOAD (Fast UI)
      const stored = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
      if (stored && stored.email) {
        console.log("Found stored user, displaying immediately");
        setUser(stored);
        setAuthLoading(false);
      }

      const token = localStorage.getItem("token");

      if (session) {
        if (!token || token === "undefined") {
          try {
            const referralCode = localStorage.getItem("referral") || undefined;
            const res = await axios.post("https://api.zonemeet.chat/api/auth/session-login", {
              email: session.user.email,
              name: session.user.name,
              referralCode
            });
            if (res.data.token) {
              localStorage.setItem("token", res.data.token);
              localStorage.setItem("user", JSON.stringify(res.data.user));
              localStorage.removeItem("referral");
              setUser(res.data.user);
            }
          } catch (e) {
            console.error("Sync Error", e);
          }
        } else {
          try {
            const res = await axios.get("https://api.zonemeet.chat/api/auth/verify", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.valid) {
              const userData = res.data.user;
              if (userData.email === "ds9376314@gmail.com") {
                userData.premium = true;
                userData.planName = "VIP Elite";
              }
              setUser(userData);
              localStorage.setItem("user", JSON.stringify(userData));
            }
          } catch (e) {
            console.error("Verify Error", e);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
            router.push("/login");
          }
        }
      } else if (token && token !== "undefined") {
        try {
          const res = await axios.get("https://api.zonemeet.chat/api/auth/verify", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data.valid) {
            const userData = res.data.user;
            if (userData.email === "ds9376314@gmail.com") {
              userData.premium = true;
              userData.planName = "VIP Elite";
            }
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
          }
        } catch (err) {
          console.error("Verify Error", err);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          router.push("/login");
        }
      }

      setAuthLoading(false);
    };

    // Fallback: If auth takes more than 4 seconds, force hide the loader
    const timeout = setTimeout(() => setAuthLoading(false), 4000);

    checkAuth();
    return () => clearTimeout(timeout);
  }, [session]);

  useEffect(() => {
    if (user && !authLoading) {
      // Only show onboarding if not already completed and profile fields are missing/default
      if (!user.onboardingCompleted) {
        if (!user.gender || user.gender === "Other" || !user.country || user.country === "Unknown" || user.gender === "All") {
          setShowOnboarding(true);
        }
      }
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (showOnboarding && countriesList.length === 0) {
      import("country-state-city").then(({ Country, State }) => {
        setCountriesList(Country.getAllCountries());
        setStatesList(State.getStatesOfCountry(onboardForm.countryCode || "IN"));
      });
    }
  }, [showOnboarding]);

  useEffect(() => {
    if (user && (user.email || user.phone) && !dailyStatus) {
      axios.post("https://api.zonemeet.chat/api/user/daily-check", { email: user.email, phone: user.phone })
        .then(res => {
          if (res.data.success) {
            setDailyStatus(res.data);
            if (
              res.data.status === "streak_broken" ||
              res.data.status === "eligible"
            ) {
              setShowStreakModal(true);
            }
            if (res.data.coins !== user.coins || res.data.streak_day !== user.streak_day || res.data.streak !== user.streak || res.data.coinActivity || res.data.canCollect !== !user.bonusClaimedToday) {
              const updated = { 
                ...user, 
                coins: res.data.coins, 
                streak_day: res.data.streak_day || user.streak_day,
                streak: res.data.streak_day || user.streak, 
                streak_broken: res.data.streak_broken || false,
                coinActivity: res.data.coinActivity || user.coinActivity,
                bonusClaimedToday: !res.data.canCollect
              };
              setUser(updated);
              localStorage.setItem("user", JSON.stringify(updated));
            }
          }
        })
        .catch(err => console.error("Daily Check Error", err));
    }
  }, [user, dailyStatus]);

  // Redirect if NOT logged in (Protected Page Logic)
  useEffect(() => {
    if (authLoading) return; // Wait for verification

    const token = localStorage.getItem("token");
    if (!session && (!token || token === "undefined")) {
      // router.push("/login"); // Optional: Redirect to login if not authenticated
    }
  }, [session, authLoading]);

  // Fetch referral stats when user is loaded
  useEffect(() => {
    const fetchReferral = async () => {
      const token = localStorage.getItem("token");
      if (user && token && !referralStats) {
        try {
          const res = await axios.get("https://api.zonemeet.chat/api/referral/stats", {
            headers: { Authorization: `Bearer ${token}` }
          });
          setReferralStats(res.data);
        } catch (err) {
          console.warn("Referral stats fetch failed, using fallback.");
          setReferralStats({
            referralCode: user.referralCode || "PENDING",
            referralCount: user.referralCount || 0,
            referralCoinsEarned: user.referralCoinsEarned || 0
          });
        }
      }
    };
    fetchReferral();
  }, [user, referralStats]);

  const collectDailyReward = async () => {
    try {
      const res = await axios.post("https://api.zonemeet.chat/api/user/collect-daily-reward", { email: user.email, phone: user.phone });
      if (res.data.success) {
        const updated = { 
          ...user, 
          coins: res.data.coins, 
          streak_day: res.data.streak_day || res.data.streak,
          streak: res.data.streak || res.data.streak_day, 
          streak_broken: false,
          bonusClaimedToday: true 
        };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        setDailyStatus({ ...dailyStatus, canCollect: false, streak_day: res.data.streak_day || res.data.streak, streak_broken: false });
        setShowStreakModal(false);
        // Show a toast-style success
        showModal({
          message: `✅ ${res.data.message} Your new balance: ${res.data.coins} coins.`,
          type: "success"
        });
      } else {
        showModal({ message: res.data.message || "Could not collect reward.", type: "info" });
      }
    } catch (err) {
      showModal({ message: err.response?.data?.message || "Failed to collect reward.", type: "error" });
    }
  };

  const buyFeature = async (featureName, cost) => {
    if (!user) {
      router.push("/login");
      return;
    }
    const isAdmin = user.email === "ds9376314@gmail.com";

    // Standard coin check
    if (!isAdmin && user.coins < cost) {
      showModal({
        title: "Insufficient Coins",
        message: `You need ${cost} coins to activate ${featureName}. Would you like to buy more?`,
        type: "warning",
        confirmText: "Buy Coins",
        cancelText: "Cancel",
        onConfirm: () => {
          hideModal();
          const storeElement = document.getElementById("store-section");
          if (storeElement) storeElement.scrollIntoView({ behavior: "smooth" });
        }
      });
      return;
    }

    // Confirmation Modal
    showModal({
      title: isAdmin ? "Admin Activation" : `Activate ${featureName}?`,
      message: isAdmin
        ? `As Admin, you can activate ${featureName} for free.`
        : `This will deduct ${cost} coins from your balance. Ready to proceed?`,
      type: "question",
      confirmText: "Yes, Activate!",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          // Show processing state in the message or modal if needed
          // For now, just proceed with the call
          const res = await axios.post('https://api.zonemeet.chat/api/user/spend-coins', {
            email: user.email,
            amount: isAdmin ? 0 : cost,
            feature: featureName.toLowerCase().replace(/\s+/g, '_')
          });

          if (res.data.success) {
            // Update local state immediately
            const updatedUser = {
              ...user,
              coins: res.data.coins,
              unlockedFilters: res.data.unlockedFilters || user.unlockedFilters,
              hasSecretIdentity: res.data.hasSecretIdentity || user.hasSecretIdentity,
              boostExpiry: res.data.boostExpiry || user.boostExpiry
            };

            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));

            // Success feedback
            showModal({
              title: "Success!",
              message: isAdmin
                ? `${featureName} has been activated via Admin Privileges.`
                : `Successfully activated ${featureName}! ${cost} coins deducted.`,
              type: "success",
              confirmText: "Awesome!",
              onConfirm: () => hideModal()
            });
          } else {
            showModal({
              message: res.data.message || "Failed to process request.",
              type: "error"
            });
          }
        } catch (err) {
          console.error("Purchase Error:", err);
          showModal({
            title: "Error",
            message: err.response?.data?.message || `Failed to activate ${featureName}. Please check your connection.`,
            type: "error"
          });
        }
      }
    });
  };

  const handleRedeemReferral = async () => {
    if (!redeemCode.trim()) return showModal({ message: "Please enter a code.", type: "warning" });

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("https://api.zonemeet.chat/api/referral/redeem", {
        referralCode: redeemCode
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const updatedUser = { ...user, coins: res.data.user.coins, referredBy: res.data.user.referredBy, coinActivity: res.data.user.coinActivity };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setRedeemCode("");
        // Notify other tabs
        window.dispatchEvent(new Event("storage"));
        showModal({
          title: "Referral Applied!",
          message: res.data.message,
          type: "success"
        });
      }
    } catch (err) {
      showModal({
        message: err.response?.data?.message || "Failed to redeem code.",
        type: "error"
      });
    }
  };
  const [showBoxInfo, setShowBoxInfo] = useState(false);
  const [revealPrize, setRevealPrize] = useState(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const [spinnerItem, setSpinnerItem] = useState("❓");
  const [confirmOpen, setConfirmOpen] = useState(null);

  const handleOpenBox = async (type) => {
    if (!user) return router.push("/login");
    const isAdmin = user.email === "ds9376314@gmail.com";
    const prices = { bronze: 50, silver: 150, gold: 500 };
    const price = prices[type];

    if (!isAdmin && user.coins < price) {
      return showModal({ message: `Insufficient coins! You need ${price} coins to open this box.`, type: "warning" });
    }

    setConfirmOpen(type);
  };

  const startOpeningFlow = async (type) => {
    setConfirmOpen(null);
    setShowSpinner(true);
    const possiblePrizes = {
      bronze: ["20 Coins", "5 Mins Boost", "1 Hour VIP", "Better luck!"],
      silver: ["60 Coins", "20 Mins Boost", "6 Hours VIP", "Better luck!"],
      gold: ["1 Hour Boost", "2 Days VIP Elite"]
    };

    const items = possiblePrizes[type];
    let spinCount = 0;
    const spinInterval = setInterval(() => {
      setSpinnerItem(items[Math.floor(Math.random() * items.length)]);
      spinCount++;
      if (spinCount > 20) clearInterval(spinInterval);
    }, 100);

    try {
      const res = await axios.post("https://api.zonemeet.chat/api/user/open-box", {
        email: user.email,
        boxType: type
      });

      setTimeout(() => {
        setShowSpinner(false);
        if (res.data.success) {
          setUser(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          const isLoss = res.data.prize === "Better luck next time!";
          setRevealPrize({ name: res.data.prize, type: type, isLoss: isLoss });
        }
      }, 2500);
    } catch (err) {
      setShowSpinner(false);
      showModal({ message: err.response?.data?.message || "Failed to open box", type: "error" });
    }
  };

  const saveStreak = async () => {
    try {
      const res = await axios.post("https://api.zonemeet.chat/api/user/save-streak", {
        email: user.email,
        phone: user.phone
      });
      if (res.data.success) {
        const updated = {
          ...user,
          coins: res.data.coins,
          streak_day: res.data.streak_day,
          streak: res.data.streak_day,
          streak_broken: false,
          streak_protection_used: true,
          coinActivity: res.data.coinActivity || user.coinActivity
        };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        setDailyStatus({
          ...dailyStatus,
          status: "eligible",
          streak_day: res.data.streak_day,
          coins: res.data.coins,
          streak_broken: false,
          streak_protection_used: true,
          canCollect: true
        });
        showModal({ message: `✅ Streak Restored! 100 coins deducted. You continue from Day ${res.data.streak_day}.`, type: "success" });
      } else {
        showModal({ message: res.data.message || "Failed to save streak.", type: "info" });
      }
    } catch (err) {
      showModal({ message: err.response?.data?.message || "Failed to save streak", type: "error" });
    }
  };

  const resetStreak = async () => {
    try {
      const res = await axios.post("https://api.zonemeet.chat/api/user/reset-streak", {
        email: user.email,
        phone: user.phone
      });
      if (res.data.success) {
        const updated = {
          ...user,
          coins: res.data.coins,
          streak_day: res.data.streak_day,
          streak: res.data.streak_day,
          streak_broken: false,
          streak_protection_used: false
        };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        setDailyStatus({
          ...dailyStatus,
          status: "eligible",
          streak_day: 1,
          coins: res.data.coins,
          streak_broken: false,
          streak_protection_used: false,
          canCollect: true
        });
        showModal({ message: `🔥 Streak reset to Day 1. You can collect your Day 1 reward now!`, type: "success" });
      } else {
        showModal({ message: res.data.message || "Failed to reset streak.", type: "info" });
      }
    } catch (err) {
      showModal({ message: err.response?.data?.message || "Failed to reset streak", type: "error" });
    }
  };

  const claimBonus = collectDailyReward;


  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const { Country, State } = await import("country-state-city");
    const selectedCountry = Country.getAllCountries().find(c => c.isoCode === onboardForm.countryCode);
    const selectedState = State.getStatesOfCountry(onboardForm.countryCode).find(s => s.isoCode === onboardForm.stateCode);

    const updatedData = {
      gender: onboardForm.gender,
      country: selectedCountry ? selectedCountry.name : onboardForm.countryCode,
      state: selectedState ? selectedState.name : (onboardForm.stateCode || "Other"),
      age: onboardForm.age
    };

    try {
      // In a real app, we'd have a PATCH /api/auth/profile endpoint.
      // For now, we can reuse register or a custom endpoint if it exists.
      // Let's assume we need to update the user in users.json.
      // I'll check if there's a profile update endpoint in server.js.

      const res = await axios.post("https://api.zonemeet.chat/api/auth/update-profile", {
        email: user.email,
        name: user.name,
        ...updatedData
      });

      if (res.data.success) {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
        setShowOnboarding(false);
        // Redirect to Home instead of Chat as requested
        router.push("/");
      }
    } catch (err) {
      showModal({ message: "Failed to update profile. Please try again.", type: "info" });
    }
  };

  const startEdit = async () => {
    // Find country and state codes for the form
    const { Country, State } = await import("country-state-city");
    const currentCountry = Country.getAllCountries().find(c => c.name === user.country);
    const countryCode = currentCountry ? currentCountry.isoCode : "IN";

    const states = State.getStatesOfCountry(countryCode);
    const currentState = states.find(s => s.name === user.state);
    const stateCode = currentState ? currentState.isoCode : (states.length > 0 ? states[0].isoCode : "");

    setOnboardForm({
      gender: user.gender || "Male",
      countryCode: countryCode,
      stateCode: stateCode,
      age: user.age || "18-24"
    });
    setCountriesList(Country.getAllCountries());
    setStatesList(states);
    setShowProfileDrop(false);
    setShowOnboarding(true);
  };

  const logout = async () => {
    try {
      await axios.post("https://api.zonemeet.chat/api/auth/logout", {}, { withCredentials: true });
    } catch (e) {} // ignore errors
    
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    if (session) {
      await signOut({ redirect: false });
    }
    router.push("/login");
  };

  const logoutAll = async () => {
    if (window.confirm("Are you sure you want to log out from all devices? This will invalidate all your active sessions.")) {
      try {
        await axios.post("https://api.zonemeet.chat/api/auth/logout-all", {}, { withCredentials: true });
      } catch (e) {}
      
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      if (session) {
        await signOut({ redirect: false });
      }
      router.push("/login");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // 2FA SETUP FUNCTIONS
  const start2FASetup = async () => {
    setSetupError("");
    setQrCodeUrl("");
    setShow2FASetup(true);
    setShowProfileDrop(false);
    try {
      const res = await axios.post("https://api.zonemeet.chat/api/auth/2fa/setup", { email: user.email });
      setQrCodeUrl(res.data.qrCode);
    } catch (err) {
      setSetupError("Failed to initiate 2FA setup.");
    }
  };

  const verify2FASetup = async () => {
    setSetupError("");
    try {
      const res = await axios.post("https://api.zonemeet.chat/api/auth/2fa/verify-setup", {
        email: user.email,
        token: setupToken
      });
      showModal({ message: res.data.message, type: "success" });
      setShow2FASetup(false);
      setSetupToken("");
      // Update local user object so we know they have it enabled
      const updatedUser = { ...user, twoFactorSecret: true };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      setSetupError(err.response?.data?.message || "Verification failed");
    }
  };

  const disable2FA = async () => {
    if (window.confirm("Are you sure you want to disable Two-Factor Authentication?")) {
      try {
        const res = await axios.post("https://api.zonemeet.chat/api/auth/2fa/disable", { email: user.email });
        if (res.data.success) {
          showModal({ message: res.data.message, type: "success" });
          const updatedUser = { ...user };
          delete updatedUser.twoFactorSecret;
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } catch (err) {
        showModal({ message: err.response?.data?.message || "Failed to disable 2FA", type: "error" });
      }
    }
  };

  const [startingChat, setStartingChat] = useState(false);

  const startChat = async () => {
    if (startingChat) return;
    setStartingChat(true);
    console.log("Start Chat Triggered");

    const token = localStorage.getItem("token");
    if (!token && !session) {
      console.log("No auth found, redirecting...");
      router.push("/login?callbackUrl=/chat");
      setStartingChat(false);
      return;
    }

    // Always prefer the freshest state if available
    const storedUser = user || (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null);
    if (!storedUser || (!storedUser.onboardingCompleted && (!storedUser.gender || storedUser.gender === "Other" || !storedUser.country || storedUser.country === "Unknown" || storedUser.gender === "All"))) {
      console.log("Incomplete profile, showing onboarding");
      setShowOnboarding(true);
      setStartingChat(false);
      return;
    }

    try {
      console.log("Requesting camera/mic permissions...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log("Permissions granted, redirecting to chat...");
      stream.getTracks().forEach(track => track.stop());
      router.push("/chat");
    } catch (err) {
      console.error("Permission denied or error:", err);
      showModal({ message: "Please allow camera and microphone access to start video chat.", type: "info" });
      setStartingChat(false);
    }
  };


  // Razorpay gateway removed — use Cashfree for INR payments
  const handleRazorpayPayment = async () => {
    showModal({ message: "⚠️ Razorpay is no longer available. Please use Cashfree for INR payments.", type: "info" });
  };

  const handleCashfreePayment = async () => {
    if (!user) { showModal({ message: "Please login first", type: "info" }); return; }
    const CF_APP_ID = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
    if (!CF_APP_ID || CF_APP_ID === "YOUR_CASHFREE_APP_ID") {
      showModal({ message: "⚠️ Cashfree gateway is being configured. Please try again in a few minutes or contact support.", type: "info" }); return;
    }
    try {
      setPaymentStep("processing");
      const amountInPaise = selectedPlan.name === "Starter" ? 14900 : selectedPlan.name === "Prime" ? 59900 : selectedPlan.name === "Silver" ? 159900 : selectedPlan.name === "VIP Elite" ? 99900 : Math.round((parseFloat(selectedPlan.price?.replace(/[₹$]/g,'')) || 79) * 100);
      let endpoint = "https://api.zonemeet.chat/api/payment/cashfree/create-order";
      if (isAutoRenew && !selectedPlan.name.includes("Coins")) {
        endpoint = "https://api.zonemeet.chat/api/payment/cashfree/create-subscription";
      }
      const orderRes = await axios.post(endpoint, { amount: amountInPaise, planName: selectedPlan.name, userEmail: user.email });
      if (!orderRes.data.paymentSessionId) throw new Error("Cashfree session failed");
      
      if (isAutoRenew && !selectedPlan.name.includes("Coins")) {
        window.location.href = orderRes.data.paymentSessionId;
        return;
      }

      const cashfree = new window.Cashfree({ mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === "production" ? "production" : "sandbox" });
      cashfree.checkout({
        paymentSessionId: orderRes.data.paymentSessionId,
        returnUrl: `https://zonemeet.chat/payment-success?cf_order=${orderRes.data.orderId}&plan=${encodeURIComponent(selectedPlan.name)}&email=${encodeURIComponent(user.email)}`,
      });
    } catch (err) { console.error(err); setPaymentStep("methods"); showModal({ message: "Cashfree error. Try another method.", type: "error" }); }
  };

  const handlePaypalPayment = async () => {
    if (!user) { showModal({ message: "Please login first", type: "info" }); return; }
    const PP_CLIENT = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!PP_CLIENT || PP_CLIENT === "YOUR_PAYPAL_CLIENT_ID") {
      showModal({ message: "⚠️ PayPal gateway is being configured. Please contact support.", type: "info" }); return;
    }
    try {
      setPaymentStep("processing");
      const planPriceUSD = selectedPlan.name === "Starter" ? 1.75 : selectedPlan.name === "Prime" ? 7.17 : selectedPlan.name === "Silver" ? 19.17 : selectedPlan.name === "VIP Elite" ? 11.99 : selectedPlan.name.includes("100 Coins") ? 0.99 : selectedPlan.name.includes("200 Coins") ? 1.79 : selectedPlan.name.includes("500 Coins") ? 3.59 : selectedPlan.name.includes("1300 Coins") ? 8.49 : (parseFloat(selectedPlan.price?.replace(/[₹$]/g,'')) || 5.00);
      const amountInCents = Math.round(planPriceUSD * 100);
      let endpoint = "https://api.zonemeet.chat/api/payment/paypal/create-order";
      if (isAutoRenew && !selectedPlan.name.includes("Coins")) {
        endpoint = "https://api.zonemeet.chat/api/payment/paypal/create-subscription";
      }
      const orderRes = await axios.post(endpoint, { amount: amountInCents, currency: "USD", planName: selectedPlan.name, userEmail: user.email });
      if (orderRes.data.approveUrl) {
        localStorage.setItem("paypal_pending", JSON.stringify({ planName: selectedPlan.name, userEmail: user.email, orderId: orderRes.data.orderId, giftRecipientId: isGifting ? giftRecipientId : null }));
        window.location.href = orderRes.data.approveUrl;
      } else throw new Error("No PayPal approval URL");
    } catch (err) { console.error(err); setPaymentStep("methods"); showModal({ message: "PayPal error. Try another method.", type: "error" }); }
  };

  // Stripe gateway removed — Coming Soon
  const handleStripePayment = async () => {
    showModal({ message: "⚠️ Stripe / Card payments coming soon! Please use Cashfree (India) or PayPal (International) for now.", type: "info" });
  };






  // =================== BAN SCREEN ===================
  if (banInfo) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        padding: "20px"
      }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              background: "rgba(239,68,68,0.3)",
              borderRadius: "50%",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-ban ${Math.random() * 6 + 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`
            }} />
          ))}
        </div>
        <style>{`
          

          @keyframes float-ban {
            0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
            50% { transform: translateY(-30px) scale(1.2); opacity: 0.8; }
          }
          @keyframes pulse-red-ban {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
            50% { box-shadow: 0 0 0 20px rgba(239,68,68,0); }
          }
          @keyframes fadeInUp-ban {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .ban-card-idx { animation: fadeInUp-ban 0.6s ease-out; }
          .ban-icon-idx { animation: pulse-red-ban 2s ease-in-out infinite; }
        `}</style>
        <div className="ban-card-idx" style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "24px",
          padding: "48px 40px",
          maxWidth: "560px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)"
        }}>
          <div className="ban-icon-idx" style={{
            width: "96px", height: "96px",
            background: "linear-gradient(135deg, #ef4444, #b91c1c)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "48px"
          }}>🚫</div>
          <h1 style={{ color: "#ef4444", fontSize: "28px", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.5px" }}>Account Banned</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 28px" }}>Your ZoneMeet account has been suspended</p>
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "14px",
            padding: "20px 24px",
            marginBottom: "24px",
            textAlign: "left"
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ fontSize: "20px", marginTop: "2px" }}>⚠️</span>
              <div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 6px" }}>Ban Reason</p>
                <p style={{ color: "#fca5a5", fontSize: "15px", lineHeight: 1.5, margin: 0, fontWeight: 500 }}>{banInfo.reason}</p>
              </div>
            </div>
          </div>
          {banInfo.screenshot && (
            <div style={{ marginBottom: "24px" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>📸 Detected Content Screenshot</p>
              <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "2px solid rgba(239,68,68,0.4)" }}>
                <img src={banInfo.screenshot} alt="Violation evidence" style={{ width: "100%", height: "180px", objectFit: "cover", display: "block", filter: "blur(8px) brightness(0.5)" }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "32px" }}>🔞</span>
                  <p style={{ color: "#fca5a5", fontSize: "12px", fontWeight: 600, margin: 0 }}>Inappropriate Content Detected</p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", margin: 0 }}>Recorded by AI Guardian</p>
                </div>
              </div>
            </div>
          )}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "16px 20px", marginBottom: "28px", textAlign: "left" }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", lineHeight: 1.7, margin: 0 }}>
              🛡️ Our AI Guardian detected a safety violation. To appeal, contact <span style={{ color: "#818cf8" }}>support@zonemeet.chat</span>
            </p>
          </div>
          <button
            onClick={() => { setBanInfo(null); window.location.href = "/login"; }}
            style={{
              width: "100%", padding: "14px",
              background: "linear-gradient(135deg, #ef4444, #b91c1c)",
              border: "none", borderRadius: "12px", color: "white",
              fontSize: "15px", fontWeight: 700, cursor: "pointer"
            }}
          >
            Return to Login Page
          </button>
        </div>
      </div>
    );
  }
  // ====================================================

  const headerSubscriptionLabel = getHeaderSubscriptionLabel(user);

  return (
    <div className="container">
      <Head>
        <title>ZoneMeet – Talk To New People Online</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="description" content="ZoneMeet lets you instantly connect with People worldwide through secure video chat. Meet new people, make friends, and enjoy live conversations online." />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://zonemeet.chat/#website",
                  "url": "https://zonemeet.chat",
                  "name": "ZoneMeet",
                  "description": "Secure live video chat to talk to strangers and meet new people online.",
                  "publisher": {
                    "@id": "https://zonemeet.chat/#organization"
                  }
                },
                {
                  "@type": "Organization",
                  "@id": "https://zonemeet.chat/#organization",
                  "name": "ZoneMeet",
                  "url": "https://zonemeet.chat",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://zonemeet.chat/favicon.ico"
                  }
                }
              ]
            })
          }}
        />
        <link
          rel="preload"
          as="image"
          href="/video_chat_experience_1_1778757946493_mobile.webp"
          media="(max-width: 768px)"
        />
      </Head>
      <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload" />

      <div className="bg-gradient" />

      {/* GLOBAL INCOMING CALL POPUP */}
      {incomingCall && (
        <div className="incoming-call-overlay">
          <div className="incoming-call-card">
            <div className="call-avatar">
              {incomingCall.fromUser.name?.charAt(0)}
            </div>
            <div className="call-info">
              <h3>{incomingCall.fromUser.name}</h3>
              <p>is calling you via ZoneMeet...</p>
            </div>
            <div className="call-actions">
              <button className="accept-btn" onClick={acceptCall}>
                <span className="icon">📞</span> Accept
              </button>
              <button className="decline-btn" onClick={rejectCall}>
                <span className="icon">✖</span> Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA SETUP MODAL */}
      {show2FASetup && (
        <div className="payment-overlay" style={{ zIndex: 20000 }}>
          <div className="premium-modal" style={{ maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>Secure Your Account</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Scan the QR code below with the <b>Google Authenticator</b> app, then enter the 6-digit code.
            </p>

            {qrCodeUrl ? (
              <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', display: 'inline-block', marginBottom: '1.5rem' }}>
                <img src={qrCodeUrl} alt="2FA QR Code" style={{ width: '200px', height: '200px' }} />
              </div>
            ) : (
              <div style={{ padding: '40px', color: '#64748b' }}>Generating QR Code...</div>
            )}

            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={setupToken}
              onChange={(e) => setSetupToken(e.target.value)}
              maxLength={6}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '4px', marginBottom: '1rem'
              }}
            />

            {setupError && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{setupError}</div>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setShow2FASetup(false)}
                style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={verify2FASetup}
                style={{ flex: 1, padding: '12px', background: '#6366f1', border: 'none', color: '#fff', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Verify & Enable
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="header">
        <div className="brand-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => router.push("/")}>
          <div className="logo-icon-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ZoneMeetLogo size={40} gradientId="home-zonemeet-logo-grad" />
          </div>
          <h1 className="logo-text" style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', display: 'flex', alignItems: 'center', letterSpacing: '-0.03em' }}>
            <span style={{ color: '#ffffff' }}>Zone</span>
            <span style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Meet</span>
          </h1>
          {headerSubscriptionLabel && (
            <span className="premium-badge header-sub-badge-desktop">{headerSubscriptionLabel}</span>
          )}
        </div>

        {headerSubscriptionLabel && (
          <span className="premium-badge header-premium-mobile-only">{headerSubscriptionLabel}</span>
        )}

        <nav className="header-nav">
          <div className="nav-link" onClick={() => router.push("/")} style={{ cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', transition: 'all 0.3s' }}>Home</div>
          <div className="nav-link" onClick={() => router.push("/friends")} style={{ cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', transition: 'all 0.3s' }}>Friends</div>
          <div className="nav-link" onClick={() => setShowHistoryModal(true)} style={{ cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', transition: 'all 0.3s' }}>History</div>
          <div className="nav-link" onClick={() => document.getElementById("coins-section")?.scrollIntoView({ behavior: 'smooth' })} style={{ cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', transition: 'all 0.3s' }}>Coins</div>
          <div className="nav-link" onClick={() => {
            if (!user) {
              showModal({
                title: "Invite & Earn",
                message: "Please login to see your unique referral link and earn free coins!",
                type: "info",
                confirmText: "Login Now",
                cancelText: "Cancel",
                onConfirm: () => router.push("/login")
              });
            } else {
              document.getElementById("referral-section")?.scrollIntoView({ behavior: 'smooth' });
            }
          }} style={{ cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', color: '#10b981', transition: 'all 0.3s' }}>🎁 Invite</div>
          <div className="nav-link" onClick={() => document.getElementById("pricing-section")?.scrollIntoView({ behavior: 'smooth' })} style={{ cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', transition: 'all 0.3s' }}>VIP</div>
          <div className="nav-link" onClick={() => router.push("/contact")} style={{ cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', transition: 'all 0.3s' }}>Contact</div>
        </nav>

        {authLoading ? (
          <div className="user-info">
            <span className="loading-dots">Verifying session...</span>
          </div>
        ) : user ? (
          <div className="user-dashboard-row header-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
            <div
              className="header-streak-pill"
              onClick={() => setShowStreakModal(true)}
              title={`${user.streak_day || user.streak || 0} day login streak! Log in 7 days in a row for 100 free coins.`}
            >
              <span className="streak-fire">🔥</span>
              <div className="streak-info">
                <span className="streak-count">{user.streak_day || user.streak || 0}</span>
                <span className="streak-label">/ 7</span>
              </div>
              <div className="streak-bar-wrap">
                <div className="streak-bar-fill" style={{ width: `${Math.min((((user.streak_day || user.streak || 0) % 8) / 7) * 100, 100)}%` }} />
              </div>
            </div>

            <div className="header-coins-pill" onClick={() => document.getElementById("coins-section")?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="coin-icon">💰</span>
              <span className="coin-count">{user.coins || 0}</span>
              <span className="plus-icon">+</span>
            </div>

            <div className={`network-status-pill ${isOnline ? 'online' : 'offline'}`} style={{ marginLeft: '10px' }}>
              <span className="status-dot"></span>
              {isOnline ? 'Live' : 'Offline'}
            </div>

            <div className="profile-dropdown-container">
              <div className="profile-trigger" onClick={() => setShowProfileDrop(!showProfileDrop)} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <span className="profile-trigger-name" style={{ color: '#ffffff', fontWeight: '500', fontSize: '1rem' }}>
                  {user.name} {user.email === "ds9376314@gmail.com" && <span style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: '800', border: '1px solid #f59e0b', padding: '1px 5px', borderRadius: '4px', marginLeft: '5px' }}>VIP</span>}
                </span>
                <div className="profile-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
              </div>
              {showProfileDrop && (() => {
                const profileModal = (
                <div className={`profile-modal-overlay${isMobileView ? " profile-modal-overlay--mobile" : ""}`} onClick={() => setShowProfileDrop(false)}>
                  <div className={`profile-modal-card${isMobileView ? " profile-modal-card--mobile" : ""}`} onClick={(e) => e.stopPropagation()}>
                    <div className="profile-modal-header">
                      My Profile
                      <button className="profile-modal-close" onClick={() => setShowProfileDrop(false)}>×</button>
                    </div>

                    <div className="profile-modal-body">
                      {/* User Section */}
                      <div className="profile-user-card">
                        <div className="profile-avatar-large">
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="profile-user-info">
                          <div className="profile-user-name">
                            {user.name}
                            {user.email === "ds9376314@gmail.com" && <span className="vip-badge-inline">VIP</span>}
                          </div>
                          <div className="profile-user-id" onClick={() => {
                            navigator.clipboard.writeText(user.id);
                            showModal({ message: "ID Copied!", type: "info" });
                          }}>
                            ID: {user.id} <span>📋</span>
                          </div>
                        </div>
                        <button className="profile-edit-btn" onClick={startEdit}>✏️ Edit</button>
                      </div>

                      {/* Premium Section */}
                      {/* Premium Section */}
                      {!user.premium ? (
                        <div className="profile-premium-banner">
                          <div className="profile-premium-left">
                            <span style={{ fontSize: '2rem' }}>👑</span>
                            <div className="profile-premium-text">
                              <span className="profile-premium-title">ZoneMeet Pro</span>
                              <span className="profile-premium-sub">Get More Gender Filters</span>
                            </div>
                          </div>
                          <button className="profile-premium-btn" onClick={() => {
                            setShowProfileDrop(false);
                            document.getElementById("pricing-section")?.scrollIntoView({ behavior: "smooth" });
                          }}>Join</button>
                        </div>
                      ) : (
                        <div className="profile-premium-banner active-sub-banner" style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(236,72,153,0.1) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="profile-premium-left">
                              <span style={{ fontSize: '1.5rem' }}>👑</span>
                              <div className="profile-premium-text">
                                <span className="profile-premium-title">{user.planName || "Premium"} Active</span>
                                {user.nextBillingDate && (
                                  <span className="profile-premium-sub" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                    {user.autoRenewEnabled ? 'Renews on ' : 'Expires on '}{new Date(user.nextBillingDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {user.subscriptionId && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '5px' }}>
                              <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>🔄 Auto-Renew</span>
                              <label className="toggle-switch">
                                <input 
                                  type="checkbox" 
                                  checked={user.autoRenewEnabled} 
                                  onChange={async (e) => {
                                    const checked = e.target.checked;
                                    try {
                                      const token = localStorage.getItem("token");
                                      const res = await axios.post("https://api.zonemeet.chat/api/user/toggle-autorenew", { autoRenewEnabled: checked }, { headers: { Authorization: `Bearer ${token}` } });
                                      if(res.data.success) {
                                        const updated = { ...user, autoRenewEnabled: res.data.autoRenewEnabled };
                                        setUser(updated);
                                        localStorage.setItem("user", JSON.stringify(updated));
                                      }
                                    } catch(err) {
                                      console.error(err);
                                      showModal({ message: "Failed to update auto-renew toggle", type: "error" });
                                    }
                                  }} 
                                />
                                <span className="toggle-slider"></span>
                              </label>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Balances Section */}
                      <div className="profile-balances">
                        <div className="profile-balance-item" title="My ZoneMeet Coins">
                          <span className="profile-balance-icon">💰</span> {user.coins || 0}
                        </div>
                        <div className="profile-balance-divider"></div>
                        <div className="profile-balance-item" title="Daily Login Streak" style={{ color: (user.streak_day || user.streak) > 0 ? '#ff4500' : 'inherit' }}>
                          <span className="profile-balance-icon">🔥</span> {user.streak_day || user.streak || 0}
                        </div>
                        <div className="profile-balance-divider"></div>
                        <div className="profile-balance-item" style={{ cursor: 'pointer', color: user.boostExpiry > currentTime ? '#10b981' : 'inherit' }} onClick={async () => {
                          if (user.boostExpiry > currentTime) return showModal({ message: "Boost already active!", type: "info" });

                          showModal({
                            message: "Boost profile for 10 mins (100 Coins)?",
                            type: "question",
                            confirmText: "Boost Now",
                            cancelText: "Cancel",
                            onConfirm: async () => {
                              try {
                                const res = await axios.post("https://api.zonemeet.chat/api/user/spend-coins", { email: user.email, amount: 100, feature: "profile_boost" });
                                if (res.data.success) {
                                  // Use local Date.now() to prevent server clock drift showing 11 mins
                                  const localExpiry = Date.now() + (10 * 60 * 1000);
                                  const newUser = { ...user, coins: res.data.coins, boostExpiry: localExpiry, coinActivity: res.data.coinActivity };
                                  setUser(newUser);
                                  localStorage.setItem("user", JSON.stringify(newUser));
                                  showModal({ message: "Profile Boosted! Matching priority increased.", type: "success" });
                                }
                              } catch (err) {
                                showModal({ message: err.response?.data?.message || "Failed to boost", type: "error" });
                              }
                            }
                          });
                        }}>
                          <span className="profile-balance-icon">⚡</span>
                          {user.boostExpiry > currentTime ?
                            `Active (${Math.floor(Math.max(0, user.boostExpiry - currentTime) / 60000).toString().padStart(2, '0')}:${Math.floor((Math.max(0, user.boostExpiry - currentTime) % 60000) / 1000).toString().padStart(2, '0')})`
                            : "Boost"}
                        </div>
                      </div>

                      {/* COIN CENTER BOX */}
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '15px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '15px' }}>

                        {/* Redeem Referral */}
                        {!user.referredBy && (
                          <div className="profile-referral-box">
                            <div className="profile-referral-title">🎁 Referral Code</div>
                            <div className="profile-referral-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', width: '100%', overflow: 'hidden' }}>
                              <input
                                type="text"
                                placeholder="Code"
                                value={redeemCode}
                                className="profile-referral-input"
                                style={{ flex: '1 1 0', minWidth: 0 }}
                                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                              />
                              <button
                                onClick={handleRedeemReferral}
                                className="profile-referral-btn"
                                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                              >
                                Redeem
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Transactions */}
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>🕒 Last Activity</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(!user.coinActivity || user.coinActivity.length === 0) ? (
                              <div style={{ textAlign: 'center', padding: '5px', color: '#334155', fontSize: '0.75rem' }}>No activity.</div>
                            ) : (
                              user.coinActivity.slice(-3).reverse().map((activity, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '8px 10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                    <div style={{
                                      width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                                      background: activity.type === 'earn' || activity.action?.includes('Reward') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
                                      color: activity.type === 'earn' || activity.action?.includes('Reward') ? '#10b981' : '#ef4444'
                                    }}>
                                      {activity.type === 'earn' || activity.action?.includes('Reward') ? '➕' : '➖'}
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                      <div style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                        {activity.feature || activity.action || 'Transaction'}
                                      </div>
                                      <div style={{ color: '#475569', fontSize: '0.6rem' }}>
                                        {new Date(activity.timestamp).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ fontWeight: 800, fontSize: '0.8rem', color: activity.type === 'earn' || activity.action?.includes('Reward') ? '#10b981' : '#cbd5e1', marginLeft: '5px' }}>
                                    {activity.type === 'earn' || activity.action?.includes('Reward') ? '+' : '-'}{activity.amount}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Latest News */}
                      <div className="profile-latest-news" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '16px', padding: '15px', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📰 Latest News & Updates</span>
                        </div>
                        {news.length === 0 ? (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No recent announcements.</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '150px', overflowY: 'auto', paddingRight: '5px' }}>
                            {news.map(n => (
                              <div key={n.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>{n.title}</div>
                                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4' }}>{n.content}</div>
                                <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '6px' }}>{new Date(n.date).toLocaleDateString()}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Details List */}
                      <div className="profile-details-list">
                        <div className="profile-detail-item">
                          <div className="profile-detail-left">🎂 Age</div>
                          <div className="profile-detail-right">{user.age || "All Ages"}</div>
                        </div>
                        <div className="profile-detail-item">
                          <div className="profile-detail-left">👱 Gender</div>
                          <div className="profile-detail-right">{user.gender || "All"}</div>
                        </div>
                        <div className="profile-detail-item">
                          <div className="profile-detail-left">🌍 Location</div>
                          <div className="profile-detail-right" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {getFlagUrl(user.country) && <img src={getFlagUrl(user.country)} alt={`${user.country || "User Location"} flag`} style={{ width: '16px', height: '12px', borderRadius: '2px' }} />}
                            {user.state || user.country || "Earth"}
                          </div>
                        </div>
                      </div>

                      {/* History Section - moved to header nav */}


                      {/* Friends Button */}
                      <button className="profile-more-btn" onClick={() => router.push("/friends")} style={{ marginTop: '20px' }}>
                        <div className="profile-detail-left">👥 Friends</div>
                        <span>›</span>
                      </button>

                      {/* Match History Button */}
                      <button className="profile-more-btn" onClick={() => { setShowProfileDrop(false); setShowHistoryModal(true); }} style={{ marginTop: '10px' }}>
                        <div className="profile-detail-left">🕒 Match History</div>
                        <span>›</span>
                      </button>

                      {isSiteAdmin(user?.email) && (
                        <button className="profile-more-btn" onClick={() => router.push("/admin")} style={{ marginTop: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                          <div className="profile-detail-left">⚡ Admin Dashboard</div>
                          <span>›</span>
                        </button>
                      )}


                      {/* Logout All */}
                      <button className="profile-more-btn" onClick={logoutAll} style={{ color: '#ef4444' }}>
                        <div className="profile-detail-left">🔒 Logout All Devices</div>
                        <span>›</span>
                      </button>

                      {/* Delete My Account */}
                      <button className="profile-more-btn" onClick={async () => {
                        let confirmed = false;
                        try {
                          const Swal = (await import('sweetalert2')).default;
                          const result = await Swal.fire({
                            title: 'Delete Account?',
                            text: 'This will permanently delete your account and all data. This action cannot be undone!',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#ef4444',
                            cancelButtonColor: '#6366f1',
                            confirmButtonText: 'Yes, Delete My Account',
                            cancelButtonText: 'Cancel',
                            background: '#0f172a',
                            color: '#fff'
                          });
                          confirmed = result.isConfirmed;
                        } catch (e) {
                          confirmed = window.confirm('This will permanently delete your account and all data. Are you sure?');
                        }
                        if (!confirmed) return;
                        try {
                          const token = localStorage.getItem("token");
                          const res = await axios.delete("https://api.zonemeet.chat/api/user/delete-account", { headers: { Authorization: `Bearer ${token}` } });
                          if (res.data.success) {
                            localStorage.clear();
                            try { await signOut({ redirect: false }); } catch(e) {}
                            alert("Account deleted successfully. Goodbye!");
                            window.location.href = "/login";
                          }
                        } catch (err) {
                          alert(err.response?.data?.error || err.response?.data?.message || "Failed to delete account. Please try again.");
                        }
                      }} style={{ color: '#ef4444', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <div className="profile-detail-left">🗑️ Delete My Account</div>
                        <span>›</span>
                      </button>

                      {/* Logout */}
                      <button className="profile-more-btn" onClick={logout} style={{ color: '#ef4444' }}>
                        <div className="profile-detail-left">🚪 Logout</div>
                        <span>›</span>
                      </button>
                    </div>
                  </div>
                </div>
                );
                return isMobileView && typeof document !== "undefined"
                  ? createPortal(profileModal, document.body)
                  : profileModal;
              })()}
            </div>
          </div>
        ) : (
          <div className="auth-buttons">
            <button className="btn btn-secondary btn-sm" onClick={() => router.push("/login")}>Login</button>
            <button className="btn btn-primary btn-sm" onClick={() => router.push("/login")}>Sign Up</button>
          </div>
        )}
      </div>

      <main className="dashboard-hero">
        <div className="hero-split-container centered-hero">
          <div className="hero-top-columns">
            <div className="hero-left-column">
              {/* Status Badge (Dynamic & Centered) */}
              <div className="status-badge">
                <div className="status-dot active"></div>
                <span>{onlineCount.toLocaleString()} Users Online Now</span>
              </div>

              <h1 className="hero-explore-title">
                Talk to New People Online<br />
                <span>& Meet Strangers via Live Video Chat.</span>
              </h1>

              <p className="hero-explore-subtitle">
                Connect instantly with professionals, language learners, and like-minded peers worldwide through our interest-based communication rooms. Build your professional network, exchange languages, collaborate on ideas, and participate in secure global communities anytime, anywhere.
              </p>

              <div className="action-buttons" style={{ position: 'relative', zIndex: 20, marginTop: '30px' }}>
                <button className="btn btn-primary btn-lg btn-connect-now" onClick={startChat} disabled={startingChat}>
                  {startingChat ? "Connecting..." : "Connect Now"}
                  {!startingChat && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '10px' }}>
                      <path d="M23 7a2 2 0 0 0-2.45-1.45L16 7V5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2l4.55 1.45A2 2 0 0 0 23 17V7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Full Width Bottom Stats Strip from Image 3 */}
          {/* Enhanced Bottom Stats Strip */}
          <div className="hero-stats-premium-strip">
            <div className="stat-premium-card">
              <h3 style={{ color: '#c084fc' }}>190+</h3>
              <p className="stat-label">Global Reach</p>
              <p className="stat-desc">Connect with friendly people from over 190 countries instantly.</p>
            </div>

            <div className="stat-premium-card">
              <h3 style={{ color: '#60a5fa' }}>10M+</h3>
              <p className="stat-label">Live Connections</p>
              <p className="stat-desc">Millions of successful video call matches made every single day.</p>
            </div>

            <div className="stat-premium-card">
              <h3 style={{ color: '#10b981' }}>100%</h3>
              <p className="stat-label">Safe & Secure</p>
              <p className="stat-desc">End-to-end encryption and advanced private call protection.</p>
            </div>

            <div className="stat-premium-card">
              <h3 style={{ color: '#f472b6' }}>AI</h3>
              <p className="stat-label">Smart Guardian</p>
              <p className="stat-desc">Real-time AI moderation to ensure a clean and friendly space.</p>
            </div>
          </div>
        </div>
      </main>

      {/* SEO CONTENT SECTION */}
      <section className="seo-content-section">
        <p className="seo-paragraph">
          ZoneMeet is the easiest way to <strong>talk to strangers</strong> and make genuine connections from the comfort of your home. Our <strong>live video chat</strong> platform brings people together from over 190 countries, making it simple to <strong>meet new people online</strong> every single day. Whether you're looking for meaningful conversations, cultural exchange, or just a friendly face, ZoneMeet is the <strong>online chat platform</strong> built for real human connection — safe, instant, and completely free to start.
        </p>
      </section>

      {/* ABOUT ZONEMEET EXPERIENCE SECTION */}
      <div className="experience-section" style={{ padding: '100px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div className="experience-text">
            <h2 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '25px', lineHeight: '1.1' }}>
              Redefining Human <span>Connection</span>
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '30px' }}>
              ZoneMeet is a modern global communication platform designed for professional networking and meaningful language exchanges.
              Our interest-based community rooms combine cutting-edge real-time technology with absolute security and collaboration.
              Whether you are expanding your global circle, learning a new language, or building your professional career, we connect you with the right peers instantly.
            </p>
            <div className="experience-stats" style={{ display: 'flex', gap: '40px' }}>
              <div>
                <h4 style={{ fontSize: '2rem', color: '#6366f1' }}>10M+</h4>
                <p style={{ fontSize: '0.9rem', color: '#475569' }}>Global Matches</p>
              </div>
              <div>
                <h4 style={{ fontSize: '2rem', color: '#fbbf24' }}>190+</h4>
                <p style={{ fontSize: '0.9rem', color: '#475569' }}>Countries</p>
              </div>
              <div>
                <h4 style={{ fontSize: '2rem', color: '#ec4899' }}>24/7</h4>
                <p style={{ fontSize: '0.9rem', color: '#475569' }}>Live Support</p>
              </div>
            </div>
          </div>

          <div className="experience-gallery" style={{ position: 'relative' }}>
            <div className="gallery-main" style={{
              borderRadius: '30px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              transform: 'perspective(1000px) rotateY(-5deg)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <picture style={{ width: '100%', height: 'auto' }}>
                <source media="(max-width: 768px)" srcSet="/video_chat_experience_1_1778757946493_mobile.webp" />
                <img src="/video_chat_experience_1_1778757946493.webp" alt="ZoneMeet Interactive Live Video Chat Experience illustration showing friendly online connections" style={{ width: '100%', height: 'auto' }} />
              </picture>
            </div>
            <div className="gallery-sub" style={{
              position: 'absolute',
              bottom: '-30px',
              left: '-40px',
              width: '200px',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              zIndex: 2
            }}>
              <picture style={{ width: '100%', height: 'auto' }}>
                <source media="(max-width: 768px)" srcSet="/global_connection_2_1778758015960_mobile.webp" />
                <img src="/global_connection_2_1778758015960.webp" alt="ZoneMeet global connections map showing users communicating worldwide" loading="lazy" style={{ width: '100%', height: 'auto' }} />
              </picture>
            </div>
            <div className="gallery-sub" style={{
              position: 'absolute',
              top: '-30px',
              right: '-20px',
              width: '180px',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              zIndex: 2
            }}>
              <picture style={{ width: '100%', height: 'auto' }}>
                <source media="(max-width: 768px)" srcSet="/safe_video_chat_3_1778758050606_mobile.webp" />
                <img src="/safe_video_chat_3_1778758050606.webp" alt="Secure online chat illustration representing safe and private video calling environment" loading="lazy" style={{ width: '100%', height: 'auto' }} />
              </picture>
            </div>
          </div>
        </div>
      </div>

      {/* GLOBAL FRIENDS NETWORK SECTION */}
      <div className="friends-promo-section" style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '80px', alignItems: 'center' }}>
          <div className="friends-visual" style={{ position: 'relative' }}>
            <picture style={{ width: '100%', height: 'auto' }}>
              <source media="(max-width: 768px)" srcSet="/global-friends_mobile.webp" />
              <img src="/global-friends.webp" alt="ZoneMeet Global Friends Network illustration showing user avatars connected across the globe" loading="lazy" style={{ width: '100%', height: 'auto', borderRadius: '40px', boxShadow: '0 40px 100px rgba(99,102,241,0.2)' }} />
            </picture>
          </div>
          <div className="friends-text">
            <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '20px', letterSpacing: '-1px' }}>Build your <span>Global Circle.</span></h2>
            <p style={{ color: '#94a3b8', fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '30px' }}>
              Why stop at one conversation? Add interesting connections to your <strong>Professional Network</strong> and see when they are online. Direct call your peers anytime for <strong>FREE</strong>. Your global professional community starts here.
            </p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
                <span style={{ fontSize: '2rem' }}>👥</span>
                <h4 style={{ margin: '10px 0 5px 0' }}>Friends Hub</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Manage all your connections in one place.</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
                <span style={{ fontSize: '2rem' }}>📞</span>
                <h4 style={{ margin: '10px 0 5px 0' }}>Free Direct Calls</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No coins needed to call accepted friends.</p>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* DEDICATED SUPPORT & SAFETY BANNER */}
      <section className="home-support-banner" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '50px' }}>
        <div className="support-banner-content">
          <div className="support-banner-visual">
            <picture style={{ width: '100%', height: 'auto' }}>
              <source media="(max-width: 768px)" srcSet="/home-support-3d_mobile.webp" />
              <img src="/home-support-3d.webp" alt="ZoneMeet AI Guardian and Safety Shield 3D illustration for fully moderated video chat" loading="lazy" className="floating-3d-shield" style={{ width: '100%', height: 'auto' }} />
            </picture>
            <div className="visual-glow" />
          </div>
          <div className="support-banner-text">
            <div className="support-tag">🛡️ ZERO TOLERANCE PLATFORM</div>
            <h2>Your Safety is our <br /><span>Top Priority.</span></h2>
            <p>
              ZoneMeet uses AI moderation and manual review systems to prevent nudity, abuse, harassment, and unsafe behavior. Our advanced NSFW detection models scan streams in real time to ensure a fully moderated, secure live interaction experience.
            </p>
            <div className="support-features" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="s-feat">
                <span className="s-icon">🤖</span>
                <div>
                  <h4>AI Moderation</h4>
                  <p>AI scans inappropriate content in real time.</p>
                </div>
              </div>
              <div className="s-feat">
                <span className="s-icon">🚨</span>
                <div>
                  <h4>Report Users</h4>
                  <p>Report violators instantly with 1-click flagging.</p>
                </div>
              </div>
              <div className="s-feat">
                <span className="s-icon">⚡</span>
                <div>
                  <h4>Instant Ban System</h4>
                  <p>Unsafe users are automatically suspended instantly.</p>
                </div>
              </div>
              <div className="s-feat">
                <span className="s-icon">👥</span>
                <div>
                  <h4>Human Moderators</h4>
                  <p>24/7 manual review team verifying reports.</p>
                </div>
              </div>
            </div>
            <button className="btn-contact-home" onClick={() => router.push("/contact")}>
              Contact Official Support
            </button>
          </div>
        </div>
      </section>

      {/* PREMIUM PRICING SECTION */}
      <div className="pricing-section" id="pricing-section">
        <div className="pricing-header">
          <h2 className="section-title">Elevate Your <span>Experience</span></h2>
          <p className="section-subtitle">Unlock precise filters, unlimited connections, and premium identity.</p>
        </div>

        {/* CURRENCY TOGGLE */}
        <div className="currency-selector">
          <div className="currency-pill">
            <button
              className={currency === "INR" ? "active" : ""}
              onClick={() => setCurrency("INR")}
            >
              INR (₹)
            </button>
            <button
              className={currency === "USD" ? "active" : ""}
              onClick={() => setCurrency("USD")}
            >
              USD ($)
            </button>
          </div>
        </div>

        <div className="pricing-container">
          {/* STARTER PLAN */}
          <div className="premium-card">
            <div className="plan-icon">✨</div>
            <div className="card-header">
              <h3>Starter</h3>
              <div className="duration">7 Days of Starter Access</div>
            </div>
            <div className="price-tag">
              <span className="amount">{currency === "INR" ? "₹149" : "$1.75"}</span>
            </div>
            <ul className="premium-features">
              <li><span>✓</span> Gender & Country Filters</li>
              <li><span>✓</span> Priority Matching</li>
              <li><span>✓</span> Unlimited Friend Requests</li>
              <li><span>★</span> 50 ZoneMeet Coins (Free)</li>
            </ul>
            <button className="premium-btn" onClick={() => {
              setSelectedPlan({ name: "Starter", price: currency === "INR" ? "₹149" : "$1.75" });
              setShowPaymentModal(true);
              setIsGifting(false);
              setGiftRecipientId("");
            }}>Select Starter</button>
          </div>

          {/* PRIME PLAN */}
          <div className="premium-card featured">
            <div className="popular-ribbon">Best Choice</div>
            <div className="plan-icon">🚀</div>
            <div className="card-header">
              <h3>Prime</h3>
              <div className="duration">30 Days of Pro Access</div>
            </div>
            <div className="price-tag">
              <span className="amount">{currency === "INR" ? "₹599" : "$7.17"}</span>
              <div className="savings">~6% OFF</div>
            </div>
            <ul className="premium-features">
              <li><span>✓</span> Gender & Country Filters</li>
              <li><span>✓</span> Instant Priority Matching</li>
              <li><span>✓</span> Unlimited Friend Requests</li>
              <li><span>🌐</span> Auto-Translate Chats & Live Subtitles</li>
              <li><span>★</span> 150 ZoneMeet Coins (Free)</li>
              <li className="feature-coming-soon"><span>🕒</span> Ad-Free Experience <em>(Coming Soon)</em></li>
            </ul>
            <button className="premium-btn primary" onClick={() => {
              setSelectedPlan({ name: "Prime", price: currency === "INR" ? "₹599" : "$7.17" });
              setShowPaymentModal(true);
              setIsGifting(false);
              setGiftRecipientId("");
            }}>Get Prime Now</button>
          </div>

          {/* SILVER PLAN */}
          <div className="premium-card">
            <div className="plan-icon">💎</div>
            <div className="card-header">
              <h3>Silver</h3>
              <div className="duration">90 Days of Pro Access</div>
            </div>
            <div className="price-tag">
              <span className="amount">{currency === "INR" ? "₹1599" : "$19.17"}</span>
              <div className="savings">~16.5% OFF</div>
            </div>
            <ul className="premium-features">
              <li><span>✓</span> Season-Long Pro Access (90 Days)</li>
              <li><span>✓</span> Gender & Country Filters (Prime jaisa)</li>
              <li><span>✓</span> Elite Identity Badge</li>
              <li><span>✓</span> All Prime Benefits (Translate, Priority, Friends)</li>
              <li><span>🌐</span> Auto-Translate Chats & Live Subtitles</li>
              <li><span>★</span> 500 ZoneMeet Coins (Free)</li>
              <li className="feature-coming-soon"><span>🕒</span> Ad-Free Experience <em>(Coming Soon)</em></li>
            </ul>
            <button className="premium-btn" onClick={() => {
              setSelectedPlan({ name: "Silver", price: currency === "INR" ? "₹1599" : "$19.17" });
              setShowPaymentModal(true);
              setIsGifting(false);
              setGiftRecipientId("");
            }}>Select Silver</button>
          </div>
        </div>

        {/* ELITE FULL-WIDTH BANNER */}
        <div className="elite-hero-banner">
          <div className="elite-content">
            <div className="elite-badge-v3">👑 VIP ELITE</div>
            <div className="elite-main-info">
              <h2>Master the <span>ZoneMeet</span></h2>
              <p>The ultimate membership for those who want everything. Zero limits, maximum control.</p>
              <div className="elite-price-group">
                <span className="price">{currency === "INR" ? "₹999" : "$11.99"}</span>
                <span className="duration">/ 30 Days</span>
              </div>
              <button className="elite-btn-v3" onClick={() => {
                setSelectedPlan({ name: "VIP Elite", price: currency === "INR" ? "₹999" : "$11.99" });
                setShowPaymentModal(true);
                setIsGifting(false);
                setGiftRecipientId("");
              }}>Become a VIP Elite Member</button>
            </div>
          </div>

          <div className="elite-features-grid">
            <div className="elite-feature-item">
              <strong>🎯 Exact Age Filter</strong>
              <p>Find exactly who you're looking for</p>
            </div>
            <div className="elite-feature-item">
              <strong>💰 400 Free Coins</strong>
              <p>Boost & Reconnect instantly</p>
            </div>
            <div className="elite-feature-item">
              <strong>⚡ Instant Zero-Wait</strong>
              <p>Never wait for a match again</p>
            </div>

            <div className="elite-feature-item">
              <strong>🎨 Free Filters & Avatars</strong>
              <p>All face filters & animated avatars unlocked</p>
            </div>
            <div className="elite-feature-item">
              <strong>🎤 Voice Changer</strong>
              <p>Change your voice in real-time</p>
            </div>
            <div className="elite-feature-item">
              <strong>🔒 Privacy Tools</strong>
              <p>Blur, mask & identity protection box</p>
            </div>
            <div className="elite-feature-item">
              <strong>🌐 Auto-Translate & CC</strong>
              <p>Live translated subtitles & chats</p>
            </div>
            <div className="elite-feature-item feature-coming-soon-box">
              <strong>📺 Ad-Free Experience</strong>
              <p>Zero interruptions <em>(Coming Soon)</em></p>
            </div>
          </div>
        </div>
      </div>


      {/* COINS SECTION */}
      <div className="pricing-section" id="coins-section" style={{ marginTop: '100px' }}>
        <div className="pricing-header">
          <h2 className="section-title">ZoneMeet <span>Coins</span> Store</h2>
          <p className="section-subtitle">Get coins to boost your profile or reconnect with community peers.</p>
        </div>

        {/* LEADERBOARD FULL-SCREEN OVERLAY */}
        {isLeaderboardOpen && (
          <div className="payment-overlay" style={{ zIndex: 30000, backdropFilter: 'blur(25px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setIsLeaderboardOpen(false)}>
            <div className="premium-modal leaderboard-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', height: '70vh', maxHeight: '600px', padding: '0', display: 'flex', flexDirection: 'column', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(251, 191, 36, 0.2)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
              {/* Header */}
              <div style={{ padding: '15px', position: 'relative', background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.1) 0%, transparent 100%)', textAlign: 'center' }}>
                <button className="modal-close-btn" onClick={() => setIsLeaderboardOpen(false)} style={{ top: '20px', right: '20px' }}>×</button>
                <div style={{ fontSize: '1.2rem', color: '#fbbf24', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '10px' }}>HALL OF FAME</div>
                <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', margin: 0, textShadow: '0 0 30px rgba(251,191,36,0.2)' }}>Top Spenders</h2>
                <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '5px' }}>
                  {leaderboardComingSoon ? "Launch Phase Progress" : `${leaderboardMonth} Rankings & Prizes`}
                </p>

                {!leaderboardComingSoon && (
                  <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '18px', marginTop: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                      onClick={() => setLeaderboardFilter('all')}
                      style={{ padding: '10px 25px', borderRadius: '14px', border: 'none', background: leaderboardFilter === 'all' ? '#fbbf24' : 'transparent', color: leaderboardFilter === 'all' ? '#000' : '#fff', fontWeight: 800, cursor: 'pointer', transition: '0.3s' }}
                    >🌎 Global</button>
                    <button
                      onClick={() => setLeaderboardFilter('india')}
                      style={{ padding: '10px 25px', borderRadius: '14px', border: 'none', background: leaderboardFilter === 'india' ? '#fbbf24' : 'transparent', color: leaderboardFilter === 'india' ? '#000' : '#fff', fontWeight: 800, cursor: 'pointer', transition: '0.3s' }}
                    >🇮🇳 India</button>
                  </div>
                )}
              </div>
              {/* Prize Info Footer */}
              {!leaderboardComingSoon && (
                <>
                  <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <button
                      onClick={() => setShowRewardsInfo(!showRewardsInfo)}
                      style={{ padding: '8px 20px', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.4)', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', fontWeight: 800, cursor: 'pointer', transition: '0.3s' }}
                    >
                      {showRewardsInfo ? 'Hide Rewards 🎁' : 'Show Rewards 🎁'}
                    </button>
                  </div>
                  {showRewardsInfo && (
                    <div style={{ marginTop: '15px', padding: '20px', background: 'linear-gradient(90deg, rgba(251, 191, 36, 0.05), transparent)', borderRadius: '20px', border: '1px solid rgba(251, 191, 36, 0.1)', display: 'flex', alignItems: 'center', gap: '20px', animation: 'fadeIn 0.3s ease-in-out' }}>
                      <div style={{ fontSize: '3rem' }}>🎁</div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, color: '#fbbf24', fontSize: '1.1rem', fontWeight: 900 }}>Monthly Rewards Distribution</h4>
                        <p style={{ margin: '5px 0 0', color: '#94a3b8', lineHeight: '1.4' }}>
                          🏆 <strong>Rank 1:</strong> 1000 Coins |
                          🥈 <strong>Rank 2:</strong> 500 Coins |
                          🥉 <strong>Rank 3:</strong> 200 Coins
                        </p>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textAlign: 'right' }}>
                        NEXT RESET:<br /> {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Scrollable Body */}
              <div className="bot-body" style={{ flex: 1, overflowY: 'auto', padding: '0 40px 40px' }}>
                {leaderboardComingSoon ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center', animation: 'fadeIn 0.5s' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '30px' }}>🚀</div>
                    <h3 style={{ fontSize: '2rem', fontWeight: '900', color: '#fff', marginBottom: '15px' }}>Coming Soon!</h3>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto 40px', lineHeight: '1.6' }}>
                      The Hall of Fame unlocks once we reach **1,000 Global Users**. Be part of the early wave!
                    </p>

                    {/* Progress Bar */}
                    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: '#fbbf24', fontWeight: '800' }}>
                        <span>Community Progress</span>
                        <span>{leaderboardComingSoon.current} / {leaderboardComingSoon.target}</span>
                      </div>
                      <div style={{ height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min((leaderboardComingSoon.current / leaderboardComingSoon.target) * 100, 100)}%`,
                          background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                          transition: 'width 1s ease-out',
                          boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)'
                        }}></div>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '20px' }}>
                        We only need **{Math.max(leaderboardComingSoon.target - leaderboardComingSoon.current, 0)}** more users to go live!
                      </p>
                    </div>

                    <button
                      onClick={() => setIsLeaderboardOpen(false)}
                      style={{ marginTop: '50px', padding: '15px 40px', borderRadius: '30px', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Close & Keep Exploring
                    </button>
                  </div>
                ) : leaderboardLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <div className="premium-loader" style={{ width: '50px', height: '50px' }}></div>
                    <p style={{ color: '#94a3b8', marginTop: '20px', fontWeight: 700 }}>Calculating Rankings...</p>
                  </div>
                ) : (
                  <>
                    {/* PODIUM SECTION */}
                    {leaderboardData.length >= 3 && (
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '20px', margin: '40px 0 60px' }}>
                        {/* 2nd Place */}
                        <div style={{ textAlign: 'center', width: '150px' }}>
                          <div style={{ position: 'relative', marginBottom: '15px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(45deg, #94a3b8, #cbd5e1)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid rgba(255,255,255,0.1)' }}>
                              <span style={{ fontSize: '2rem' }}>🥈</span>
                            </div>
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{leaderboardData[1].name}</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#cbd5e1' }}>{leaderboardData[1].monthlySpend}</div>
                          <div style={{ height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px 15px 0 0', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'rgba(255,255,255,0.1)', fontSize: '2rem' }}>2</div>
                        </div>

                        {/* 1st Place */}
                        <div style={{ textAlign: 'center', width: '180px', transform: 'scale(1.1)' }}>
                          <div style={{ position: 'relative', marginBottom: '20px' }}>
                            <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '2.5rem', filter: 'drop-shadow(0 0 10px #fbbf24)' }}>👑</div>
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(45deg, #fbbf24, #f59e0b)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '5px solid rgba(251, 191, 36, 0.3)', boxShadow: '0 0 50px rgba(251, 191, 36, 0.3)' }}>
                              <span style={{ fontSize: '2.5rem' }}>🥇</span>
                            </div>
                          </div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>{leaderboardData[0].name}</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fbbf24' }}>{leaderboardData[0].monthlySpend}</div>
                          <div style={{ height: '120px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '20px 20px 0 0', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'rgba(251, 191, 36, 0.2)', fontSize: '3rem' }}>1</div>
                        </div>

                        {/* 3rd Place */}
                        <div style={{ textAlign: 'center', width: '150px' }}>
                          <div style={{ position: 'relative', marginBottom: '15px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(45deg, #b45309, #d97706)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid rgba(255,255,255,0.1)' }}>
                              <span style={{ fontSize: '2rem' }}>🥉</span>
                            </div>
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{leaderboardData[2].name}</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#d97706' }}>{leaderboardData[2].monthlySpend}</div>
                          <div style={{ height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px 15px 0 0', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'rgba(255,255,255,0.1)', fontSize: '2rem' }}>3</div>
                        </div>
                      </div>
                    )}

                    {/* LIST SECTION (Ranks 4-10) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {leaderboardData.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🕯️</div>
                          <p style={{ fontSize: '1.2rem' }}>No champions yet this month. Be the first!</p>
                        </div>
                      ) : (
                        leaderboardData.slice(leaderboardData.length >= 3 ? 3 : 0).map((item, idx) => {
                          const actualRank = (leaderboardData.length >= 3 ? 3 : 0) + idx + 1;
                          return (
                            <div key={idx} style={{
                              display: 'flex', alignItems: 'center', gap: '20px', padding: '18px 25px',
                              borderRadius: '24px', background: item.isMe ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.03)',
                              border: item.isMe ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                              transition: '0.3s'
                            }}>
                              <div style={{ width: '40px', fontSize: '1.2rem', fontWeight: 900, color: '#64748b' }}>#{actualRank}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{item.name} {item.isMe && <span style={{ fontSize: '0.7rem', color: '#fff', background: '#6366f1', padding: '3px 10px', borderRadius: '50px', marginLeft: '10px' }}>YOU</span>}</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.country}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fbbf24' }}>{item.monthlySpend}</div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Coins Spent</div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LEADERBOARD BUTTON */}
        {!isLeaderboardOpen && (
          <div className="zonemeetbot-widget" style={{ bottom: '100px' }}>
            <button className="bot-toggle-btn" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4)' }} onClick={() => { setIsLeaderboardOpen(true); fetchLeaderboard(); }}>
              <span className="bot-icon">🏆</span>
              <span className="bot-tooltip">Leaderboard</span>
            </button>
          </div>
        )}

        {/* COIN UTILITY GUIDE */}
        <div className="coin-utility-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px', padding: '0 20px' }}>
          <div className="utility-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚡</div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Profile Boost</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Get matched 5x faster for 10 minutes.</p>
            <div style={{ marginTop: '15px', fontWeight: '800', color: '#fbbf24' }}>100 Coins</div>
          </div>
          <div className="utility-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔄</div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Reconnect</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Missed a cool person? Request to chat again.</p>
            <div style={{ marginTop: '15px', fontWeight: '800', color: '#6366f1' }}>30 Coins</div>
          </div>
          <div className="utility-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👑</div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>VIP Privileges</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Coins are included free in VIP plans.</p>
            <div style={{ marginTop: '15px', fontWeight: '800', color: '#ec4899' }}>Free for VIPs</div>
          </div>
        </div>

        {/* CURRENCY TOGGLE FOR COINS */}
        <div className="currency-selector" style={{ marginTop: '20px', marginBottom: '20px' }}>
          <div className="currency-pill">
            <button
              className={currency === "INR" ? "active" : ""}
              onClick={() => setCurrency("INR")}
            >
              INR (₹)
            </button>
            <button
              className={currency === "USD" ? "active" : ""}
              onClick={() => setCurrency("USD")}
            >
              USD ($)
            </button>
          </div>
        </div>

        <div className="pricing-grid coins-grid">
          {[
            { name: "100 Coins Pack", base: 100, bonus: 0,   price: 79,  usdPrice: 0.99, icon: "🪙", color: "#94a3b8", tag: "Starter"      },
            { name: "200 Coins Pack", base: 150, bonus: 50,  price: 149, usdPrice: 1.79, icon: "💰", color: "#fbbf24", tag: "⭐ Popular"   },
            { name: "500 Coins Pack", base: 350, bonus: 150, price: 299, usdPrice: 3.59, icon: "💎", color: "#6366f1", tag: "🔥 Best Deal" },
            { name: "1300 Coins Pack",base: 1000,bonus: 300, price: 699, usdPrice: 8.49, icon: "👑", color: "#ec4899", tag: "💎 Ultimate"  }
          ].map((pkg, idx) => (
            <div className="coin-square-card" key={idx} style={{ borderTop: `4px solid ${pkg.color}` }} onClick={() => {
              setSelectedPlan({ name: pkg.name, price: currency === "INR" ? `₹${pkg.price}` : `$${pkg.usdPrice}` });
              setPaymentStep("methods");
              setShowPaymentModal(true);
              setIsGifting(false);
              setGiftRecipientId("");
            }}>
              {pkg.tag && <div className="coin-mini-badge" style={{ background: pkg.color }}>{pkg.tag}</div>}
              <div className="coin-card-icon">{pkg.icon}</div>
              <div className="coin-card-name">
                {pkg.base} Coins
                {pkg.bonus > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', display: 'block', marginTop: '2px' }}>+{pkg.bonus} Bonus!</span>}
              </div>
              <div className="coin-card-price">
                <span className="price-now">{currency === "INR" ? `₹${pkg.price}` : `$${pkg.usdPrice}`}</span>
              </div>
            </div>
          ))}
        </div>


        {/* COIN USAGE TRANSPARENCY / ACTIVITY FOR USER */}
        <div className="glass-card" style={{ marginTop: '50px', background: 'rgba(255,255,255,0.02)', padding: '40px', borderRadius: '35px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Coin Usage <span>Transparency</span></h2>
              <p style={{ color: '#94a3b8', marginTop: '5px' }}>Click on a card to purchase or activate a feature instantly.</p>
            </div>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px 20px', borderRadius: '15px', color: '#6366f1', fontWeight: '800' }}>
              LIVE RATE CARD
            </div>
          </div>

          <div className="stats-row">
            <div
              className="transparency-card"
              onClick={() => buyFeature('Profile Boost', 100)}
              style={{ padding: '25px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '24px', border: '1px solid rgba(99, 102, 241, 0.2)', cursor: 'pointer', transition: '0.3s' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <small style={{ color: '#6366f1', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>Profile Boost</small>
                <span style={{ fontSize: '1.2rem' }}>🚀</span>
              </div>
              <h3 style={{ fontSize: '1.5rem', margin: '15px 0' }}>100 Coins</h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.5' }}>Get 10 minutes of peak visibility. You'll be the first person seen by thousands of global users.</p>
              <div className="buy-badge">Click to Activate</div>
            </div>

            <div
              className="transparency-card"
              onClick={() => buyFeature('Secret Identity', 500)}
              style={{ padding: '25px', background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05), rgba(168, 85, 247, 0.05))', borderRadius: '24px', border: '1px solid rgba(236, 72, 153, 0.2)', cursor: 'pointer', transition: '0.3s' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <small style={{ color: '#ec4899', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>Secret Identity Mode</small>
                <span style={{ fontSize: '1.2rem' }}>🎭</span>
              </div>
              <h3 style={{ fontSize: '1.5rem', margin: '15px 0' }}>500 Coins <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>/ 7 Days</span></h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.5' }}>Voice Change, Animated Avatars, Blurred Face & Animated Masks. The ultimate ninja mode.</p>
              <div className="buy-badge" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>Click to Purchase</div>
            </div>

            <div style={{ display: 'grid', gridTemplateRows: '1fr', gap: '20px' }}>
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <small style={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase' }}>Direct Reconnect</small>
                  <span>📞</span>
                </div>
                <h4 style={{ fontSize: '1.1rem', margin: '8px 0' }}>30 Coins</h4>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* PREMIUM PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="payment-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowPaymentModal(false)}>×</button>

            <div className="modal-header-premium">
              <div className="plan-pill">{selectedPlan?.name}</div>
              <h2 className="total-amount">{selectedPlan?.price}</h2>
              <p className="modal-subtitle">Secure checkout powered by ZoneMeet Secure</p>
            </div>

            <div className="modal-body-premium">
              {paymentStep === "methods" ? (
                <div className="payment-flow">
                  <h3 className="flow-title">Select Payment Method</h3>

                  {/* Gifting Toggle */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '15px', borderRadius: '20px', marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: isGifting ? '15px' : '0' }}>
                      <input
                        type="checkbox"
                        checked={isGifting}
                        onChange={(e) => setIsGifting(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '700' }}>🎁 Gift this to a friend?</span>
                    </label>

                    {isGifting && (
                      <div style={{ animation: 'fadeIn 0.3s' }}>
                        <input
                          type="text"
                          placeholder="Friend's User ID or Email"
                          value={giftRecipientId}
                          onChange={(e) => setGiftRecipientId(e.target.value)}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 15px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                        />
                        <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '8px', padding: '0 5px' }}>
                          The coins/plan will be credited to this user instantly after payment.
                        </p>
                      </div>
                    )}

                    {/* Auto Renew Toggle (Only for Subscriptions) */}
                    {selectedPlan && !selectedPlan.name.includes("Coins") && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <input
                          type="checkbox"
                          checked={isAutoRenew}
                          onChange={(e) => setIsAutoRenew(e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <div>
                          <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '700', display: 'block' }}>🔄 Auto-Renew Subscription</span>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Automatically renew this plan. Cancel anytime.</span>
                        </div>
                      </label>
                    )}
                  </div>

                  <div className="methods-list-premium">
                    {currency === "INR" ? (
                      <>
                        <div className="gateway-section-label">🇮🇳 Indian Payment Methods (via Cashfree)</div>
                        <button className="pay-method-item" onClick={() => handleCashfreePayment()}>
                          <div className="pay-icon-box">📱</div>
                          <div className="pay-details"><strong>UPI Payment</strong><span>GPay, PhonePe, Paytm via Cashfree</span></div>
                          <div className="pay-badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Cashfree</div>
                          <div className="pay-arrow">›</div>
                        </button>
                        <button className="pay-method-item" onClick={() => handleCashfreePayment()}>
                          <div className="pay-icon-box">💳</div>
                          <div className="pay-details"><strong>Debit / Credit Card</strong><span>Visa, Mastercard, RuPay via Cashfree</span></div>
                          <div className="pay-badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Cashfree</div>
                          <div className="pay-arrow">›</div>
                        </button>
                        <button className="pay-method-item" onClick={() => handleCashfreePayment()}>
                          <div className="pay-icon-box">🏦</div>
                          <div className="pay-details"><strong>Net Banking</strong><span>All Major Indian Banks via Cashfree</span></div>
                          <div className="pay-badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Cashfree</div>
                          <div className="pay-arrow">›</div>
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="gateway-section-label">🌍 International Payment Methods</div>
                        <button className="pay-method-item" onClick={() => handlePaypalPayment()}>
                          <div className="pay-icon-box">🅿️</div>
                          <div className="pay-details"><strong>PayPal</strong><span>Pay with PayPal balance or card</span></div>
                          <div className="pay-badge" style={{ background: 'rgba(0,112,192,0.15)', color: '#0070c0' }}>PayPal</div>
                          <div className="pay-arrow">›</div>
                        </button>
                        <button className="pay-method-item" onClick={() => handleStripePayment()} style={{ opacity: 0.6, position: 'relative' }}>
                          <div className="pay-icon-box">💳</div>
                          <div className="pay-details"><strong>Stripe / Card</strong><span>Visa, Mastercard, AMEX worldwide</span></div>
                          <div className="pay-badge" style={{ background: 'rgba(255,165,0,0.15)', color: '#ff9800' }}>Coming Soon</div>
                          <div className="pay-arrow">›</div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : paymentStep === "processing" ? (
                <div className="status-container processing">
                  <div className="premium-loader"></div>
                  <h3>Confirming Payment</h3>
                  <p>Establishing secure connection to gateway...</p>
                  <button className="btn-cancel-payment" onClick={() => setPaymentStep("methods")}>Cancel Transaction</button>
                </div>
              ) : (
                <div className="status-container success">
                  <div className="success-glow">✓</div>
                  <h3>Transaction Successful</h3>
                  <p>Your premium features are now unlocked.</p>
                  <button className="btn-start-pro" onClick={() => {
                    const updatedUser = { ...user, premium: true, planName: selectedPlan.name };
                    setUser(updatedUser);
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    setShowPaymentModal(false);
                    setPaymentStep("methods");
                  }}>Start Using Pro</button>
                </div>
              )}
            </div>

            <div className="modal-footer-premium">
              <div className="security-tag">
                <span className="lock-icon">🔒</span>
                End-to-end 256-bit encrypted
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ONBOARDING MODAL */}
      {showOnboarding && (
        <div className="payment-overlay" style={{ zIndex: 10000 }}>
          <div className="premium-modal" style={{ maxWidth: '450px', padding: '2.5rem' }}>
            <div className="modal-header">
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👋</div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Almost There!</h2>
              <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Tell us a bit about yourself to get started.</p>
            </div>

            <form onSubmit={handleOnboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '2rem' }}>
              <div className="input-group" style={{ textAlign: 'left' }}>
                <label style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Gender</label>
                <select
                  className="styled-select"
                  style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.75rem', borderRadius: '12px' }}
                  value={onboardForm.gender}
                  onChange={(e) => setOnboardForm({ ...onboardForm, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="input-row" style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1, textAlign: 'left' }}>
                  <label style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Country</label>
                  <select
                    className="styled-select"
                    style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.75rem', borderRadius: '12px' }}
                    value={onboardForm.countryCode}
                    onChange={async (e) => {
                      const val = e.target.value;
                      const { State } = await import("country-state-city");
                      const states = State.getStatesOfCountry(val);
                      setOnboardForm({ ...onboardForm, countryCode: val, stateCode: states.length > 0 ? states[0].isoCode : "" });
                      setStatesList(states);
                    }}
                  >
                    {countriesList.length === 0 ? (
                      <option value="IN">🇮🇳 India</option>
                    ) : (
                      countriesList.map(c => (
                        <option key={c.isoCode} value={c.isoCode}>{c.flag} {c.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="input-group" style={{ flex: 1, textAlign: 'left' }}>
                  <label style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Age</label>
                  <select
                    className="styled-select"
                    style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.75rem', borderRadius: '12px' }}
                    value={onboardForm.age}
                    onChange={(e) => setOnboardForm({ ...onboardForm, age: e.target.value })}
                  >
                    <option value="18-24">18-24</option>
                    <option value="25-34">25-34</option>
                    <option value="35-44">35-44</option>
                    <option value="45-54">45-54</option>
                    <option value="55+">55+</option>
                  </select>
                </div>
              </div>

              <div className="input-group" style={{ textAlign: 'left' }}>
                <label style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>State / Province</label>
                <select
                  className="styled-select"
                  style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.75rem', borderRadius: '12px' }}
                  value={onboardForm.stateCode}
                  onChange={(e) => setOnboardForm({ ...onboardForm, stateCode: e.target.value })}
                >
                  {statesList.length > 0 ? (
                    statesList.map(s => (
                      <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                    ))
                  ) : (
                    <option value="">Other / Not Specified</option>
                  )}
                </select>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1rem', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none', borderRadius: '16px' }}>
                Start My Journey
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DAILY STREAK MODAL */}
      {showStreakModal && (() => {
        const currentStreak = dailyStatus?.streak_day || user?.streak_day || 1;
        const coinsBalance = user?.coins || 0;
        const isBroken = dailyStatus?.status === 'streak_broken' || user?.streak_broken;
        const canCollect = dailyStatus?.canCollect && !isBroken;
        const hasEnoughToSave = coinsBalance >= 100;

        const DAILY_REWARDS = [
          { day: 1, text: "10 Coins", icon: "🪙", label: "Day 1" },
          { day: 2, text: "20 Coins", icon: "🪙", label: "Day 2" },
          { day: 3, text: "30 Coins", icon: "🪙", label: "Day 3" },
          { day: 4, text: "10 Min Boost", icon: "🚀", label: "Day 4" },
          { day: 5, text: "50 Coins", icon: "🪙", label: "Day 5" },
          { day: 6, text: "75 Coins", icon: "🪙", label: "Day 6" },
          { day: 7, text: "Grand Reward", icon: "👑", label: "Day 7" }
        ];

        const todayRewardText = DAILY_REWARDS[currentStreak - 1]?.text || "";

        return (
          <div className="payment-overlay" style={{ zIndex: 11000 }} onClick={() => setShowStreakModal(false)}>
            <div className="streak-reward-modal" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowStreakModal(false)} className="streak-modal-close">×</button>
              
              <div className="streak-modal-top">
                <div className="streak-big-fire">{isBroken ? '💔' : currentStreak >= 7 ? '👑' : '🔥'}</div>
                <h2 className="streak-modal-title">
                  {isBroken ? 'Streak Broken!' : currentStreak >= 7 && !canCollect ? '🎉 Cycle Complete!' : 'Daily Login Streak'}
                </h2>
                <p className="streak-modal-sub">
                  {isBroken
                    ? `Your streak has been broken 🔥`
                    : canCollect
                      ? `Collect your Day ${currentStreak} reward today!`
                      : `You claimed Day ${currentStreak} reward. Come back tomorrow!`}
                </p>
              </div>

              {/* Mobile-first Reward Card Stats */}
              <div className="streak-stats-card">
                <div className="streak-stat-box">
                  <span className="streak-stat-icon">🔥</span>
                  <div className="streak-stat-info">
                    <small>Streak</small>
                    <strong>Day {isBroken ? (dailyStatus?.oldStreak || currentStreak) : currentStreak}</strong>
                  </div>
                </div>
                <div className="streak-stat-box">
                  <span className="streak-stat-icon">🎁</span>
                  <div className="streak-stat-info">
                    <small>Today's Reward</small>
                    <strong style={{ fontSize: '0.75rem' }}>
                      {isBroken ? 'Pending Savior' : (canCollect ? todayRewardText : 'Completed')}
                    </strong>
                  </div>
                </div>
                <div className="streak-stat-box">
                  <span className="streak-stat-icon">💰</span>
                  <div className="streak-stat-info">
                    <small>Coins</small>
                    <strong>{coinsBalance}</strong>
                  </div>
                </div>
              </div>

              {/* 7-Day Grid */}
              <div className="streak-days-grid">
                {DAILY_REWARDS.map(({ day, text, icon, label }) => {
                  const done = isBroken ? false : (day < currentStreak || (day === currentStreak && !canCollect));
                  const isToday = !isBroken && (day === currentStreak && canCollect);
                  const isLocked = isBroken ? true : (day > currentStreak);
                  const isGrand = day === 7;

                  return (
                    <div key={day} className={`streak-day-card ${done ? 'done' : ''} ${isToday ? 'today' : ''} ${isLocked ? 'locked' : ''} ${isGrand ? 'grand' : ''}`}>
                      {done && <div className="streak-check">✓</div>}
                      {isLocked && <div className="streak-lock-overlay">🔒</div>}
                      <div className="streak-day-icon" style={{ filter: isLocked ? 'grayscale(100%)' : 'none' }}>{icon}</div>
                      <div className="streak-day-coins" style={{ fontSize: '0.62rem', whiteSpace: 'nowrap' }}>{text}</div>
                      <div className="streak-day-label">{label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              {!isBroken && (
                <div className="streak-progress-wrap" style={{ marginBottom: '1.5rem' }}>
                  <div className="streak-progress-fill" style={{ width: `${Math.min(((canCollect ? currentStreak - 1 : currentStreak) / 7) * 100, 100)}%` }} />
                  <span className="streak-progress-text">
                    {canCollect ? currentStreak - 1 : currentStreak}/7 days completed
                  </span>
                </div>
              )}

              {/* Action Buttons / Broken Screen */}
              {isBroken ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '20px', borderRadius: '24px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#fca5a5', lineHeight: '1.5' }}>
                    Spend <strong style={{ color: '#fff' }}>100 Coins</strong> to save your streak?
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button 
                      className="streak-cta-btn broken" 
                      onClick={saveStreak}
                      disabled={!hasEnoughToSave}
                      style={{ 
                        background: hasEnoughToSave ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : '#334155', 
                        color: hasEnoughToSave ? '#000' : '#94a3b8',
                        cursor: hasEnoughToSave ? 'pointer' : 'not-allowed',
                        fontWeight: '800'
                      }}
                    >
                      🛡️ Save Streak (100 Coins)
                    </button>
                    {!hasEnoughToSave && (
                      <p style={{ margin: '0', fontSize: '0.75rem', color: '#f87171' }}>
                        Insufficient coins to save streak.
                      </p>
                    )}
                    <button 
                      className="streak-skip-btn" 
                      onClick={resetStreak}
                      style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        color: '#cbd5e1', 
                        padding: '12px', 
                        borderRadius: '16px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '0.85rem'
                      }}
                    >
                      Reset Streak (Start fresh from Day 1)
                    </button>
                  </div>
                </div>
              ) : canCollect ? (
                <button className={`streak-cta-btn ${currentStreak >= 7 ? 'grand' : 'normal'}`} onClick={collectDailyReward}>
                  {currentStreak >= 7 ? `👑 Claim Grand Prize — +100 Coins & Boost!` : `🎁 Collect Today's Reward — ${todayRewardText}`}
                </button>
              ) : (
                <button className="streak-cta-btn normal" style={{ opacity: 0.7, cursor: 'default' }} onClick={() => setShowStreakModal(false)}>
                  ✅ Already Claimed Today! Come back tomorrow
                </button>
              )}
            </div>
          </div>
        );
      })()}


      {/* HISTORY MODAL */}
      {showHistoryModal && (
        <div className="payment-overlay" style={{ zIndex: 11000 }} onClick={() => setShowHistoryModal(false)}>
          <div className="premium-modal history-modal-v2" onClick={e => e.stopPropagation()}>
            <div className="history-header">
              <span className="history-title">🕒 Recent Connections</span>
              <button className="history-close-btn" onClick={() => setShowHistoryModal(false)}>×</button>
            </div>
            <div className="history-body">
              {(!user?.recentStrangers || user.recentStrangers.length === 0) ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#475569' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🫥</div>
                  <p style={{ fontWeight: 600 }}>No recent connections yet.</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Start a chat to see your history here.</p>
                </div>
              ) : (
                user.recentStrangers.map((s, idx) => (
                  <div key={idx} className="history-item" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', marginBottom: '12px' }}>
                    
                    {/* Top Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#94a3b8' }}>
                        <span>{new Date(s.timestamp).toLocaleString([], { month: '2-digit', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          {(() => {
                            const diff = Date.now() - new Date(s.timestamp).getTime();
                            const mins = Math.floor(diff / 60000);
                            const hrs = Math.floor(mins / 60);
                            const days = Math.floor(hrs / 24);
                            if (days > 0) return `${days}d ago`;
                            if (hrs > 0) return `${hrs}h ago`;
                            if (mins > 0) return `${mins}m ago`;
                            return 'Just now';
                          })()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => {
                          setHistoryReportTarget(s);
                          setShowHistoryReportModal(true);
                        }} style={{ background: '#e11d48', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>👮</button>
                        <button onClick={async () => {
                          const updated = user.recentStrangers.filter((_, i) => i !== idx);
                          setUser({ ...user, recentStrangers: updated });
                          try {
                            const token = localStorage.getItem('token');
                            await axios.post('https://api.zonemeet.chat/api/user/delete-history', { targetId: s.id }, { headers: { Authorization: `Bearer ${token}` } });
                            showModal({ message: 'Removed from history', type: 'success' });
                          } catch (err) {
                            showModal({ message: 'Failed to delete', type: 'error' });
                          }
                        }} style={{ background: '#1e293b', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', padding: 0 }}>🗑️</button>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                      <div className="history-item-left" style={{ gap: '16px' }}>
                        <div className="history-avatar" style={{ width: '48px', height: '48px' }}>
                          {s.name ? s.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="history-details">
                          <div className="history-name" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {s.name} 👱
                          </div>
                          <div className="history-info" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                            📍 {s.country || "Earth"}
                          </div>
                        </div>
                      </div>
                      <button
                        className="history-reconnect-btn"
                        style={{
                          background: '#fde047', 
                          border: 'none', 
                          borderRadius: '50%', 
                          width: '44px', 
                          height: '44px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          boxShadow: '0 4px 10px rgba(253, 224, 71, 0.3)',
                          cursor: 'pointer',
                          padding: '0'
                        }}
                        onClick={() => setReconnectConfirm(s)}
                      >
                        <span style={{ fontSize: '1.2rem', background: 'white', borderRadius: '4px', padding: '2px 4px', display: 'flex' }}>💌</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* HISTORY REPORT MODAL */}
      {/* RECONNECT CONFIRMATION POPUP */}
      {reconnectConfirm && (
        <div className="payment-overlay" style={{ zIndex: 12000 }} onClick={() => setReconnectConfirm(null)}>
          <div className="premium-modal" style={{ maxWidth: '400px', padding: '0', overflow: 'hidden', background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '28px', boxShadow: '0 50px 100px rgba(0,0,0,0.8)' }} onClick={e => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={() => setReconnectConfirm(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            <div style={{ height: '6px', background: 'linear-gradient(90deg, #fbbf24, #f59e0b)' }}></div>
            <div style={{ padding: '35px 30px', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '15px', filter: 'drop-shadow(0 8px 16px rgba(251,191,36,0.3))' }}>💌</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>Reconnect Request</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '8px' }}>
                Send a reconnect request to <strong style={{ color: '#fbbf24' }}>{reconnectConfirm.name}</strong>?
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', padding: '8px 18px', borderRadius: '50px', marginBottom: '25px' }}>
                <span style={{ fontSize: '1.2rem' }}>🪙</span>
                <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: '1rem' }}>30 Coins</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setReconnectConfirm(null)} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: '0.2s' }}>Cancel</button>
                <button onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const res = await axios.post('https://api.zonemeet.chat/api/user/reconnect-call', { targetId: reconnectConfirm.id }, { headers: { Authorization: `Bearer ${token}` } });
                    
                    if (res.data.success) {
                      setUser({ ...user, coins: res.data.coins });
                      if (res.data.status === "calling") {
                        showModal({ message: `Calling ${reconnectConfirm.name}...`, type: "success" });
                        router.push(`/chat?room=${res.data.roomId}`);
                      } else {
                        showModal({ message: `${reconnectConfirm.name} is offline. Reconnect request sent!`, type: "success" });
                      }
                    }
                  } catch (err) {
                    showModal({ message: err.response?.data?.message || 'Failed', type: "error" });
                  }
                  setReconnectConfirm(null);
                }} style={{ flex: 1.5, padding: '14px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 8px 20px rgba(251,191,36,0.3)', transition: '0.2s' }}>Confirm & Send</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY REPORT MODAL */}
      {showHistoryReportModal && historyReportTarget && (
        <div className="payment-overlay" style={{ zIndex: 12000 }} onClick={() => { setShowHistoryReportModal(false); setHistoryReportTarget(null); setHistoryReportReason(''); setHistoryReportDetails(''); }}>
          <div className="premium-modal" style={{ maxWidth: '400px', padding: '30px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => { setShowHistoryReportModal(false); setHistoryReportTarget(null); setHistoryReportReason(''); setHistoryReportDetails(''); }}>×</button>
            <h2 style={{ marginBottom: '15px', color: '#ef4444' }}>🚨 Report User</h2>
            <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '0.9rem' }}>
              Reporting: <strong style={{ color: '#fff' }}>{historyReportTarget.name}</strong>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {["Nudity / NSFW", "Abuse / Harassment", "Spam", "Fake Profile", "Underage", "Violence", "Recording Screen", "Scammer"].map(reason => (
                <button
                  key={reason}
                  style={{
                    background: historyReportReason === reason ? '#ef4444' : 'rgba(255,255,255,0.05)',
                    color: 'white',
                    border: '1px solid',
                    borderColor: historyReportReason === reason ? '#ef4444' : 'rgba(255,255,255,0.1)',
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => setHistoryReportReason(reason)}
                >
                  {reason}
                </button>
              ))}
            </div>
            <textarea
              style={{ width: '100%', padding: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', minHeight: '80px', marginBottom: '20px' }}
              placeholder="Additional details (optional)..."
              value={historyReportDetails}
              onChange={(e) => setHistoryReportDetails(e.target.value)}
            />
            <button style={{ width: '100%', padding: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }} onClick={async () => {
              if (!historyReportReason) { showModal({ message: 'Please select a reason', type: 'warning' }); return; }
              try {
                const token = localStorage.getItem('token');
                await axios.post('https://api.zonemeet.chat/api/report', {
                  targetId: historyReportTarget.id,
                  reason: historyReportReason,
                  details: historyReportDetails
                }, { headers: { Authorization: `Bearer ${token}` } });
                showModal({ message: 'Report submitted successfully!', type: 'success' });
                setShowHistoryReportModal(false);
                setHistoryReportTarget(null);
                setHistoryReportReason('');
                setHistoryReportDetails('');
              } catch (err) {
                showModal({ message: 'Failed to submit report', type: 'error' });
              }
            }}>Submit Report</button>
          </div>
        </div>
      )}

      {/* ZONEMEET AI CHATBOT WIDGET */}
      <div className="zonemeetbot-widget">
        {!isBotOpen ? (
          <button className="bot-toggle-btn" onClick={() => setIsBotOpen(true)}>
            <span className="bot-icon">🤖</span>
            <span className="bot-tooltip">24/7 AI Support</span>
          </button>
        ) : (
          <div className="bot-window">
            <div className="bot-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="bot-avatar">🤖</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>ZoneMeet AI</div>
                  <div style={{ fontSize: '0.7rem', color: '#10b981' }}>● Online 24/7</div>
                </div>
              </div>
              <button className="bot-close" onClick={() => setIsBotOpen(false)}>&times;</button>
            </div>
            <div className="bot-body">
              {botMessages.map((msg, idx) => (
                <div key={idx} className={`bot-msg-row ${msg.sender}`}>
                  <div className={`bot-msg-bubble ${msg.sender}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={botEndRef} />
            </div>
            <form className="bot-input-area" onSubmit={handleBotSubmit}>
              <input
                type="text"
                placeholder="Ask anything..."
                value={botInput}
                onChange={(e) => setBotInput(e.target.value)}
              />
              <button type="submit">→</button>
            </form>
          </div>
        )}
      </div>


      {/* MYSTERY BOXES SECTION (MOVED TO BOTTOM) */}
      <div className="mystery-box-section" style={{ marginTop: '100px', marginBottom: '100px', padding: '0 20px', position: 'relative' }}>
        {/* Background Glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '80%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)', zIndex: -1 }}></div>

        <div className="pricing-header" style={{ marginBottom: '60px' }}>
          <h2 className="section-title" style={{ fontSize: '3rem', letterSpacing: '-2px' }}>Mystery <span>Treasures</span></h2>
          <p className="section-subtitle" style={{ fontSize: '1.2rem', color: '#94a3b8' }}>Try your luck and win exclusive rewards and VIP statuses!</p>
          <button
            onClick={() => setShowBoxInfo(true)}
            style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              color: '#fbbf24',
              padding: '12px 24px',
              borderRadius: '30px',
              fontWeight: '800',
              marginTop: '10px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              transition: '0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(251, 191, 36, 0.1)'}
          >
            📜 Prize Catalog & Probabilities
          </button>
        </div>

        <div className="mystery-grid">
          {[
            { type: "bronze", name: "Bronze Case", price: 50, icon: "📦", color: "#cd7f32", glow: "rgba(205, 127, 50, 0.4)", rarity: "Common" },
            { type: "silver", name: "Silver Vault", price: 150, icon: "🎁", color: "#c0c0c0", glow: "rgba(192, 192, 192, 0.4)", rarity: "Rare" },
            { type: "gold", name: "Golden Chest", price: 500, icon: "✨", color: "#ffd700", glow: "rgba(255, 215, 0, 0.5)", rarity: "Legendary" }
          ].map((box, idx) => (
            <div
              className="mystery-card mystery-float"
              key={idx}
              onClick={() => !showSpinner && handleOpenBox(box.type)}
              style={{
                background: 'rgba(30, 41, 59, 0.4)',
                backdropFilter: 'blur(10px)',
                padding: '50px 30px',
                borderRadius: '40px',
                border: `1px solid ${box.color}33`,
                textAlign: 'center',
                cursor: showSpinner ? 'wait' : 'pointer',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 20px 40px rgba(0,0,0,0.3), inset 0 0 20px ${box.color}05`,
                animationDelay: `${idx * 0.2}s`
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-15px) scale(1.02)';
                e.currentTarget.style.borderColor = `${box.color}aa`;
                e.currentTarget.style.boxShadow = `0 30px 60px rgba(0,0,0,0.5), 0 0 30px ${box.color}33`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.borderColor = `${box.color}33`;
                e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.3), inset 0 0 20px ${box.color}05`;
              }}
            >
              <div className="box-rarity" style={{ position: 'absolute', top: '25px', right: '25px', background: `${box.color}22`, color: box.color, padding: '4px 12px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', border: `1px solid ${box.color}44` }}>
                {box.rarity}
              </div>

              <div style={{ fontSize: '5rem', marginBottom: '30px', position: 'relative', zIndex: 2, filter: `drop-shadow(0 0 20px ${box.glow})` }}>{box.icon}</div>

              <h3 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#fff', fontWeight: '900', position: 'relative', zIndex: 2 }}>{box.name}</h3>

              <div style={{
                background: `linear-gradient(135deg, ${box.color}22, rgba(0,0,0,0.2))`,
                padding: '12px 25px',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                fontWeight: '900',
                color: box.color,
                position: 'relative',
                zIndex: 2,
                border: `1px solid ${box.color}44`,
                fontSize: '1.1rem'
              }}>
                <span style={{ fontSize: '1.3rem' }}>🪙</span> {box.price} Coins
              </div>

              {/* Decorative Shine */}
              <div style={{ position: 'absolute', top: '-100%', left: '-100%', width: '300%', height: '300%', background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.03), transparent)', transform: 'rotate(45deg)', transition: '0.5s' }} className="card-shine"></div>
            </div>
          ))}
        </div>
      </div>

      {/* MYSTERY BOX MODALS */}
      {showBoxInfo && (
        <div className="payment-overlay" style={{ zIndex: 20000, backdropFilter: 'blur(15px)' }} onClick={() => setShowBoxInfo(false)}>
          <div className="premium-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%)', padding: '35px 30px 20px' }}>
              <button className="modal-close-btn" onClick={() => setShowBoxInfo(false)}>×</button>
              <h2 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-1px' }}>Prize <span>Catalog</span></h2>
              <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '5px' }}>Discover the treasures hidden within each Mystery Box.</p>
            </div>

            <div className="modal-body" style={{ padding: '0 30px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* INSTRUCTIONS */}
              <div style={{ background: 'rgba(99, 102, 241, 0.05)', borderRadius: '20px', padding: '15px 20px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <h5 style={{ color: '#6366f1', margin: '0 0 5px 0', fontSize: '0.9rem', fontWeight: 800 }}>📜 RULES & INFO</h5>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4' }}>
                  <li>Stickers are collected in your profile (Low price in Bronze/Silver, High price in Gold).</li>
                  <li>VIP Elite trial grants all premium features instantly.</li>
                  <li>Golden Box guarantees a prize every time!</li>
                </ul>
              </div>

              {/* BRONZE BOX */}
              <div style={{
                background: 'rgba(205, 127, 50, 0.03)',
                borderRadius: '24px',
                border: '1px solid rgba(205, 127, 50, 0.15)',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '15px 20px', background: 'rgba(205, 127, 50, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ color: '#cd7f32', margin: 0, fontWeight: 900, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.4rem' }}>📦</span> BRONZE TIER
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: '#cd7f32', fontWeight: 800, background: 'rgba(205,127,50,0.1)', padding: '4px 10px', borderRadius: '50px' }}>50 COINS</span>
                </div>
                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { label: 'Coin Rebate', val: '10-20 Coins', icon: '💰' },
                    { label: 'Profile Boost', val: '6-7 Minutes', icon: '🚀' },
                    { label: 'Rare Stickers', val: 'Heart / Rose', icon: '💝' },
                    { label: 'Elite Trial', val: '1 Hour VIP', icon: '👑' },
                    { label: 'Random Drop', val: 'Empty Luck', icon: '🍀' }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '14px' }}>
                      <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{item.label}</div>
                        <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 800 }}>{item.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SILVER BOX */}
              <div style={{
                background: 'rgba(192, 192, 192, 0.03)',
                borderRadius: '24px',
                border: '1px solid rgba(192, 192, 192, 0.15)',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '15px 20px', background: 'rgba(192, 192, 192, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ color: '#c0c0c0', margin: 0, fontWeight: 900, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.4rem' }}>🎁</span> SILVER TIER
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: '#c0c0c0', fontWeight: 800, background: 'rgba(192,192,192,0.1)', padding: '4px 10px', borderRadius: '50px' }}>150 COINS</span>
                </div>
                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { label: 'Silver Rebate', val: '40-80 Coins', icon: '💰' },
                    { label: 'Massive Boost', val: '15-20 Minutes', icon: '⚡' },
                    { label: 'Premium Gifts', val: 'Diamond/Rose', icon: '💎' },
                    { label: 'VIP Pass', val: '6 Hours', icon: '👑' },
                    { label: 'Random Drop', val: 'Empty Luck', icon: '🍀' }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '14px' }}>
                      <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{item.label}</div>
                        <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 800 }}>{item.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GOLD BOX */}
              <div style={{
                background: 'rgba(255, 215, 0, 0.05)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                overflow: 'hidden',
                boxShadow: '0 0 30px rgba(255, 215, 0, 0.05)'
              }}>
                <div style={{ padding: '15px 20px', background: 'rgba(255, 215, 0, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ color: '#ffd700', margin: 0, fontWeight: 900, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.4rem' }}>✨</span> GOLDEN TIER
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', color: '#ffd700', fontWeight: 900, background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '6px' }}>NO LOSS GUARANTEE</span>
                    <span style={{ fontSize: '0.8rem', color: '#ffd700', fontWeight: 800, background: 'rgba(255,215,0,0.1)', padding: '4px 10px', borderRadius: '50px' }}>500 COINS</span>
                  </div>
                </div>
                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  {[
                    { label: 'Ultra Boost', val: '1-2 Hours', icon: '🔥' },
                    { label: 'Luxury Gifts', val: 'Crown/Supercar', icon: '🏎️' },
                    { label: 'Elite Pass', val: '2 Full Days', icon: '👑' }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,0,0.03)', padding: '15px', borderRadius: '18px', border: '1px solid rgba(255,215,0,0.05)' }}>
                      <span style={{ fontSize: '1.8rem' }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#ffd700', fontWeight: 800, textTransform: 'uppercase' }}>{item.label}</div>
                        <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 900 }}>{item.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="payment-overlay" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 20000 }}>
          <div className="premium-modal" style={{
            maxWidth: '450px',
            padding: '0',
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            boxShadow: '0 50px 100px rgba(0,0,0,0.8)'
          }}>
            {/* Header with Box Color */}
            <div style={{
              height: '10px',
              background: confirmOpen === 'bronze' ? '#cd7f32' : confirmOpen === 'silver' ? '#c0c0c0' : '#ffd700',
              boxShadow: `0 0 20px ${confirmOpen === 'bronze' ? '#cd7f32' : confirmOpen === 'silver' ? '#c0c0c0' : '#ffd700'}55`
            }}></div>

            <div style={{ padding: '40px 30px' }}>
              <div style={{ fontSize: '5rem', marginBottom: '25px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }} className="mystery-float">
                {confirmOpen === 'bronze' ? '📦' : confirmOpen === 'silver' ? '🎁' : '✨'}
              </div>

              <h3 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '15px', color: '#fff', letterSpacing: '-1px' }}>
                Initiate <span style={{ color: confirmOpen === 'bronze' ? '#cd7f32' : confirmOpen === 'silver' ? '#c0c0c0' : '#ffd700' }}>{confirmOpen === 'bronze' ? 'Common' : confirmOpen === 'silver' ? 'Rare' : 'Legendary'}</span> Unlock?
              </h3>

              <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '35px' }}>
                {user.email === "ds9376314@gmail.com"
                  ? "Admin Privileges detected. Unlock this crate for zero cost."
                  : `You are about to authorize a spend of ${confirmOpen === 'bronze' ? 50 : confirmOpen === 'silver' ? 150 : 500} coins for this transaction.`}
              </p>

              <div style={{ display: 'flex', gap: '20px' }}>
                <button
                  onClick={() => startOpeningFlow(confirmOpen)}
                  style={{
                    flex: 1.5,
                    padding: '18px',
                    borderRadius: '20px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#fff',
                    fontWeight: '900',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)',
                    transition: '0.3s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Confirm & Open
                </button>
                <button
                  onClick={() => setConfirmOpen(null)}
                  style={{
                    flex: 1,
                    padding: '18px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)',
                    color: '#94a3b8',
                    fontWeight: '800',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: '0.3s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSpinner && (
        <div className="payment-overlay" style={{ background: 'rgba(2, 6, 23, 0.98)', backdropFilter: 'blur(30px)', zIndex: 20000 }}>
          <div className="spinner-container" style={{ textAlign: 'center', position: 'relative', maxWidth: '500px', width: '95%' }}>

            {/* Mechanical Frame */}
            <div className="slot-machine-frame" style={{
              background: 'linear-gradient(180deg, #334155 0%, #1e293b 100%)',
              padding: '30px',
              borderRadius: '60px',
              border: '8px solid #475569',
              boxShadow: '0 0 150px rgba(99, 102, 241, 0.4), inset 0 0 50px rgba(0,0,0,0.8)',
              position: 'relative'
            }}>
              {/* Flashing Side Lights */}
              <div style={{ position: 'absolute', top: '10%', left: '-15px', height: '80%', width: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: i % 2 === 0 ? '#fbbf24' : '#6366f1', animation: 'pulse 0.5s infinite alternate' }}></div>)}
              </div>
              <div style={{ position: 'absolute', top: '10%', right: '-15px', height: '80%', width: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: i % 2 === 0 ? '#6366f1' : '#fbbf24', animation: 'pulse 0.5s infinite alternate-reverse' }}></div>)}
              </div>

              <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: '900', marginBottom: '25px', letterSpacing: '5px', textTransform: 'uppercase', textShadow: '0 0 10px #6366f1' }}>
                🎰 Randomizing Rewards...
              </div>

              {/* Slot Windows */}
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                {[0, 1, 2].map((reelIdx) => (
                  <div key={reelIdx} className="spinner-window" style={{
                    background: '#020617',
                    height: '180px',
                    width: '120px',
                    borderRadius: '25px',
                    border: '3px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 20px 40px rgba(0,0,0,0.9)',
                    opacity: reelIdx === 1 ? 1 : 0.6,
                    transform: reelIdx === 1 ? 'scale(1.1)' : 'scale(0.95)',
                    zIndex: reelIdx === 1 ? 10 : 1
                  }}>
                    <div style={{
                      fontSize: '3.5rem',
                      position: 'relative',
                      filter: reelIdx === 1 ? 'none' : 'blur(2px)'
                    }} className="slot-spinning">
                      {spinnerItem}
                    </div>
                    {/* Glass Overlay Effect */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)', pointerEvents: 'none' }}></div>
                  </div>
                ))}
              </div>

              {/* Status Bar */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '30px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '20px' }}>
                <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: '800' }}>ENGINE STATUS:</div>
                <div style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: '900' }}>STABLE</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {revealPrize && (
        <div className="payment-overlay" style={{ background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(20px)', zIndex: 20000 }}>
          <div className="reveal-container" style={{ textAlign: 'center', maxWidth: '400px', width: '90%', position: 'relative' }}>

            {/* Celebration Lighting */}
            <div className={`reveal-glow ${revealPrize.isLoss ? 'loss-glow' : 'win-lighting'}`} style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '120%', height: '120%', zIndex: -1, borderRadius: '50%',
              background: revealPrize.isLoss
                ? 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, transparent 70%)'
            }}></div>

            <div className="reveal-card" style={{
              background: 'rgba(30, 41, 59, 0.8)',
              backdropFilter: 'blur(10px)',
              padding: '40px 30px',
              borderRadius: '40px',
              border: `2px solid ${revealPrize.isLoss ? 'rgba(239, 68, 68, 0.2)' : 'rgba(251, 191, 36, 0.3)'}`,
              position: 'relative',
              zIndex: 10,
              boxShadow: '0 30px 60px rgba(0,0,0,0.7)',
              animation: 'revealScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              <div style={{
                fontSize: '5rem', marginBottom: '20px',
                animation: revealPrize.isLoss ? 'shake 0.5s ease-in-out' : 'float 3s infinite',
                filter: `drop-shadow(0 0 20px ${revealPrize.isLoss ? 'rgba(239, 68, 68, 0.4)' : 'rgba(251, 191, 36, 0.6)'})`
              }}>
                {revealPrize.isLoss ? '💀' : '🎊'}
              </div>

              <h2 style={{ fontSize: '2.2rem', fontWeight: '950', marginBottom: '5px', color: '#fff', letterSpacing: '-1.5px' }}>
                {revealPrize.isLoss ? 'EMPTY' : 'JACKPOT!'}
              </h2>

              <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '30px' }}>
                {revealPrize.isLoss ? "Better luck next time!" : "You've secured a rare item!"}
              </p>

              <div className="prize-badge" style={{
                background: revealPrize.isLoss ? 'rgba(255,255,255,0.03)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                padding: '18px 30px', borderRadius: '25px', fontSize: '1.4rem', fontWeight: '900',
                color: revealPrize.isLoss ? '#475569' : '#000',
                boxShadow: revealPrize.isLoss ? 'none' : '0 10px 30px rgba(251, 191, 36, 0.3)',
                margin: '0 auto 30px', display: 'inline-block', border: revealPrize.isLoss ? '1px solid rgba(255,255,255,0.1)' : 'none'
              }}>
                {revealPrize.name}
              </div>

              <button
                onClick={() => setRevealPrize(null)}
                style={{
                  width: '100%', padding: '18px', borderRadius: '20px', border: 'none',
                  background: revealPrize.isLoss ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  color: revealPrize.isLoss ? '#fff' : '#000', fontWeight: '900', fontSize: '1rem',
                  cursor: 'pointer', transition: '0.3s'
                }}
              >
                Claim & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFERRAL / INVITE & EARN SECTION JUST ABOVE FOOTER */}
      {user && (
        <div id="referral-section" className="referral-section-container">
          {!referralStats ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: 'rgba(255,255,255,0.02)', borderRadius: '24px' }}>
              <div className="loading-dots">Loading Referral Link...</div>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 className="section-title">Invite <span>& Earn</span></h2>
                <p className="section-subtitle">Share your unique link. When a friend joins, you get <strong style={{ color: '#10b981' }}>+100 Coins</strong> FREE!</p>
              </div>

              <div className="referral-stats-grid">
                <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.05))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '25px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎯</div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#6366f1' }}>{referralStats?.referralCount || 0}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '5px' }}>Friends Invited</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', padding: '25px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>💰</div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981' }}>{referralStats?.referralCoinsEarned || 0}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '5px' }}>Coins Earned</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(236,72,153,0.05))', border: '1px solid rgba(236,72,153,0.3)', borderRadius: '20px', padding: '25px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🚀</div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ec4899' }}>100</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '5px' }}>Coins Per Referral</div>
                </div>
              </div>

              {/* Referral Link Box */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '30px' }}>
                <div style={{ marginBottom: '12px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Unique Referral Code</div>
                <div className="referral-flex-row" style={{ marginBottom: '20px' }}>
                  <div className="referral-input-box" style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 20px', fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: '800', color: '#fff', letterSpacing: '4px' }}>
                    {referralStats?.referralCode || "---"}
                  </div>
                  <button
                    onClick={() => {
                      if (!referralStats?.referralCode) return;
                      navigator.clipboard.writeText(referralStats.referralCode);
                      setReferralCopied(true);
                      setTimeout(() => setReferralCopied(false), 2000);
                    }}
                    className="referral-btn"
                    style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8', padding: '14px 20px', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                  >
                    {referralCopied ? '✅ Copied!' : '📋 Copy Code'}
                  </button>
                </div>

                <div style={{ marginBottom: '12px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Invite Link</div>
                <div className="referral-flex-row">
                  <div className="referral-input-box" style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 20px', fontSize: '0.85rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {typeof window !== 'undefined' ? `${window.location.origin}/?ref=${referralStats?.referralCode || ""}` : `zonemeet.com/?ref=${referralStats?.referralCode || ""}`}
                  </div>
                  <button
                    onClick={() => {
                      if (!referralStats?.referralCode) return;
                      const link = `${window.location.origin}/?ref=${referralStats.referralCode}`;
                      if (navigator.share) {
                        navigator.share({ title: 'Join ZoneMeet!', text: 'Join me on ZoneMeet — the premier global communication and professional networking platform!', url: link });
                      } else {
                        navigator.clipboard.writeText(link);
                        showModal({ message: 'Invite link copied! Share it with friends.', type: 'success' });
                      }
                    }}
                    className="referral-btn pink-gradient"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)', border: 'none', color: '#fff', padding: '14px 24px', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                  >
                    📤 Share Link
                  </button>
                </div>

                <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(16,185,129,0.05)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>💡</span>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Share your link with friends. When they sign up using your link, <strong style={{ color: '#10b981' }}>you instantly earn 100 Coins</strong>. No limit on referrals!</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div id="footer" style={{ textAlign: 'center', padding: '3rem 0 2rem', color: '#94a3b8', fontSize: '0.9rem', position: 'relative', zIndex: 10 }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '20px',
          padding: '20px 25px',
          maxWidth: '650px',
          margin: '0 auto 2.5rem',
          color: '#f87171',
          fontSize: '0.95rem',
          fontWeight: '800',
          lineHeight: '1.5',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          ⚠️ MANDATORY AGE COMPLIANCE & LEGAL NOTICE<br/>
          This website and its services are strictly restricted to users of age <strong>18 years and older</strong>. By accessing or using ZoneMeet, you certify and warrant that you are at least 18 years of age. Underage usage is strictly prohibited and subject to immediate permanent ban.
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', marginTop: '1rem' }}>
          <a href="/about" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: '700' }}>About Us</a>
          <a href="/omegle-alternative" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: '700' }}>Omegle Alternative</a>
          <a href="/faq" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: '700' }}>FAQs</a>
          <a href="/terms" style={{ color: '#6366f1', textDecoration: 'none' }}>Terms &amp; Conditions</a>
          <a href="/privacy" style={{ color: '#6366f1', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/refund" style={{ color: '#6366f1', textDecoration: 'none' }}>Refund Policy</a>
          <a href="/guidelines" style={{ color: '#6366f1', textDecoration: 'none' }}>Community Guidelines</a>
          <a href="/safety" style={{ color: '#ef4444', textDecoration: 'none', fontWeight: 'bold' }}>Safety &amp; 18+ Policy</a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('referral-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ color: '#10b981', textDecoration: 'none', fontWeight: '800' }}
          >
            🎁 Invite &amp; Earn
          </a>
          <a href="/contact" style={{ color: '#6366f1', textDecoration: 'none' }}>Contact Us</a>
        </div>
      </div>
      <style jsx>{`
          .auth-buttons {
            display: flex;
            gap: 1rem;
          }

          /* Profile Modal — desktop dropdown (original) */
          .profile-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(8px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .profile-modal-card {
            position: fixed;
            top: 85px;
            right: 4rem;
            background: #0f172a;
            border: 1px solid rgba(255,255,255,0.1);
            width: 100%;
            max-width: 360px;
            max-height: 80vh;
            border-radius: 28px;
            overflow-y: auto;
            box-shadow: 0 40px 100px rgba(0,0,0,0.5);
            animation: dropdownSlideDown 0.3s cubic-bezier(0.16,1,0.3,1);
            scrollbar-width: none;
            z-index: 1001;
          }
          .header-premium-mobile-only {
            display: none;
          }
          .header-sub-badge-desktop {
            display: inline-block;
            flex-shrink: 0;
          }
          @keyframes dropdownSlideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
          .profile-modal-card::-webkit-scrollbar { display: none; }
          .profile-modal-header { padding: 1.25rem 1.5rem; background: rgba(255,255,255,0.02); display: flex; justify-content: space-between; align-items: center; font-weight: 800; color: #64748b; font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.05); position: sticky; top: 0; background: #0f172a; z-index: 10; }
          .profile-modal-close { background: none; border: none; color: #94a3b8; font-size: 1.25rem; cursor: pointer; padding: 0.5rem; line-height: 1; }
          .profile-modal-body { padding: 1.5rem; }
          .profile-user-card { background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 20px; margin-bottom: 1.5rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem; border: 1px solid rgba(255,255,255,0.05); position: relative; }
          .profile-avatar-large { width: 70px; height: 70px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 900; color: white; border: 3px solid rgba(255,255,255,0.1); }
          .profile-user-info { width: 100%; }
          .profile-user-name { font-size: 1.1rem; font-weight: 800; color: white; margin-bottom: 0.25rem; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 6px; }
          .profile-user-id { color: #475569; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; }
          .profile-edit-btn { background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); color: #6366f1; padding: 0.35rem 0.8rem; border-radius: 10px; font-size: 0.7rem; font-weight: 800; cursor: pointer; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.05em; }
          .profile-edit-btn:hover { background: #6366f1; color: white; transform: scale(1.05); }
          .profile-premium-banner { background: linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(236,72,153,0.08) 100%); border: 1px solid rgba(99,102,241,0.2); padding: 1rem 1.25rem; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
          .active-sub-banner { box-shadow: 0 4px 15px rgba(99,102,241,0.15); }
          .toggle-switch { position: relative; display: inline-block; width: 34px; height: 20px; }
          .toggle-switch input { opacity: 0; width: 0; height: 0; }
          .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.1); transition: .4s; border-radius: 20px; }
          .toggle-slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
          input:checked + .toggle-slider { background-color: #10b981; }
          input:focus + .toggle-slider { box-shadow: 0 0 1px #10b981; }
          input:checked + .toggle-slider:before { transform: translateX(14px); }
          .profile-premium-title { display: block; color: white; font-weight: 800; font-size: 0.95rem; }
          .profile-premium-sub { color: #64748b; font-size: 0.75rem; }
          .profile-premium-btn { background: #6366f1; color: white; border: none; padding: 0.5rem 1rem; border-radius: 12px; font-weight: 800; font-size: 0.75rem; cursor: pointer; }
          .profile-balances { display: flex; background: rgba(0,0,0,0.2); border-radius: 16px; padding: 0.75rem; margin-bottom: 1.5rem; border: 1px solid rgba(255,255,255,0.03); }
          .profile-balance-item { flex: 1; text-align: center; font-weight: 800; color: white; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 6px; }
          .profile-balance-icon { font-size: 1.25rem; }
          .profile-balance-divider { width: 1px; background: rgba(255,255,255,0.05); height: 20px; margin: auto; }
          .profile-details-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
          .profile-detail-item { background: rgba(255,255,255,0.02); padding: 0.85rem 1.25rem; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.03); }
          .profile-detail-left { color: #64748b; font-size: 0.85rem; font-weight: 600; }
          .profile-detail-right { color: white; font-weight: 700; font-size: 0.85rem; }
          .profile-more-btn { width: 100%; background: none; border: none; border-bottom: 1px solid rgba(255,255,255,0.03); padding: 0.85rem 0.5rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.2s; }
          .profile-more-btn span { color: #334155; font-size: 1.1rem; }
          .profile-more-btn:hover { background: rgba(255,255,255,0.02); border-radius: 10px; padding-left: 1rem; }

          /* Base grid styles for stats-row and mystery-grid */
          .stats-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 25px;
            margin-bottom: 25px;
          }
          .mystery-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 40px;
            max-width: 1100px;
            margin: 0 auto;
          }
          .pricing-header { text-align: center; margin-bottom: 3.5rem; }
          .section-title { font-size: 3.5rem; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 1rem; }
          .section-title span { background: linear-gradient(135deg, #6366f1, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .section-subtitle { color: #94a3b8; font-size: 1.25rem; max-width: 600px; margin: 0 auto; }
          .currency-selector { display: flex; justify-content: center; margin-bottom: 4rem; }
          .currency-pill { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 0.4rem; border-radius: 16px; display: flex; gap: 0.5rem; }
          .currency-pill button { background: none; border: none; color: #64748b; padding: 0.6rem 1.8rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
          .currency-pill button.active { background: #6366f1; color: white; box-shadow: 0 10px 20px rgba(99,102,241,0.3); }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem 4rem;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: rgba(3, 7, 18, 0.7);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255,255,255,0.05);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .header-nav {
            display: flex;
            gap: 30px;
            align-items: center;
          }

          /* Desktop: 3-column grid — logo | nav (center) | streak/coins/profile */
          @media (min-width: 769px) {
            .header {
              display: grid !important;
              grid-template-columns: auto minmax(0, 1fr) auto;
              grid-template-areas: "brand nav actions";
              align-items: center;
              justify-content: stretch;
              gap: 12px 20px;
              padding: 1rem 1.5rem !important;
            }
            .brand-group {
              grid-area: brand;
              position: relative;
              z-index: 2;
              min-width: 0;
            }
            .header-premium-mobile-only {
              display: none !important;
            }
            .header-nav {
              grid-area: nav;
              position: static;
              left: auto;
              top: auto;
              transform: none;
              z-index: 1;
              justify-content: center;
              justify-self: center;
              flex-wrap: wrap;
              gap: clamp(16px, 1.35vw, 32px);
              max-width: 100%;
              min-width: 0;
              white-space: normal;
            }
            .user-dashboard-row,
            .user-info,
            .auth-buttons {
              grid-area: actions;
              position: relative;
              z-index: 2;
              margin-left: 0;
              justify-self: end;
              min-width: 0;
            }
          }

          @media (min-width: 769px) and (max-width: 1180px) {
            .header-nav {
              gap: 16px;
            }
            .header-nav .nav-link {
              font-size: 0.82rem !important;
            }
            .profile-trigger-name {
              display: none !important;
            }
            .user-dashboard-row {
              gap: 10px !important;
            }
            .network-status-pill {
              display: none !important;
            }
          }

          .user-dashboard-row {
            display: flex;
            align-items: center;
            gap: 20px;
            flex-shrink: 0;
            margin-left: auto;
          }

          .nav-link:hover {
            color: #fff !important;
            transform: translateY(-2px);
            text-shadow: 0 0 10px rgba(255,255,255,0.3);
          }

          .nav-link {
            position: relative;
          }

          .nav-link::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 0;
            height: 2px;
            background: linear-gradient(90deg, #6366f1, #ec4899);
            transition: width 0.3s;
          }

          .nav-link:hover::after {
            width: 100%;
          }

          .incoming-call-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(10px);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
          }

          .incoming-call-card {
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
            border: 1px solid rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 30px;
            text-align: center;
            width: 350px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.5);
            animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .call-avatar {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #6366f1, #ec4899);
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: 800;
            color: white;
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
          }

          .call-info h3 { font-size: 1.5rem; margin-bottom: 5px; color: white; }
          .call-info p { color: rgba(255,255,255,0.6); font-size: 0.9rem; margin-bottom: 30px; }

          .call-actions {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .accept-btn, .decline-btn {
            width: 100%;
            padding: 15px;
            border-radius: 15px;
            border: none;
            font-weight: 800;
            font-size: 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.2s;
          }

          .accept-btn {
            background: #10b981;
            color: white;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
          }

          .decline-btn {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.2);
          }

          .accept-btn:hover { transform: scale(1.02); background: #059669; }
          .decline-btn:hover { background: rgba(239, 68, 68, 0.2); }

          @keyframes scaleUp {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }

          .dashboard-hero {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding-top: 110px;
            padding-bottom: 5rem;
          }

          .hero-content {
            text-align: center;
            max-width: 800px;
            margin-bottom: 4rem;
            animation: fadeIn 0.8s ease-out;
            position: relative;
            z-index: 10;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .status-badge {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            padding: 0.5rem 1rem;
            border-radius: 30px;
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 2rem;
            color: #10b981;
            font-weight: 600;
            font-size: 0.9rem;
          }

          .dashboard-preview {
            width: 320px;
            height: 200px;
            background: #000;
            border-radius: 20px;
            margin: 0 auto 2rem;
            overflow: hidden;
            position: relative;
            border: 2px solid rgba(99, 102, 241, 0.3);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          }

          .dashboard-preview video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .preview-label {
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.5);
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 0.75rem;
            color: #fff;
            backdrop-filter: blur(4px);
          }

          .mystery-card:hover {
            transform: translateY(-15px) scale(1.05);
            border-color: rgba(255,255,255,0.2) !important;
            background: rgba(255,255,255,0.05) !important;
            box-shadow: 0 30px 60px rgba(0,0,0,0.4) !important;
          }
          .hero-title {
            font-size: 4.5rem;
            line-height: 1.1;
            font-weight: 800;
            margin-bottom: 1.5rem;
            letter-spacing: -0.04em;
          }

          .hero-title span {
            background: linear-gradient(to right, #6366f1, #ec4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .hero-description {
            font-size: 1.25rem;
            color: #94a3b8;
            margin-bottom: 3rem;
            line-height: 1.6;
          }

          .btn-lg {
            padding: 1.25rem 3rem !important;
            font-size: 1.25rem !important;
            border-radius: 20px !important;
            gap: 1rem !important;
          }

          .premium-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 32px; padding: 2rem 1.5rem; display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; transition: all 0.5s cubic-bezier(0.4,0,0.2,1); backdrop-filter: blur(10px); }
          .premium-card:hover { transform: translateY(-15px) scale(1.02); background: rgba(255,255,255,0.04); border-color: rgba(99,102,241,0.4); box-shadow: 0 30px 60px -12px rgba(0,0,0,0.5); }
          .premium-card.featured { background: linear-gradient(180deg, rgba(99,102,241,0.1) 0%, rgba(236,72,153,0.05) 100%); border: 1px solid rgba(99,102,241,0.5); transform: scale(1.04); z-index: 10; }
          .premium-card.featured:hover { transform: scale(1.06) translateY(-10px); }
          .popular-ribbon { position: absolute; top: -15px; background: linear-gradient(90deg, #6366f1, #ec4899); color: white; padding: 0.4rem 1.2rem; border-radius: 50px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 10px 20px rgba(99,102,241,0.4); }
          .plan-icon { font-size: 2.5rem; margin-bottom: 1rem; }
          .card-header h3 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.25rem; color: white; }
          .card-header .duration { color: #64748b; font-size: 0.9rem; font-weight: 500; }
          .price-tag { margin: 2rem 0; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
          .amount { font-size: 3.5rem; font-weight: 900; color: white; letter-spacing: -0.02em; }
          .savings { background: rgba(16,185,129,0.1); color: #10b981; padding: 0.3rem 1rem; border-radius: 50px; font-size: 0.85rem; font-weight: 700; }
          .premium-features { list-style: none; padding: 0; margin: 0 0 2.5rem 0; width: 100%; display: flex; flex-direction: column; gap: 1rem; text-align: left; }
          .premium-features li { font-size: 0.95rem; color: #94a3b8; display: flex; align-items: center; gap: 0.75rem; }
          .premium-features li span { color: #6366f1; font-weight: 900; }
          .feature-coming-soon { opacity: 0.45 !important; }
          .feature-coming-soon span { color: #64748b !important; }
          .feature-coming-soon em { font-style: italic; font-size: 0.8em; color: #64748b; }
          .premium-btn { width: 100%; padding: 1.25rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-weight: 800; font-size: 1.1rem; cursor: pointer; transition: all 0.3s; }
          .premium-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
          .premium-btn.primary { background: linear-gradient(135deg, #6366f1, #4f46e5); border: none; box-shadow: 0 15px 30px rgba(99,102,241,0.3); }
          .premium-btn.primary:hover { transform: scale(1.02); box-shadow: 0 20px 40px rgba(99,102,241,0.4); }

          .elite-hero-banner { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); border: 1px solid rgba(139,92,246,0.3); border-radius: 40px; padding: 4rem; display: flex; gap: 4rem; position: relative; overflow: hidden; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.6); }
          .elite-hero-banner::before { content: ''; position: absolute; top: -50%; right: -10%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%); filter: blur(40px); }
          .elite-content { flex: 1.5; position: relative; z-index: 2; }
          .elite-badge-v3 { background: linear-gradient(90deg, #f59e0b, #fbbf24); color: #000; display: inline-block; padding: 0.6rem 1.5rem; border-radius: 50px; font-weight: 900; font-size: 0.9rem; margin-bottom: 1.5rem; letter-spacing: 0.05em; animation: glow 2s infinite; }
          .elite-main-info h2 { font-size: 3rem; font-weight: 900; margin-bottom: 1rem; color: white; line-height: 1.1; }
          .elite-main-info h2 span { background: linear-gradient(90deg, #f59e0b, #fbbf24); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .elite-main-info p { color: #94a3b8; font-size: 1.1rem; margin-bottom: 2rem; max-width: 450px; }
          .elite-price-group { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 2.5rem; }
          .elite-price-group .price { font-size: 3rem; font-weight: 900; color: white; }
          .elite-price-group .duration { color: #64748b; font-size: 1.2rem; }
          .elite-btn-v3 { background: linear-gradient(90deg, #f59e0b, #fbbf24); color: #000; border: none; padding: 1.25rem 2.5rem; border-radius: 20px; font-weight: 800; font-size: 1.1rem; cursor: pointer; transition: all 0.3s; box-shadow: 0 20px 40px rgba(245,158,11,0.2); }
          .elite-btn-v3:hover { transform: translateY(-5px); box-shadow: 0 25px 50px rgba(245,158,11,0.3); }
          .elite-features-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; position: relative; z-index: 2; }
          .elite-feature-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 1.2rem; border-radius: 20px; transition: all 0.3s; }
          .elite-feature-item:hover { background: rgba(255,255,255,0.05); border-color: rgba(245,158,11,0.3); transform: translateX(5px); }
          .elite-feature-item strong { display: block; color: white; font-size: 1rem; margin-bottom: 0.25rem; }
          .elite-feature-item p { color: #64748b; font-size: 0.85rem; margin: 0; }
          .feature-coming-soon-box { opacity: 0.4; border-style: dashed !important; }
          .feature-coming-soon-box em { font-size: 0.75em; color: #64748b; }

          @keyframes glow { 0% { box-shadow: 0 0 10px #ffcc00; } 50% { box-shadow: 0 0 30px #ff9900; } 100% { box-shadow: 0 0 10px #ffcc00; } }

          .features-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
            width: 100%;
            max-width: 1000px;
          }

          .feature-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 2rem;
            border-radius: 24px;
            text-align: center;
            transition: all 0.3s;
          }

          .feature-card:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(99, 102, 241, 0.3);
            transform: translateY(-5px);
          }

          .feature-card .icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
          }

          .feature-card h3 {
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
          }

          .feature-card p {
            color: #64748b;
            font-size: 0.9rem;
          }

          @media (max-width: 768px) {
            .hero-title { font-size: 3rem; }
            .features-grid { grid-template-columns: 1fr; }
          }
          @media (max-width: 992px) {
            .pricing-container { grid-template-columns: 1fr; }
            .premium-card.featured { transform: scale(1); }
            .elite-hero-banner { flex-direction: column; padding: 2rem; gap: 2rem; }
            .elite-main-info h2 { font-size: 2.5rem; }
            .section-title { font-size: 2.5rem; }
          }

          .payment-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.95); backdrop-filter: blur(15px); z-index: 100000; display: flex; align-items: flex-start; justify-content: center; padding: 2rem; overflow-y: auto; }
          .premium-modal { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); width: 100%; max-width: 500px; border-radius: 40px; position: relative; box-shadow: 0 50px 100px rgba(0,0,0,0.5); animation: modalSlideUp 0.6s cubic-bezier(0.16,1,0.3,1); margin: 2rem 0; }
          @keyframes modalSlideUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
          .modal-close-btn { position: absolute; top: 1.5rem; right: 1.5rem; background: rgba(255,255,255,0.05); border: none; color: #94a3b8; width: 40px; height: 40px; border-radius: 50%; font-size: 1.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; z-index: 10; }
          .modal-close-btn:hover { background: rgba(255,255,255,0.1); color: white; }
          .modal-header-premium { padding: 4rem 2rem 2.5rem; text-align: center; background: linear-gradient(180deg, rgba(99,102,241,0.1) 0%, transparent 100%); }
          .plan-pill { background: rgba(99,102,241,0.1); color: #6366f1; display: inline-block; padding: 0.4rem 1.2rem; border-radius: 50px; font-weight: 800; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 1rem; }
          .total-amount { font-size: 3.5rem; font-weight: 900; color: white; margin: 0; letter-spacing: -0.04em; }
          .modal-subtitle { color: #64748b; font-size: 0.9rem; margin-top: 0.5rem; }
          .modal-body-premium { padding: 0 3rem 4rem; }
          .flow-title { font-size: 1.1rem; font-weight: 700; color: #94a3b8; margin-bottom: 1.5rem; text-align: center; }
          .methods-list-premium { display: flex; flex-direction: column; gap: 1rem; }
          .pay-method-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 1.25rem; border-radius: 24px; display: flex; align-items: center; gap: 1.25rem; cursor: pointer; transition: all 0.3s; width: 100%; text-align: left; }
          .pay-method-item:hover { background: rgba(255,255,255,0.06); border-color: #6366f1; transform: translateX(10px); }
          .pay-icon-box { font-size: 1.75rem; background: #000; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 16px; flex-shrink: 0; }
          .pay-details { flex: 1; }
          .pay-details strong { display: block; color: white; font-size: 1.1rem; }
          .pay-details span { color: #64748b; font-size: 0.85rem; }
          .pay-arrow { color: #475569; font-size: 1.5rem; }
          .pay-badge { background: rgba(99,102,241,0.12); color: #a5b4fc; font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 20px; white-space: nowrap; border: 1px solid rgba(99,102,241,0.2); }
          .gateway-section-label { font-size: 0.72rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; padding: 5px 5px 0; }
          .status-container { text-align: center; padding: 2rem 0; }
          .premium-loader { width: 60px; height: 60px; border: 4px solid rgba(99,102,241,0.1); border-top-color: #6366f1; border-radius: 50%; animation: premiumSpin 1s linear infinite; margin: 0 auto 2rem; }
          @keyframes premiumSpin { to { transform: rotate(360deg); } }
          .status-container h3 { font-size: 1.5rem; color: white; margin-bottom: 0.5rem; }
          .status-container p { color: #64748b; margin-bottom: 2rem; }
          .btn-cancel-payment { background: none; border: none; color: #ef4444; font-weight: 700; cursor: pointer; font-size: 0.9rem; }
          .success-glow { width: 80px; height: 80px; background: #10b981; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 2rem; box-shadow: 0 0 40px rgba(16,185,129,0.4); animation: successPulse 1.5s infinite; }
          @keyframes successPulse { 0% { transform: scale(1); box-shadow: 0 0 20px rgba(16,185,129,0.4); } 50% { transform: scale(1.1); box-shadow: 0 0 50px rgba(16,185,129,0.6); } 100% { transform: scale(1); box-shadow: 0 0 20px rgba(16,185,129,0.4); } }
          .btn-start-pro { background: #10b981; color: white; border: none; width: 100%; padding: 1.25rem; border-radius: 20px; font-weight: 800; font-size: 1.1rem; cursor: pointer; box-shadow: 0 15px 30px rgba(16,185,129,0.3); }
          .modal-footer-premium { padding: 2rem; background: rgba(0,0,0,0.2); text-align: center; }
          .security-tag { color: #475569; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 600; }

          /* COIN HEADER PILL */
          .header-coins-pill {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 6px 14px;
            border-radius: 50px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: 0.3s;
            backdrop-filter: blur(10px);
          }

          /* STREAK HEADER PILL */
          .header-streak-pill {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 69, 0, 0.08);
            border: 1px solid rgba(255, 69, 0, 0.25);
            padding: 6px 14px;
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.3s;
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
            flex-shrink: 0;
          }
          .header-coins-pill,
          .network-status-pill,
          .profile-dropdown-container {
            flex-shrink: 0;
          }
          .header-streak-pill:hover {
            background: rgba(255, 69, 0, 0.15);
            border-color: rgba(255, 69, 0, 0.5);
            transform: translateY(-2px);
          }
          .streak-fire { font-size: 1.2rem; line-height: 1; }
          .streak-info { display: flex; align-items: baseline; gap: 2px; }
          .streak-count { font-size: 1rem; font-weight: 900; color: #ff6a00; }
          .streak-label { font-size: 0.72rem; color: rgba(255,255,255,0.45); font-weight: 600; }
          .streak-bar-wrap {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: rgba(255,255,255,0.06);
            border-radius: 0 0 50px 50px;
          }
          .streak-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff4500, #ff9500);
            border-radius: inherit;
            transition: width 0.6s ease;
          }
          .profile-trigger {
            padding: 5px 12px;
            border-radius: 12px;
            transition: all 0.3s;
          }
          .profile-trigger:hover {
            background: rgba(255,255,255,0.08);
          }
          .header-coins-pill:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
            border-color: #fbbf24;
          }
          .coin-icon { font-size: 1.2rem; }
          .coin-count { color: #fff; font-weight: 800; font-size: 0.9rem; }
          .plus-icon { 
            background: #fbbf24; 
            color: #000; 
            width: 16px; 
            height: 16px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 12px; 
            font-weight: 900; 
            box-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
          }

          .original-price {
            font-size: 1rem;
            color: #64748b;
            text-decoration: line-through;
            margin-left: 10px;
            font-weight: 400;
          }

          .pricing-card:hover .amount { transform: scale(1.1); transition: 0.3s; display: inline-block; }

          /* SQUARE COIN CARDS */
          .coins-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
          }
          .coin-square-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 24px;
            padding: 2rem 1.5rem;
            text-align: center;
            position: relative;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            aspect-ratio: 1/1;
            backdrop-filter: blur(10px);
          }
          .coin-square-card:hover {
            transform: translateY(-10px) scale(1.02);
            background: rgba(255, 255, 255, 0.07);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            border-color: rgba(255,255,255,0.15);
          }
          .coin-card-icon {
            font-size: 3.5rem;
            margin-bottom: 1rem;
            filter: drop-shadow(0 5px 15px rgba(0,0,0,0.3));
          }
          .coin-card-name {
            font-weight: 800;
            font-size: 1.1rem;
            color: #fff;
            margin-bottom: 0.5rem;
          }
          .coin-card-price {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .price-now {
            font-size: 1.5rem;
            font-weight: 900;
            color: #fff;
          }
          .price-old {
            font-size: 0.85rem;
            color: #64748b;
            text-decoration: line-through;
          }
          .coin-mini-badge {
            position: absolute;
            top: 15px;
            right: 15px;
            font-size: 0.65rem;
            font-weight: 900;
            padding: 4px 10px;
            border-radius: 50px;
            color: #000;
            letter-spacing: 1px;
            box-shadow: 0 5px 10px rgba(0,0,0,0.3);
          }

          /* ===== STREAK HEADER PILL ===== */
          .header-streak-pill {
            display: flex; align-items: center; gap: 8px;
            background: rgba(255, 69, 0, 0.08);
            border: 1px solid rgba(255, 69, 0, 0.25);
            padding: 6px 14px; border-radius: 50px;
            cursor: pointer; transition: all 0.3s;
            backdrop-filter: blur(10px);
            position: relative; overflow: hidden;
          }
          .header-streak-pill:hover { background: rgba(255,69,0,0.18); border-color: rgba(255,69,0,0.5); transform: translateY(-2px); }
          .streak-fire { font-size: 1.1rem; line-height: 1; }
          .streak-info { display: flex; align-items: baseline; gap: 2px; }
          .streak-count { font-size: 0.95rem; font-weight: 900; color: #ff6a00; }
          .streak-label { font-size: 0.7rem; color: rgba(255,255,255,0.4); font-weight: 600; }
          .streak-bar-wrap { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: rgba(255,255,255,0.06); border-radius: 0 0 50px 50px; }
          .streak-bar-fill { height: 100%; background: linear-gradient(90deg, #ff4500, #ff9500); border-radius: inherit; transition: width 0.6s ease; }

          /* ===== 7-DAY STREAK REWARD MODAL ===== */
          .streak-reward-modal {
            background: linear-gradient(180deg, #0d1117 0%, #0f172a 100%);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 32px;
            padding: 2rem 1.75rem;
            width: 100%;
            max-width: 480px;
            position: relative;
            animation: modalSlideUp 0.4s cubic-bezier(0.16,1,0.3,1);
            box-shadow: 0 40px 100px rgba(0,0,0,0.7);
          }
          .streak-modal-close {
            position: absolute; top: 1.2rem; right: 1.2rem;
            background: rgba(255,255,255,0.05); border: none;
            color: #64748b; width: 36px; height: 36px;
            border-radius: 50%; font-size: 1.4rem; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: 0.2s;
          }
          .streak-modal-close:hover { background: rgba(255,255,255,0.1); color: #fff; }
          .streak-modal-top { text-align: center; margin-bottom: 1.75rem; }
          .streak-big-fire { font-size: 3.5rem; margin-bottom: 0.75rem; filter: drop-shadow(0 0 20px rgba(255,100,0,0.6)); animation: pulse 2s infinite; }
          @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
          .streak-modal-title { font-size: 1.6rem; font-weight: 900; color: #fff; margin: 0 0 0.4rem; letter-spacing: -0.03em; }
          .streak-modal-sub { font-size: 0.9rem; color: #64748b; margin: 0; font-weight: 500; }

          /* Day Cards Grid */
          .streak-days-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 1.5rem;
          }
          .streak-day-card:nth-child(1) { grid-area: 1 / 1 / 2 / 2; }
          .streak-day-card:nth-child(2) { grid-area: 1 / 2 / 2 / 3; }
          .streak-day-card:nth-child(3) { grid-area: 1 / 3 / 2 / 4; }
          .streak-day-card:nth-child(4) { grid-area: 2 / 1 / 3 / 2; }
          .streak-day-card:nth-child(5) { grid-area: 2 / 2 / 3 / 3; }
          .streak-day-card:nth-child(6) { grid-area: 2 / 3 / 3 / 4; }
          .streak-day-card:nth-child(7) { 
            grid-area: 1 / 4 / 3 / 5;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .streak-day-card {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 14px;
            padding: 10px 4px 8px;
            text-align: center;
            position: relative;
            transition: all 0.3s;
          }
          .streak-day-card.done {
            background: rgba(99,102,241,0.12);
            border-color: rgba(99,102,241,0.35);
          }
          .streak-day-card.today {
            background: rgba(255,100,0,0.1);
            border-color: rgba(255,100,0,0.5);
            box-shadow: 0 0 16px rgba(255,100,0,0.2);
            transform: scale(1.08);
          }
          .streak-day-card.locked {
            background: rgba(255,255,255,0.01);
            border-color: rgba(255,255,255,0.04);
            opacity: 0.5;
          }
          .streak-day-card.grand {
            background: linear-gradient(135deg, rgba(245,158,11,0.12), rgba(251,191,36,0.06));
            border-color: rgba(245,158,11,0.5);
          }
          .streak-day-card.grand .streak-day-icon {
            font-size: 2rem;
            margin-bottom: 8px;
          }
          .streak-day-card.grand .streak-day-coins {
            font-size: 0.85rem !important;
          }
          .streak-day-card.grand .streak-day-label {
            font-size: 0.75rem !important;
          }
          .streak-day-card.grand.done {
            box-shadow: 0 0 20px rgba(245,158,11,0.35);
          }
          .streak-lock-overlay {
            position: absolute; top: -5px; right: -5px;
            font-size: 0.6rem;
            width: 16px; height: 16px;
            display: flex; align-items: center; justify-content: center;
            background: rgba(30,41,59,0.9); border-radius: 50%; border: 1px solid rgba(255,255,255,0.08);
          }
          .streak-check {
            position: absolute; top: -7px; right: -7px;
            background: #6366f1; color: #fff;
            width: 18px; height: 18px;
            border-radius: 50%; font-size: 0.6rem;
            display: flex; align-items: center; justify-content: center;
            font-weight: 900; border: 2px solid #0f172a;
          }
          .streak-day-icon { font-size: 1.4rem; line-height: 1; margin-bottom: 4px; }
          .streak-day-coins { font-size: 0.65rem; font-weight: 900; color: #fbbf24; margin-bottom: 3px; }
          .streak-day-label { font-size: 0.58rem; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

          /* Streak Stats Card */
          .streak-stats-card {
            display: flex;
            gap: 10px;
            margin-bottom: 1.25rem;
            background: rgba(255,255,255,0.025);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 20px;
            padding: 14px 16px;
          }
          .streak-stat-box {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 0 6px;
          }
          .streak-stat-box:not(:last-child) {
            border-right: 1px solid rgba(255,255,255,0.06);
            padding-right: 12px;
          }
          .streak-stat-icon { font-size: 1.3rem; flex-shrink: 0; }
          .streak-stat-info { display: flex; flex-direction: column; }
          .streak-stat-info small { font-size: 0.6rem; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .streak-stat-info strong { font-size: 0.9rem; color: #f8fafc; font-weight: 900; line-height: 1.2; }

          /* Progress Bar */
          .streak-progress-wrap {
            height: 6px; background: rgba(255,255,255,0.06);
            border-radius: 10px; margin-bottom: 0.6rem; position: relative; overflow: hidden;
          }
          .streak-progress-fill {
            height: 100%; background: linear-gradient(90deg, #ff4500, #f59e0b);
            border-radius: inherit; transition: width 0.8s ease;
            box-shadow: 0 0 10px rgba(255,100,0,0.5);
          }
          .streak-progress-text { font-size: 0.75rem; color: #475569; font-weight: 600; display: block; text-align: right; margin-bottom: 1.25rem; }

          /* CTA Buttons */
          .streak-cta-btn {
            width: 100%; padding: 1rem; border-radius: 16px; border: none;
            font-size: 1rem; font-weight: 800; cursor: pointer; transition: all 0.3s;
          }
          .streak-cta-btn.normal { background: linear-gradient(135deg, #ff4500, #ff9500); color: #fff; box-shadow: 0 10px 30px rgba(255,69,0,0.3); }
          .streak-cta-btn.normal:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(255,69,0,0.45); }
          .streak-cta-btn.grand { background: linear-gradient(135deg, #f59e0b, #fbbf24); color: #000; box-shadow: 0 10px 30px rgba(245,158,11,0.4); animation: shimmer 2s infinite; }
          .streak-cta-btn.grand:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(245,158,11,0.6); }
          .streak-cta-btn.broken { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #000; box-shadow: 0 10px 30px rgba(251,191,36,0.35); }
          .streak-cta-btn.broken:hover { transform: translateY(-3px); }
          .streak-skip-btn { background: none; border: none; color: #475569; font-size: 0.85rem; font-weight: 600; cursor: pointer; width: 100%; padding: 0.5rem; transition: color 0.2s; }
          .streak-skip-btn:hover { color: #94a3b8; }
          @keyframes shimmer { 0%,100% { box-shadow: 0 10px 30px rgba(245,158,11,0.4); } 50% { box-shadow: 0 10px 50px rgba(245,158,11,0.7); } }
          /* ZoneMeetBot Widget Styles */
          .zonemeetbot-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            font-family: 'Inter', sans-serif;
          }
          .bot-toggle-btn {
            background: linear-gradient(135deg, #6366f1, #a855f7);
            border: none;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }
          .bot-toggle-btn:hover {
            transform: scale(1.1) translateY(-5px);
          }
          .bot-icon {
            font-size: 1.8rem;
          }
          .bot-tooltip {
            position: absolute;
            right: 75px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            transition: 0.2s;
          }
          .bot-toggle-btn:hover .bot-tooltip {
            opacity: 1;
          }
          .bot-window {
            width: 350px;
            height: 450px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            animation: slideUpBot 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          @keyframes slideUpBot {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .bot-header {
            padding: 15px 20px;
            background: rgba(255,255,255,0.05);
            border-bottom: 1px solid rgba(255,255,255,0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .bot-avatar {
            font-size: 1.5rem;
            background: rgba(99, 102, 241, 0.2);
            padding: 8px;
            border-radius: 50%;
          }
          .bot-close {
            background: none;
            border: none;
            color: #94a3b8;
            font-size: 1.5rem;
            cursor: pointer;
            transition: color 0.2s;
          }
          .bot-close:hover { color: #ef4444; }
          .bot-body {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .bot-msg-row {
            display: flex;
            width: 100%;
          }
          .bot-msg-row.user { justify-content: flex-end; }
          .bot-msg-row.bot { justify-content: flex-start; }
          
          .bot-msg-bubble {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 18px;
            font-size: 0.9rem;
            line-height: 1.4;
            word-wrap: break-word;
          }
          .bot-msg-bubble.bot {
            background: rgba(255,255,255,0.05);
            color: #f8fafc;
            border-bottom-left-radius: 4px;
          }
          .bot-msg-bubble.user {
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            color: white;
            border-bottom-right-radius: 4px;
          }
          .bot-input-area {
            padding: 15px;
            background: rgba(0,0,0,0.2);
            display: flex;
            gap: 10px;
          }
          .bot-input-area input {
            flex: 1;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            color: white;
            padding: 10px 15px;
            border-radius: 20px;
            outline: none;
          }
          .bot-input-area input:focus {
            border-color: #6366f1;
          }
          .bot-input-area button {
            background: #6366f1;
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            transition: background 0.2s;
          }
          .bot-input-area button:hover { background: #4f46e5; }
          @keyframes box-shake {
            0% { transform: rotate(0deg) scale(1.05); }
            25% { transform: rotate(8deg) scale(1.1); }
            50% { transform: rotate(-8deg) scale(1.1); }
            75% { transform: rotate(4deg) scale(1.1); }
            100% { transform: rotate(0deg) scale(1.05); }
          }
          .box-opening {
            animation: box-shake 0.2s infinite !important;
            border-color: #fbbf24 !important;
            background: rgba(251, 191, 36, 0.05) !important;
            box-shadow: 0 0 50px rgba(251, 191, 36, 0.3) !important;
          }
          @keyframes revealScale {
            0% { transform: scale(0.5); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          .reveal-glow {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 300px;
            height: 300px;
            border-radius: 50%;
            filter: blur(100px);
            z-index: 5;
          }
          .win-glow { background: rgba(251, 191, 36, 0.4); }
          .loss-glow { background: rgba(239, 68, 68, 0.2); }
          @keyframes slotRoll {
            0% { transform: translateY(-30px); opacity: 0; }
            100% { transform: translateY(30px); opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.5); opacity: 1; shadow: 0 0 10px #6366f1; }
          }

          /* Home Support Banner Styles */
          .home-support-banner {
            padding: 100px 20px;
            background: radial-gradient(circle at 70% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 60%);
            position: relative;
            overflow: hidden;
          }
          .support-banner-content {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 1.2fr;
            gap: 80px;
            align-items: center;
          }
          .support-banner-visual {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .floating-3d-shield {
            width: 100%;
            max-width: 450px;
            z-index: 2;
            animation: float 4s ease-in-out infinite;
          }
          .visual-glow {
            position: absolute;
            width: 300px;
            height: 300px;
            background: #6366f1;
            filter: blur(120px);
            opacity: 0.3;
            z-index: 1;
          }
          .support-banner-text h2 {
            font-size: 3.5rem;
            font-weight: 900;
            line-height: 1.1;
            margin: 20px 0;
            letter-spacing: -2px;
          }
          .support-banner-text h2 span {
            background: linear-gradient(to right, #6366f1, #ec4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .support-tag {
            display: inline-block;
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            padding: 6px 16px;
            border-radius: 50px;
            font-size: 0.75rem;
            font-weight: 800;
            letter-spacing: 1px;
            border: 1px solid rgba(239, 68, 68, 0.2);
          }
          .support-banner-text p {
            color: #94a3b8;
            font-size: 1.15rem;
            line-height: 1.6;
            margin-bottom: 40px;
          }
          .support-features {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
          }
          .s-feat {
            display: flex;
            gap: 15px;
            align-items: flex-start;
          }
          .s-icon {
            font-size: 1.5rem;
            background: rgba(255,255,255,0.05);
            width: 45px;
            height: 45px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .s-feat h4 { font-size: 1rem; color: white; margin: 0 0 5px 0; }
          .s-feat p { font-size: 0.85rem !important; color: #64748b !important; margin: 0 !important; }
          
          .btn-contact-home {
            background: #fff;
            color: #000;
            border: none;
            padding: 16px 35px;
            border-radius: 15px;
            font-weight: 800;
            font-size: 1rem;
            cursor: pointer;
            transition: 0.3s;
          }
          .btn-contact-home:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(255,255,255,0.2);
          }

          @media (max-width: 900px) {
            .support-banner-content { grid-template-columns: 1fr; text-align: center; }
            .support-features { grid-template-columns: 1fr; text-align: left; }
            .s-feat { justify-content: center; text-align: center; flex-direction: column; align-items: center; }
            .support-banner-text h2 { font-size: 2.5rem; }
          }
          .transparency-card:hover {
            transform: translateY(-10px);
            background: rgba(255, 255, 255, 0.05) !important;
            border-color: #6366f1 !important;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          }
          .buy-badge {
            display: inline-block;
            background: rgba(99, 102, 241, 0.1);
            color: #6366f1;
            padding: 6px 14px;
            border-radius: 50px;
            font-size: 0.7rem;
            font-weight: 800;
            margin-top: 15px;
            transition: 0.3s;
          }
          .transparency-card:hover .buy-badge {
            background: #6366f1;
            color: white;
            transform: scale(1.05);
          }

          .network-status-pill {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 6px 12px;
            border-radius: 50px;
            font-size: 0.75rem;
            font-weight: 700;
            transition: all 0.3s;
          }
          .network-status-pill.online { color: #10b981; border-color: rgba(16, 185, 129, 0.2); }
          .network-status-pill.offline { color: #ef4444; border-color: rgba(239, 68, 68, 0.2); }
          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
            box-shadow: 0 0 10px currentColor;
            animation: status-pulse 2s infinite;
          }
          @keyframes status-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
          }

          /* Referral Styles */
          .referral-section-container {
            padding: 80px 20px;
            max-width: 900px;
            margin: 40px auto 20px;
          }
          .referral-stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .referral-flex-row {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          /* COMPREHENSIVE MOBILE RESPONSIVENESS */
          @media (max-width: 1024px) {
            .experience-section, .friends-promo-section, .support-banner-content {
              grid-template-columns: 1fr !important;
              text-align: center;
              gap: 40px !important;
            }
            .experience-text h2, .friends-text h2, .support-banner-text h2 {
              font-size: 2.5rem !important;
            }
            .experience-gallery, .friends-visual {
              order: 2;
            }
          }

          @media (max-width: 768px) {
            .referral-section-container {
              padding: 40px 15px 120px !important;
              margin: 20px auto 10px !important;
              width: 100% !important;
              max-width: 100vw !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
            }
            .referral-stats-grid {
              grid-template-columns: 1fr !important;
              gap: 15px !important;
              width: 100% !important;
              box-sizing: border-box !important;
            }
            .referral-flex-row {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 10px !important;
              width: 100% !important;
              box-sizing: border-box !important;
            }
            .referral-input-box {
              text-align: center !important;
              width: 100% !important;
              box-sizing: border-box !important;
            }
            .referral-btn {
              width: 100% !important;
              padding: 14px !important;
              display: flex !important;
              justify-content: center !important;
              align-items: center !important;
            }
            .zonemeetbot-widget {
              right: 12px !important;
            }
            .bot-toggle-btn {
              width: 50px !important;
              height: 50px !important;
              box-shadow: 0 6px 15px rgba(99, 102, 241, 0.3) !important;
            }
            .bot-icon {
              font-size: 1.5rem !important;
            }
            .bot-tooltip {
              display: none !important;
            }
            .floating-3d-shield {
              animation: none !important;
            }

            .header {
              display: flex !important;
              flex-direction: row !important;
              flex-wrap: nowrap !important;
              align-items: center !important;
              justify-content: flex-start !important;
              padding: 8px 10px !important;
              gap: 6px !important;
              height: auto !important;
              overflow-x: auto !important;
              overflow-y: hidden !important;
              -webkit-overflow-scrolling: touch;
              scrollbar-width: none;
            }
            .header::-webkit-scrollbar {
              display: none;
            }
            .brand-group {
              flex: 0 1 auto !important;
              min-width: 0 !important;
              overflow: hidden !important;
              gap: 5px !important;
            }
            .header-nav {
              display: none !important;
            }
            .logo-icon-wrapper svg {
              width: 26px !important;
              height: 26px !important;
              flex-shrink: 0 !important;
            }
            .logo-text {
              font-size: 0.95rem !important;
              white-space: nowrap !important;
            }
            .brand-group .header-sub-badge-desktop {
              display: none !important;
            }
            .header-premium-mobile-only {
              display: inline-block !important;
              font-size: 0.5rem !important;
              padding: 2px 5px !important;
              flex-shrink: 0 !important;
              white-space: nowrap !important;
              max-width: 56px !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }
            /* Flatten row: ZoneMeet → Premium → Streak → Coins → Profile */
            .user-dashboard-row {
              display: contents !important;
            }
            .header-streak-pill,
            .header-coins-pill,
            .profile-dropdown-container {
              flex-shrink: 0 !important;
            }
            .profile-dropdown-container {
              margin-left: auto !important;
            }
            .header .profile-dropdown-container,
            .header .profile-trigger {
              width: auto !important;
            }
            .header-coins-pill, .header-streak-pill {
              padding: 3px 7px !important;
              gap: 3px !important;
              flex-shrink: 0 !important;
            }
            .coin-icon, .streak-fire {
              font-size: 0.85rem !important;
            }
            .coin-count, .streak-count {
              font-size: 0.7rem !important;
            }
            .streak-label {
              display: none !important;
            }
            .streak-bar-wrap {
              display: none !important;
            }
            .plus-icon {
              width: 11px !important;
              height: 11px !important;
              font-size: 8px !important;
            }
            .network-status-pill {
              display: none !important;
            }
            .profile-dropdown-container {
              flex-shrink: 0 !important;
            }
            .profile-avatar {
              width: 28px !important;
              height: 28px !important;
              font-size: 0.85rem !important;
              flex-shrink: 0 !important;
            }
            .profile-trigger {
              padding: 3px 6px !important;
              gap: 0 !important;
            }
            .profile-trigger-name {
              display: none !important;
            }
            .nav-links {
              display: none; 
            }
            .hero-title {
              font-size: 2.2rem !important;
            }
            .hero-subtitle {
              font-size: 1rem !important;
            }
            .main-action-card {
              padding: 20px !important;
            }
            .features-grid {
              grid-template-columns: 1fr !important;
              gap: 15px;
            }
            .pricing-container {
              grid-template-columns: 1fr !important;
              gap: 20px !important;
              padding: 0 10px !important;
            }
            .footer-grid {
              grid-template-columns: 1fr 1fr !important;
              gap: 30px;
            }
            .incoming-call-card {
              width: 90% !important;
              padding: 30px 20px !important;
            }
            .dashboard-hero {
              padding-top: 100px !important;
            }
            .payment-overlay {
              padding: 1rem 0.5rem !important;
            }
            .premium-modal {
              width: 95% !important;
              max-width: 100% !important;
              max-height: 90vh !important;
              overflow-y: auto !important;
              padding: 20px 15px !important;
              margin: auto !important;
            }
            .leaderboard-modal {
              width: 95% !important;
              max-width: 600px !important;
              height: 80vh !important;
              max-height: 85vh !important;
              padding: 0 !important;
            }
            .bot-body {
              padding: 0 15px 20px !important;
            }
            .profile-modal-overlay--mobile {
              align-items: center !important;
              justify-content: center !important;
              padding: 12px !important;
              z-index: 10050 !important;
            }
            .profile-modal-card--mobile {
              position: relative !important;
              top: auto !important;
              left: auto !important;
              right: auto !important;
              transform: none !important;
              width: calc(100vw - 24px) !important;
              max-width: 400px !important;
              max-height: min(90dvh, 90vh) !important;
              overflow-y: auto !important;
              overflow-x: hidden !important;
              border-radius: 20px !important;
              margin: 0 auto !important;
            }
            .streak-reward-modal {
              width: 95% !important;
              max-width: 400px !important;
              max-height: 90vh !important;
              overflow-y: auto !important;
              padding: 20px 15px !important;
              margin: auto !important;
            }
            .streak-days-grid {
              gap: 6px !important;
              display: grid !important;
              grid-template-columns: repeat(4, 1fr) !important;
              grid-template-rows: repeat(2, 1fr) !important;
              overflow-x: hidden !important;
              width: 100% !important;
              box-sizing: border-box !important;
            }
            .streak-day-card {
              min-width: 0 !important;
              padding: 6px 2px 4px !important;
              font-size: 0.7rem !important;
            }
            .streak-day-icon {
              font-size: 1.1rem !important;
              margin-bottom: 2px !important;
            }
            .streak-day-coins {
              font-size: 0.55rem !important;
            }
            .streak-day-label {
              font-size: 0.5rem !important;
            }
            
            /* Grand Card Mobile Overrides */
            .streak-day-card.grand .streak-day-icon {
              font-size: 1.8rem !important;
              margin-bottom: 6px !important;
            }
            .streak-day-card.grand .streak-day-coins {
              font-size: 0.75rem !important;
            }
            .streak-day-card.grand .streak-day-label {
              font-size: 0.6rem !important;
            }
            .streak-stats-card {
              flex-direction: row !important;
              gap: 6px !important;
              padding: 10px 10px !important;
              border-radius: 16px !important;
            }
            .streak-stat-box {
              gap: 6px !important;
              padding: 0 4px !important;
            }
            .streak-stat-icon {
              font-size: 1rem !important;
            }
            .streak-stat-info small {
              font-size: 0.5rem !important;
            }
            .streak-stat-info strong {
              font-size: 0.7rem !important;
            }
            .streak-lock-overlay {
              width: 14px !important;
              height: 14px !important;
              font-size: 0.5rem !important;
            }
            .streak-modal-title {
              font-size: 1.3rem !important;
            }
            .streak-modal-sub {
              font-size: 0.8rem !important;
            }
            .streak-cta-btn {
              padding: 12px !important;
              font-size: 0.85rem !important;
            }
            /* Coin Usage Transparency - stacked grid */
            .stats-row {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 15px !important;
              overflow-x: visible !important;
            }
            .stats-row > * {
              min-width: 100% !important;
              width: 100% !important;
              flex-shrink: 1 !important;
            }
            .transparency-card {
              padding: 15px !important;
              border-radius: 16px !important;
            }
            .transparency-card h3 {
              font-size: 1.2rem !important;
              margin: 10px 0 !important;
            }
            .transparency-card p {
              font-size: 0.75rem !important;
              line-height: 1.4 !important;
            }
            .glass-card {
              padding: 20px 15px !important;
              border-radius: 20px !important;
            }
            .glass-card > div[style*="display: 'flex'"] {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 15px !important;
              margin-bottom: 20px !important;
            }
            .glass-card h2 {
              font-size: 1.4rem !important;
            }
            .glass-card p {
              font-size: 0.8rem !important;
            }
            /* Mystery Boxes - clean stacked grid */
            .mystery-grid {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 20px !important;
              overflow-x: visible !important;
            }
            .mystery-grid > * {
              min-width: 100% !important;
              width: 100% !important;
              flex-shrink: 1 !important;
            }
            .mystery-card {
              padding: 25px 15px !important;
              border-radius: 24px !important;
            }
            .mystery-card h3 {
              font-size: 1.3rem !important;
              margin-bottom: 10px !important;
            }
            .mystery-card div[style*="fontSize: '5rem'"] {
              font-size: 3rem !important;
              margin-bottom: 15px !important;
            }
            .mystery-card div[style*="fontSize: '1.1rem'"] {
              font-size: 0.9rem !important;
              padding: 8px 15px !important;
              border-radius: 12px !important;
            }
            .box-rarity {
              top: 15px !important;
              right: 15px !important;
              font-size: 0.6rem !important;
              padding: 2px 8px !important;
            }
            .streak-day-label {
              font-size: 0.65rem !important;
            }
            .streak-day-coins {
              font-size: 0.75rem !important;
            }
            .streak-modal-close, .modal-close-btn, .history-close-btn, .profile-modal-close {
              padding: 0 !important;
              width: 32px !important;
              height: 32px !important;
              font-size: 1.5rem !important;
              top: 10px !important;
              right: 10px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              border-radius: 50% !important;
            }
            .bot-window {
              width: calc(100vw - 40px) !important;
              max-width: 340px !important;
              height: 320px !important;
              bottom: 80px !important;
              right: 20px !important;
            }
            .leaderboard-modal {
              height: 60vh !important;
              max-height: 480px !important;
            }
            .modal-header-premium h2 {
              font-size: 2rem !important;
            }
            /* Fix for referral grid and details */
            #referral-section {
              padding: 30px 15px !important;
              margin-top: 20px !important;
            }
            #referral-section > div:nth-of-type(1) h2 {
              font-size: 1.8rem !important;
            }
            #referral-section > div:nth-of-type(1) p {
              font-size: 0.85rem !important;
            }
            #referral-section > div:nth-of-type(2) {
              grid-template-columns: 1fr !important;
              gap: 15px !important;
              width: 100% !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
            }
            #referral-section > div:nth-of-type(2) > div {
              padding: 15px !important;
              border-radius: 16px !important;
            }
            #referral-section > div:nth-of-type(2) > div > div:nth-of-type(1) {
              font-size: 1.8rem !important;
            }
            #referral-section > div:nth-of-type(2) > div > div:nth-of-type(2) {
              font-size: 1.4rem !important;
            }
            #referral-section > div:nth-of-type(3) {
              padding: 20px 15px !important;
              border-radius: 18px !important;
            }
            #referral-section div[style*="display: 'flex'"],
            #referral-section div[style*="display: 'flex'"][style*="alignItems: 'center'"] {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 10px !important;
            }
            #referral-section div[style*="fontFamily: 'monospace'"] {
              font-size: 1.1rem !important;
              padding: 10px 15px !important;
              text-align: center !important;
              letter-spacing: 2px !important;
            }
            #referral-section div[style*="overflow: 'hidden'"] {
              font-size: 0.75rem !important;
              padding: 10px 15px !important;
              text-align: center !important;
            }
            #referral-section button {
              width: 100% !important;
              padding: 12px !important;
              font-size: 0.85rem !important;
              height: auto !important;
            }
            /* Subscription Packs Smaller sizing */
            .premium-card {
              padding: 20px 15px !important;
              border-radius: 20px !important;
            }
            .premium-card h3 {
              font-size: 1.2rem !important;
            }
            .premium-card .duration {
              font-size: 0.75rem !important;
            }
            .premium-card .price-tag {
              margin: 1rem 0 !important;
            }
            .premium-card .amount {
              font-size: 1.8rem !important;
            }
            .premium-card .premium-features {
              gap: 8px !important;
              margin-bottom: 1.5rem !important;
            }
            .premium-card .premium-features li {
              font-size: 0.8rem !important;
            }
            .premium-card .premium-btn {
              padding: 12px !important;
              font-size: 0.9rem !important;
              border-radius: 12px !important;
              height: auto !important;
            }
            .elite-hero-banner {
              padding: 20px 15px !important;
              border-radius: 24px !important;
              gap: 20px !important;
            }
            .elite-main-info h2 {
              font-size: 1.8rem !important;
            }
            .elite-main-info p {
              font-size: 0.9rem !important;
            }
            .elite-price-group .price {
              font-size: 1.8rem !important;
            }
            .elite-btn-v3 {
              padding: 12px 20px !important;
              font-size: 0.9rem !important;
              border-radius: 12px !important;
              width: 100% !important;
              text-align: center !important;
            }
            .elite-features-grid {
              grid-template-columns: 1fr !important;
              gap: 8px !important;
            }
            .elite-feature-item {
              padding: 10px 15px !important;
              border-radius: 12px !important;
            }
            .elite-feature-item strong {
              font-size: 0.85rem !important;
            }
            .elite-feature-item p {
              font-size: 0.75rem !important;
            }
            /* Experience and Gallery overrides */
            .gallery-sub {
              display: none !important;
            }
            .gallery-main {
              transform: none !important;
              border-radius: 20px !important;
            }
            .experience-section, .friends-promo-section {
              padding: 40px 15px !important;
            }
            .experience-text h2, .friends-text h2 {
              font-size: 2rem !important;
            }
            .experience-text p, .friends-text p {
              font-size: 0.95rem !important;
            }
            /* Global Mobile Button Shrinking */
            .btn-connect-now {
              padding: 12px 24px !important;
              font-size: 1rem !important;
              border-radius: 12px !important;
            }
            .btn-contact-home {
              padding: 10px 20px !important;
              font-size: 0.85rem !important;
              border-radius: 12px !important;
              width: 100% !important;
            }
            .btn-contact-home, .btn-secondary, .btn-primary, .premium-btn, .elite-btn-v3, .streak-cta-btn, .profile-edit-btn {
              font-size: 0.85rem !important;
              padding: 10px 18px !important;
              height: auto !important;
            }
            /* Profile Modal — full visible card on small phones */
            .profile-modal-overlay--mobile {
              padding: 10px !important;
            }
            .profile-modal-card--mobile {
              width: calc(100vw - 20px) !important;
              max-width: 100% !important;
              max-height: min(92dvh, 92vh) !important;
              overflow-y: auto !important;
              overflow-x: hidden !important;
              border-radius: 18px !important;
            }
            .profile-modal-header {
              padding: 8px !important;
              font-size: 0.95rem !important;
            }
            .profile-modal-close {
              font-size: 1.15rem !important;
              right: 8px !important;
            }
            .profile-modal-body {
              padding: 6px !important;
              gap: 8px !important;
            }
            .profile-user-card {
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              text-align: center !important;
              padding: 8px !important;
              gap: 6px !important;
              border-radius: 10px !important;
            }
            .profile-avatar-large {
              width: 38px !important;
              height: 38px !important;
              font-size: 1.15rem !important;
              margin-bottom: 4px !important;
            }
            .profile-user-info {
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              text-align: center !important;
              width: 100% !important;
            }
            .profile-user-name {
              font-size: 0.85rem !important;
              max-width: 200px !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              white-space: nowrap !important;
              word-break: break-all !important;
              display: flex !important;
              justify-content: center !important;
              align-items: center !important;
            }
            .profile-user-id {
              font-size: 0.7rem !important;
              max-width: 200px !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              white-space: nowrap !important;
              word-break: break-all !important;
              display: flex !important;
              justify-content: center !important;
              align-items: center !important;
            }
            .profile-edit-btn {
              position: static !important;
              margin: 4px auto 0 !important;
              padding: 2px 6px !important;
              font-size: 0.6rem !important;
              border-radius: 8px !important;
              height: auto !important;
              width: fit-content !important;
            }
            .profile-premium-banner {
              padding: 8px !important;
              border-radius: 10px !important;
            }
            .profile-premium-title {
              font-size: 0.8rem !important;
            }
            .profile-premium-sub {
              font-size: 0.65rem !important;
            }
            .profile-modal-card--mobile .profile-premium-btn {
              width: auto !important;
              padding: 4px 9px !important;
              font-size: 0.62rem !important;
              border-radius: 6px !important;
              height: auto !important;
              min-height: 0 !important;
              line-height: 1.2 !important;
              font-weight: 700 !important;
              flex-shrink: 0 !important;
              margin-bottom: 0 !important;
            }
            .profile-balances {
              padding: 8px !important;
              border-radius: 10px !important;
              gap: 4px !important;
            }
            .profile-balance-item {
              font-size: 0.75rem !important;
              gap: 2px !important;
            }
            .profile-balance-icon {
              font-size: 0.95rem !important;
            }
            .profile-balance-divider {
              height: 15px !important;
            }
            .profile-details-list {
              padding: 2px 0 !important;
              border-radius: 10px !important;
            }
            .profile-detail-item {
              padding: 4px 8px !important;
              font-size: 0.75rem !important;
            }
            .profile-more-btn {
              padding: 6px 8px !important;
              font-size: 0.8rem !important;
              border-radius: 8px !important;
            }
            /* Coins box inside profile card */
            .profile-modal-card div[style*="background: 'rgba(255,255,255,0.02)'"] {
              padding: 8px !important;
              gap: 8px !important;
              border-radius: 12px !important;
              margin-bottom: 0.8rem !important;
            }
            /* Redeem Referral Styling Mobile */
            .profile-referral-box {
              padding: 8px !important;
              border-radius: 10px !important;
              overflow: hidden !important;
            }
            .profile-referral-title {
              font-size: 0.65rem !important;
              margin-bottom: 6px !important;
            }
            .profile-referral-row {
              gap: 6px !important;
              display: flex !important;
              flex-direction: row !important;
              align-items: center !important;
              width: 100% !important;
              overflow: hidden !important;
            }
            .profile-referral-input {
              padding: 8px 10px !important;
              font-size: 0.8rem !important;
              border-radius: 8px !important;
              height: auto !important;
              flex: 1 !important;
              min-width: 60% !important;
            }
            .profile-modal-card--mobile .profile-referral-btn {
              width: auto !important;
              padding: 4px 9px !important;
              font-size: 0.62rem !important;
              border-radius: 6px !important;
              height: auto !important;
              min-height: 0 !important;
              line-height: 1.2 !important;
              font-weight: 700 !important;
              flex-shrink: 0 !important;
              white-space: nowrap !important;
              margin-bottom: 0 !important;
            }
            .profile-modal-card--mobile .profile-edit-btn {
              padding: 3px 7px !important;
              font-size: 0.6rem !important;
              border-radius: 6px !important;
              width: auto !important;
            }
            .profile-modal-card--mobile input,
            .profile-modal-card--mobile select {
              padding: 8px 10px !important;
              font-size: 0.8rem !important;
              border-radius: 8px !important;
              height: auto !important;
            }
            .profile-modal-card--mobile .profile-more-btn {
              padding: 6px 8px !important;
              font-size: 0.8rem !important;
              border-radius: 8px !important;
              width: 100% !important;
            }
            /* Fix for mystery box confirm */
            .premium-modal {
              width: 95vw !important;
              max-width: 400px !important;
              padding: 0 !important;
              margin: 0 auto !important;
              max-height: 90vh !important;
              overflow-y: auto !important;
            }
            .premium-modal > div:not(:first-child) {
              padding: 20px 15px !important; 
            }
            .premium-modal h2 {
              font-size: 1.5rem !important;
            }
            .premium-modal h3 {
              font-size: 1.3rem !important;
            }
            .premium-modal p {
              font-size: 0.85rem !important;
              margin-bottom: 20px !important;
            }
            .premium-modal button {
              padding: 12px 15px !important;
              font-size: 0.9rem !important;
            }
            .mystery-float {
              font-size: 3.5rem !important;
              margin-bottom: 15px !important;
            }
            /* Fix for spinner windows */
            .slot-machine-frame {
              padding: 15px !important;
              border-width: 4px !important;
            }
            .spinner-window {
              width: 80px !important;
              height: 120px !important;
            }
            .slot-spinning {
              font-size: 3rem !important;
            }

            /* Profile Edit / Onboarding Modal responsiveness */
            .premium-modal .modal-header h2 {
              font-size: 1.25rem !important;
            }
            .premium-modal .modal-header p {
              font-size: 0.75rem !important;
            }
            .premium-modal form {
              gap: 0.8rem !important;
              margin-top: 1rem !important;
            }
            .premium-modal .styled-select {
              padding: 0.5rem !important;
              font-size: 0.8rem !important;
              border-radius: 8px !important;
            }
            .premium-modal label {
              font-size: 0.75rem !important;
              margin-bottom: 0.25rem !important;
            }
            .premium-modal .btn-lg {
              padding: 0.6rem !important;
              font-size: 0.85rem !important;
              border-radius: 12px !important;
            }

            /* History modal item responsiveness */
            .history-item {
              padding: 8px 6px !important;
              gap: 8px !important;
            }
            .history-avatar {
              width: 32px !important;
              height: 32px !important;
              font-size: 0.85rem !important;
            }
            .history-name {
              font-size: 0.8rem !important;
            }
            .history-info {
              font-size: 0.65rem !important;
              margin-top: 1px !important;
            }
            .history-reconnect-btn {
              padding: 4px 8px !important;
              font-size: 0.65rem !important;
              border-radius: 6px !important;
            }
          }

          @media (max-width: 480px) {
            .hero-title {
              font-size: 2rem !important;
            }
            .experience-stats {
              flex-direction: column;
              gap: 20px !important;
            }
            .support-features {
              grid-template-columns: 1fr !important;
            }
            .brand-group h1 {
              font-size: 1.2rem;
            }
            .header-coins-pill {
              padding: 4px 10px;
            }
            .coin-count {
              font-size: 0.75rem;
            }
          }
          /* Explore Worldwide - Premium Split Hero Layout Styling */
          .hero-split-container {
            display: flex;
            flex-direction: column;
            gap: 40px;
            max-width: 1240px;
            width: 100%;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .hero-split-container.centered-hero {
            align-items: center;
            justify-content: center;
            text-align: center;
            min-height: 50vh;
          }
          .hero-top-columns {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 50px;
            align-items: center;
            width: 100%;
          }
          .centered-hero .hero-top-columns {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            gap: 20px;
          }
          .hero-left-column {
            text-align: left;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            animation: fadeIn 0.8s ease-out;
            max-width: 580px;
          }
          .centered-hero .hero-left-column {
            text-align: center;
            align-items: center;
            justify-content: center;
            max-width: 800px;
            margin: 0 auto;
          }
          .hero-interactive-graphic {
            position: relative;
            width: 100%;
            max-width: 580px;
            height: 480px;
            display: flex;
            align-items: center;
            justify-content: center;
            perspective: 1000px;
            animation: fadeIn 1s ease-out;
            background: transparent;
            border: none;
            box-shadow: none;
            overflow: visible;
          }
          .world-map-image-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 1;
            mix-blend-mode: screen;
            opacity: 0.65;
            pointer-events: none;
          }
          .card-photo {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: 2px solid #a855f7;
            object-fit: cover;
            box-shadow: 0 0 10px rgba(168, 85, 247, 0.4);
          }
          .profile-map-1 {
            top: 55px;
            left: 20px;
            animation: float-p1 5s ease-in-out infinite alternate;
          }
          .profile-map-2 {
            top: 65px;
            left: 210px;
            animation: float-p2 6s ease-in-out infinite alternate;
          }
          .profile-map-3 {
            top: 75px;
            right: 20px;
            animation: float-p3 7s ease-in-out infinite alternate;
          }
          .profile-map-4 {
            bottom: 65px;
            left: 25px;
            animation: float-p4 5.5s ease-in-out infinite alternate;
          }
          .profile-map-5 {
            bottom: 75px;
            left: 230px;
            animation: float-p1 6.5s ease-in-out infinite alternate;
          }
          .profile-map-6 {
            bottom: 55px;
            right: 30px;
            animation: float-p2 5s ease-in-out infinite alternate;
          }
          
          /* Mini Core matching beacon in the center of the world */
          .hub-center-mini {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 30px;
            height: 30px;
            z-index: 2;
          }
          .hub-core-mini {
            width: 100%;
            height: 100%;
            background: #a855f7;
            border-radius: 50%;
            box-shadow: 0 0 20px #a855f7;
            position: relative;
          }
          .live-signal-ripple, .live-signal-ripple-2 {
            position: absolute;
            top: -20px;
            left: -20px;
            width: 70px;
            height: 70px;
            border-radius: 50%;
            border: 1px solid rgba(168, 85, 247, 0.5);
            animation: signal-ripple 3s infinite linear;
          }
          .live-signal-ripple-2 {
            animation-delay: 1.5s;
          }
          @keyframes signal-ripple {
            0% { transform: scale(0.4); opacity: 1; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          .hero-explore-title {
            font-size: 3.8rem;
            font-weight: 900;
            line-height: 1.1;
            margin-bottom: 20px;
            color: white;
            letter-spacing: -0.03em;
          }
          .hero-explore-title span {
            background: linear-gradient(135deg, #c084fc, #f472b6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .hero-explore-subtitle {
            font-size: 1.25rem !important;
            line-height: 1.6 !important;
            color: #94a3b8 !important;
            margin-bottom: 35px !important;
            max-width: 720px;
            text-align: center !important;
            font-weight: 400;
            margin-left: auto;
            margin-right: auto;
          }
          .seo-content-section {
            max-width: 900px;
            margin: 0 auto;
            padding: 60px 24px 0;
            text-align: center;
          }
          .seo-paragraph {
            font-size: 1.1rem;
            line-height: 1.8;
            color: #94a3b8;
            font-weight: 400;
            margin: 0;
          }
          .seo-paragraph strong {
            color: #cbd5e1;
            font-weight: 600;
          }
          .hero-interactive-graphic {
            position: relative;
            width: 100%;
            max-width: 500px;
            height: 500px;
            display: flex;
            align-items: center;
            justify-content: center;
            perspective: 1000px;
            animation: fadeIn 1s ease-out;
          }
          .floating-card {
            position: absolute;
            background: rgba(15, 23, 42, 0.55);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 20px;
            padding: 12px 18px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
            z-index: 5;
            transition: all 0.3s ease;
          }
          .floating-card:hover {
            transform: translateY(-8px) scale(1.05) !important;
            border-color: rgba(168, 85, 247, 0.4);
            box-shadow: 0 20px 45px rgba(168, 85, 247, 0.25);
            background: rgba(30, 41, 59, 0.7);
          }
          .card-info h4 {
            margin: 0 0 2px 0;
            font-size: 0.95rem;
            font-weight: 700;
            color: white;
          }
          .live-pill {
            font-size: 0.65rem;
            font-weight: 800;
            color: #10b981;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .connection-svg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
          }
          .pulse-line {
            fill: none;
            stroke-width: 2.5;
            stroke-dasharray: 8 6;
            animation: line-pulse 2s linear infinite;
          }
          .line-1 { stroke: rgba(168, 85, 247, 0.4); }
          .line-2 { stroke: rgba(236, 72, 153, 0.4); }
          .line-3 { stroke: rgba(59, 130, 246, 0.4); }
          .line-4 { stroke: rgba(16, 185, 129, 0.4); }
          @keyframes line-pulse {
            from { stroke-dashoffset: 50; }
            to { stroke-dashoffset: 0; }
          }
          .hero-stats-premium-strip {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 25px;
            width: 100%;
            margin-top: 40px;
            animation: fadeIn 1.2s ease-out;
          }
          .stat-premium-card {
            background: rgba(15, 23, 42, 0.45);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 30px 25px;
            text-align: center;
            box-shadow: 0 15px 35px rgba(0,0,0,0.3);
            transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }
          .stat-premium-card:hover {
            transform: translateY(-10px) scale(1.03);
            border-color: rgba(168, 85, 247, 0.35);
            box-shadow: 0 25px 60px rgba(168, 85, 247, 0.15);
            background: rgba(30, 41, 59, 0.6);
          }
          .stat-premium-card h3 {
            font-size: 3rem;
            font-weight: 900;
            margin: 0;
            line-height: 1;
            letter-spacing: -1.5px;
          }
          .stat-label {
            font-size: 0.95rem;
            color: #ffffff;
            margin: 0;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .stat-desc {
            font-size: 0.8rem;
            color: #64748b;
            margin: 0;
            font-weight: 500;
            line-height: 1.4;
            max-width: 220px;
          }

          .hero-right-column {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            width: 100%;
            animation: fadeIn 1s ease-out;
          }
          .world-map-wrapper {
            position: relative;
            width: 100%;
            max-width: 620px;
            aspect-ratio: 2 / 1;
            background-image: url('/global_connection_2_1778758015960.webp');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.06);
          }
          .logo-icon-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            background: transparent;
            border-radius: 0;
            box-shadow: none;
            transition: transform 0.3s ease;
          }
          .logo-icon-wrapper svg {
            filter: drop-shadow(0 3px 10px rgba(99, 102, 241, 0.45));
          }
          .logo-icon-wrapper:hover {
            transform: scale(1.06);
          }
          .logo-icon-wrapper:hover svg {
            filter: drop-shadow(0 4px 14px rgba(168, 85, 247, 0.55));
          }
          .avatar-small {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 1.5px solid #d946ef;
            overflow: hidden;
            display: inline-flex;
            margin-right: -4px;
            flex-shrink: 0;
          }


            /* Floating Translucent Country Badges */
            .country-badge {
              position: absolute;
              display: flex;
              align-items: center;
              gap: 12px;
              background: rgba(15, 23, 42, 0.55);
              backdrop-filter: blur(12px);
              -webkit-backdrop-filter: blur(12px);
              border: 1px solid rgba(255, 255, 255, 0.08);
              padding: 8px 16px;
              border-radius: 16px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
              z-index: 10;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              cursor: pointer;
              animation: float-badge 6s ease-in-out infinite alternate;
            }
            .country-badge:hover {
              transform: translateY(-6px) scale(1.05) !important;
              border-color: rgba(99, 102, 241, 0.5);
              box-shadow: 0 15px 40px rgba(99, 102, 241, 0.25);
              background: rgba(15, 23, 42, 0.85);
            }
            .badge-text {
              display: flex;
              flex-direction: column;
              text-align: left;
              line-height: 1.2;
            }
            .country-flag {
              font-size: 1.5rem;
              display: flex;
              align-items: center;
            }
            .country-name {
              font-size: 0.85rem;
              font-weight: 700;
              color: white;
            }
            .online-count {
              font-size: 0.75rem;
              color: #10b981;
              font-weight: 600;
              margin-top: 1px;
            }

            @keyframes float-badge {
              0% { transform: translateY(0px); }
              100% { transform: translateY(-10px); }
            }

            .badge-usa { animation-delay: 0s; }
            .badge-uk { animation-delay: 1.2s; }
            .badge-india { animation-delay: 2.4s; }
            .badge-brazil { animation-delay: 0.6s; }
            .badge-australia { animation-delay: 1.8s; }

            .pulsing-hubs circle {
              animation: pulse-glow 2s infinite alternate;
            }
            @keyframes pulse-glow {
              0% { r: 5px; opacity: 0.8; }
              100% { r: 9px; opacity: 1; filter: drop-shadow(0 0 6px currentColor); }
            }

            /* Responsive tweaks for split layout */
            @media (max-width: 1024px) {
              .hero-top-columns {
                grid-template-columns: 1fr !important;
                gap: 50px;
                text-align: center;
              }
              .hero-left-column {
                align-items: center;
                text-align: center;
                max-width: 100%;
              }
              .hero-explore-subtitle {
                text-align: center !important;
                margin-left: auto;
                margin-right: auto;
              }
              .hero-stats-premium-strip {
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 20px !important;
              }
            }

            @media (max-width: 768px) {
              .hero-explore-title {
                font-size: 2.2rem !important;
                line-height: 1.2 !important;
                padding: 0 10px !important;
                word-wrap: break-word !important;
              }
              .hero-explore-subtitle {
                font-size: 1.1rem !important;
              }
              .hero-stats-premium-strip {
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 15px !important;
              }
              .stat-premium-card {
                padding: 15px !important;
              }
              .stat-premium-card h3 {
                font-size: 1.8rem !important;
              }
              .stat-premium-card p {
                font-size: 0.7rem !important;
              }
              .hero-interactive-graphic {
                max-width: 340px !important;
                height: 280px !important;
                margin: 0 auto !important;
                background-size: cover !important;
              }
              .floating-card {
                padding: 4px 8px !important;
                border-radius: 12px !important;
              }
              .card-photo {
                width: 24px !important;
                height: 24px !important;
              }
              .card-info h4 {
                font-size: 0.65rem !important;
              }
              .live-pill {
                font-size: 0.5rem !important;
              }
              .profile-map-1 { top: 25px !important; left: 10px !important; }
              .profile-map-2 { display: none !important; }
              .profile-map-3 { top: 30px !important; right: 10px !important; }
              .profile-map-4 { bottom: 25px !important; left: 10px !important; }
              .profile-map-5 { display: none !important; }
              .profile-map-6 { bottom: 30px !important; right: 10px !important; }
              .country-badge {
                padding: 4px 8px !important;
                gap: 6px !important;
                border-radius: 10px !important;
              }
              .country-flag {
                font-size: 1.1rem !important;
              }
              .country-name {
                font-size: 0.7rem !important;
              }
              .online-count {
                font-size: 0.6rem !important;
              }
              /* Pricing Container */
              .pricing-container {
                grid-template-columns: 1fr !important;
                gap: 20px !important;
                padding: 0 10px !important;
              }
              .premium-card {
                padding: 25px 20px !important;
                border-radius: 24px !important;
              }
              .premium-card .amount {
                font-size: 2.2rem !important;
              }
              /* VIP Elite Banner */
              .elite-hero-banner {
                flex-direction: column !important;
                padding: 20px !important;
                gap: 20px !important;
                border-radius: 24px !important;
              }
              .elite-features-grid {
                grid-template-columns: 1fr !important;
                gap: 10px !important;
              }
              .elite-feature-item {
                padding: 12px !important;
                border-radius: 12px !important;
              }
              /* Coins Grid */
              .coins-grid {
                grid-template-columns: 1fr 1fr !important;
                gap: 12px !important;
              }
              .coin-square-card {
                padding: 15px 10px !important;
                border-radius: 16px !important;
                aspect-ratio: auto !important;
                height: auto !important;
              }
              .coin-card-icon {
                font-size: 2rem !important;
                margin-bottom: 0.5rem !important;
              }
              .coin-card-name {
                font-size: 0.85rem !important;
              }
              .price-now {
                font-size: 1.1rem !important;
              }
              .price-old {
                font-size: 0.75rem !important;
              }
              .coin-mini-badge {
                font-size: 0.55rem !important;
                padding: 2px 6px !important;
                top: 8px !important;
                right: 8px !important;
              }
            }
          }
        `}</style>
      <PremiumModal
        isOpen={premiumModal.isOpen}
        onClose={() => setPremiumModal(prev => ({ ...prev, isOpen: false }))}
        title={premiumModal.title}
        message={premiumModal.message}
        type={premiumModal.type}
        confirmText={premiumModal.confirmText}
        cancelText={premiumModal.cancelText}
        onConfirm={premiumModal.onConfirm}
      />
    </div>
  );
}
