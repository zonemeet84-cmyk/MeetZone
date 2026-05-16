import PremiumModal from "../components/PremiumModal";
import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import axios from "axios";
import { useSession, signOut } from "next-auth/react";
import { Country, State } from "country-state-city";

// Helper to get Country Flag Image URL from name or ISO code
const getFlagUrl = (countryInput) => {
  if (!countryInput) return null;
  let code = countryInput;
  if (countryInput.length !== 2) {
    const found = Country.getAllCountries().find(c => c.name.toLowerCase() === countryInput.toLowerCase());
    if (found) code = found.isoCode;
    else return null;
  }
  return `https://flagcdn.com/w20/${code.toLowerCase()}.png`;
};

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
  const [authLoading, setAuthLoading] = useState(true);
  const [currency, setCurrency] = useState("INR");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentStep, setPaymentStep] = useState("methods");
  const [showProfileDrop, setShowProfileDrop] = useState(false);
  const [dailyStatus, setDailyStatus] = useState(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCoinPopup, setShowCoinPopup] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(0);
  const [purchaseFeature, setPurchaseFeature] = useState("");
  const [referralStats, setReferralStats] = useState(null);
  const [referralCopied, setReferralCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [transferRecipientId, setTransferRecipientId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [isGifting, setIsGifting] = useState(false);
  const [giftRecipientId, setGiftRecipientId] = useState("");

  // ZoneMeetBot State
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [botMessages, setBotMessages] = useState([
    { text: "Hi there! I'm ZoneMeetBot 🤖. I know everything about this platform. Ask me about Coins, VIP Elite, Rules, or how to Video Chat!", sender: "bot" }
  ]);
  const [botInput, setBotInput] = useState("");
  const botEndRef = useRef(null);

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
      const res = await axios.get(`https://meetzone-backend.onrender.com/api/user/leaderboard?filter=${filterType}&email=${user?.email || ''}`);
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
          en: "Our Premium Plans are designed for the best experience: \n\n✨ **Starter (₹99):** Filters + 50 Coins.\n🚀 **Prime (₹349):** ALL Filters + 150 Coins.\n💎 **Silver (₹999):** 90 Days + 500 Coins.\n👑 **VIP Elite (₹899):** Age Filter + Stealth Mode + 400 Coins. \n\nCheck the 'Pricing' section for full details!",
          hi: "Humare VIP plans aapko best filters dete hain: \n\n✨ **Starter (₹99):** Filters + 50 Coins.\n🚀 **Prime (₹349):** Saare Filters + 150 Coins.\n💎 **Silver (₹999):** 90 Din + 500 Coins.\n👑 **VIP Elite (₹899):** Age Filter + Invisible Mode + 400 Coins. \n\n'Pricing' section mein saari details dekh sakte hain!"
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
          keywords: ['video', 'chat', 'start', 'call', 'match', 'stranger', 'random', 'camera', 'mic'],
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
          keywords: ['history', 'recent', 'recentstrangers', 'missed', 'reconnect'],
          en: "Missed someone? Check your **Recent Connections** icon. You can request to Reconnect for only 10 coins!",
          hi: "Agar koi miss ho jaye, toh 'Recent Connections' mein jaake 10 coins mein firse connect kar sakte hain!"
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
    axios.get("https://meetzone-backend.onrender.com/api/ping").catch(() => {});

    const checkAuth = async () => {
      let currentUserData = null;

      if (session) {
        const stored = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : {};

        // SYNC WITH BACKEND IF TOKEN MISSING
        if (!token || token === "undefined") {
          try {
            const referralCode = localStorage.getItem("referral") || undefined;
            const res = await axios.post("https://meetzone-backend.onrender.com/api/auth/session-login", {
              email: session.user.email,
              name: session.user.name,
              referralCode
            });
            if (res.data.token) {
              localStorage.setItem("token", res.data.token);
              localStorage.setItem("user", JSON.stringify(res.data.user));
              localStorage.removeItem("referral"); // Clear after use
              currentUserData = res.data.user;
              setUser(currentUserData);
            }
          } catch (e) { console.error("Sync Error", e); }
        } else {
          // Always verify to get latest profile on load
          try {
            const res = await axios.get("https://meetzone-backend.onrender.com/api/auth/verify", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.valid) {
              currentUserData = res.data.user;
              if (currentUserData.email === "ds9376314@gmail.com") {
                currentUserData.premium = true;
                currentUserData.planName = "VIP Elite";
              }
              setUser(currentUserData);
              if (currentUserData.unlockedFilters) {
                // Ensure we don't lose filters when syncing on home page
                localStorage.setItem("user", JSON.stringify(currentUserData));
              } else {
                localStorage.setItem("user", JSON.stringify(currentUserData));
              }
            } else {
              currentUserData = { ...stored, name: session.user.name, email: session.user.email };
              setUser(currentUserData);
            }
          } catch (e) {
            currentUserData = { ...stored, name: session.user.name, email: session.user.email };
            setUser(currentUserData);
          }
        }

        if (currentUserData && (!currentUserData.gender || currentUserData.gender === "All" || currentUserData.gender === "Other" || !currentUserData.country || currentUserData.country === "Unknown" || currentUserData.country === "All")) {
          setShowOnboarding(true);
        }
      } else if (token && token !== "undefined") {
        try {
          const res = await axios.get("https://meetzone-backend.onrender.com/api/auth/verify", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data.valid) {
            let userData = res.data.user;
            if (userData.email === "ds9376314@gmail.com") {
              userData.premium = true;
              userData.planName = "VIP Elite";
            }
            setUser(userData);
            if (userData.unlockedFilters) {
              localStorage.setItem("user", JSON.stringify(userData));
            } else {
              localStorage.setItem("user", JSON.stringify(userData));
            }
            if (!res.data.user.gender || res.data.user.gender === "Other" || !res.data.user.country || res.data.user.country === "Unknown") {
              setShowOnboarding(true);
            }
          }
        } catch (err) {
          const savedUser = localStorage.getItem("user");
          if (savedUser) setUser(JSON.parse(savedUser));
        }
      }
      setAuthLoading(false);
    };

    // Fallback: If auth takes more than 8 seconds, force hide the loader
    const timeout = setTimeout(() => setAuthLoading(false), 8000);

    checkAuth();
    return () => clearTimeout(timeout);
  }, [session]);

  useEffect(() => {
    if (user && (user.email || user.phone) && !dailyStatus) {
      axios.post("https://meetzone-backend.onrender.com/api/user/daily-check", { email: user.email, phone: user.phone })
        .then(res => {
          if (res.data.success) {
            setDailyStatus(res.data);
            if (
              res.data.status === "streak_broken" ||
              res.data.status === "streak_increased" ||
              res.data.status === "streak_complete" ||
              res.data.status === "new_streak"
            ) {
              setShowStreakModal(true);
            }
            if (res.data.coins !== user.coins || res.data.streak !== user.streak || res.data.coinActivity) {
              const updated = { ...user, coins: res.data.coins, streak: res.data.streak, coinActivity: res.data.coinActivity || user.coinActivity };
              setUser(updated);
              localStorage.setItem("user", JSON.stringify(updated));
            }
          }
        })
        .catch(err => console.error("Daily Check Error", err));
    }
  }, [user, dailyStatus]);

  // Redirect if logged in
  useEffect(() => {
    if (session) {
      router.push("/");
    } else {
      const token = localStorage.getItem("token");
      if (token && token !== "undefined") {
        router.push("/");
      }
    }
  }, [session, router]);

  // Fetch referral stats when user is loaded
  useEffect(() => {
    const fetchReferral = async () => {
      const token = localStorage.getItem("token");
      if (user && token && !referralStats) {
        try {
          const res = await axios.get("https://meetzone-backend.onrender.com/api/referral/stats", {
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
      const res = await axios.post("https://meetzone-backend.onrender.com/api/user/collect-daily-reward", { email: user.email, phone: user.phone });
      if (res.data.success) {
        const updated = { ...user, coins: res.data.coins, streak: res.data.streak, bonusClaimedToday: true };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        setDailyStatus({ ...dailyStatus, canCollect: false });
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
          const res = await axios.post('https://meetzone-backend.onrender.com/api/user/spend-coins', {
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
      const res = await axios.post("https://meetzone-backend.onrender.com/api/referral/redeem", {
        referralCode: redeemCode
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const updatedUser = { ...user, coins: res.data.user.coins, referredBy: res.data.user.referredBy, coinActivity: res.data.user.coinActivity };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setRedeemCode("");
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
  const handleTransferCoins = async () => {
    if (!transferRecipientId.trim() || !transferAmount || Number(transferAmount) <= 0) {
      return showModal({ message: "Please enter a valid Recipient ID and amount.", type: "warning" });
    }

    showModal({
      title: "Confirm Transfer",
      message: `Send ${transferAmount} coins to User ID ${transferRecipientId}? This cannot be undone.`,
      type: "question",
      confirmText: "Send Coins",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.post("https://meetzone-backend.onrender.com/api/user/transfer-coins", {
            recipientId: transferRecipientId,
            amount: Number(transferAmount)
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.data.success) {
            const updatedUser = { ...user, coins: res.data.newBalance, coinActivity: res.data.coinActivity };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setTransferRecipientId("");
            setTransferAmount("");
            showModal({
              title: "Transfer Success!",
              message: res.data.message,
              type: "success"
            });
          }
        } catch (err) {
          showModal({
            message: err.response?.data?.message || "Server Error: Please restart your backend.",
            type: "error"
          });
        }
      }
    });
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
      const res = await axios.post("https://meetzone-backend.onrender.com/api/user/open-box", {
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
      const res = await axios.post("https://meetzone-backend.onrender.com/api/user/save-streak", {
        email: user.email,
        oldStreak: dailyStatus.oldStreak
      });
      if (res.data.success) {
        const updated = { ...user, coins: res.data.coins, streak: res.data.streak, coinActivity: res.data.coinActivity };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        setDailyStatus({ ...dailyStatus, status: "streak_saved", streak: res.data.streak, canCollect: true });
        setShowStreakModal(false);
        showModal({ message: `✅ Streak Restored! 50 coins deducted. You're back on a ${res.data.streak}-day streak.`, type: "success" });
      } else {
        showModal({ message: res.data.message || "Failed to save streak.", type: "info" });
      }
    } catch (err) {
      showModal({ message: err.response?.data?.message || "Failed to save streak", type: "error" });
    }
  };

  // claimBonus is now handled by collectDailyReward for day 7 as well
  const claimBonus = collectDailyReward;


  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
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

      const res = await axios.post("https://meetzone-backend.onrender.com/api/auth/update-profile", {
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

  const startEdit = () => {
    // Find country and state codes for the form
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
    setShowProfileDrop(false);
    setShowOnboarding(true);
  };

  const logout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    if (session) {
      await signOut({ redirect: false });
    }
    router.push("/login");
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
    console.log("Active User:", storedUser);

    if (!storedUser || !storedUser.gender || storedUser.gender === "Other" || !storedUser.country || storedUser.country === "Unknown" || storedUser.gender === "All") {
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


  const handleRazorpayPayment = async () => {
    if (!user) {
      showModal({ message: "Please login first", type: "info" });
      return;
    }

    try {
      setPaymentStep("processing");

      // 1. Create order on backend
      const amountInPaise = selectedPlan.name === "Starter" ? 9900 : selectedPlan.name === "Prime" ? 34900 : selectedPlan.name === "Silver" ? 99900 : 89900;

      const orderRes = await axios.post("https://meetzone-backend.onrender.com/api/payment/razorpay/order", {
        amount: amountInPaise,
        currency: "INR"
      });

      const options = {
        key: "YOUR_RAZORPAY_KEY_ID", // Admin should set this in .env, but here we'll try to fetch it if possible or alert
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        name: "ZoneMeet Premium",
        description: `Upgrade to ${selectedPlan.name}`,
        order_id: orderRes.data.id,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post("https://meetzone-backend.onrender.com/api/payment/razorpay/verify", {
              ...response,
              userEmail: user.email,
              planName: selectedPlan.name,
              giftRecipientId: isGifting ? giftRecipientId : null
            });

            if (verifyRes.data.success) {
              const updatedUser = { ...user, ...verifyRes.data.user };
              setUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
              setPaymentStep("success");
            } else {
              showModal({ message: "Payment verification failed. If money was deducted, contact support.", type: "info" });
              setPaymentStep("methods");
            }
          } catch (err) {
            console.error(err);
            showModal({ message: "Payment verification failed. Please try again later.", type: "error" });
            setPaymentStep("methods");
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: "#6366f1"
        },
        modal: {
          ondismiss: () => setPaymentStep("methods")
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      setPaymentStep("methods");
      showModal({ message: "⚠️ Error connecting to payment gateway. Admin: Ensure Razorpay Keys are set in .env", type: "info" });
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Dashboard | ZoneMeet</title>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </Head>

      <div className="bg-gradient" />

      <div className="header">
        <div className="brand-group">
          <h1 className="logo-text">Zone<span className="logo-highlight">Meet</span><span className="logo-dot">.</span></h1>
          {user?.premium && <span className="premium-badge">{user.planName || "PREMIUM"}</span>}
        </div>

        <nav className="header-nav" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
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
          {user?.email === "ds9376314@gmail.com" && (
            <div className="nav-link" onClick={() => router.push("/admin")} style={{ cursor: 'pointer', fontWeight: '800', fontSize: '0.9rem', color: '#f59e0b', transition: 'all 0.3s' }}>⚡ Admin</div>
          )}
        </nav>
        {authLoading ? (
          <div className="user-info">
            <span className="loading-dots">Verifying session...</span>
          </div>
        ) : user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* STREAK PILL */}
            {user && (
              <div
                className="header-streak-pill"
                onClick={() => setShowStreakModal(true)}
                title={`${user.streak || 0} day login streak! Log in 7 days in a row for 100 free coins.`}
              >
                <span className="streak-fire">🔥</span>
                <div className="streak-info">
                  <span className="streak-count">{user.streak || 0}</span>
                  <span className="streak-label">/ 7</span>
                </div>
                {/* Progress Bar */}
                <div className="streak-bar-wrap">
                  <div className="streak-bar-fill" style={{ width: `${Math.min(((user.streak || 0) / 7) * 100, 100)}%` }} />
                </div>
              </div>
            )}
            <div className="header-coins-pill" onClick={() => document.getElementById("coins-section")?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="coin-icon">💰</span>
              <span className="coin-count">{user.coins || 0}</span>
              <span className="plus-icon">+</span>
            </div>

            <div className="profile-dropdown-container">
              <div className="profile-trigger" onClick={() => setShowProfileDrop(!showProfileDrop)} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <span style={{ color: '#ffffff', fontWeight: '500', fontSize: '1rem' }}>
                  {user.name} {user.email === "ds9376314@gmail.com" && <span style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: '800', border: '1px solid #f59e0b', padding: '1px 5px', borderRadius: '4px', marginLeft: '5px' }}>VIP</span>}
                </span>
                <div className="profile-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
              </div>
              {showProfileDrop && (
                <div className="profile-modal-overlay" onClick={() => setShowProfileDrop(false)}>
                  <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
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
                      {!user.premium && (
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
                      )}

                      {/* Balances Section */}
                      <div className="profile-balances">
                        <div className="profile-balance-item" title="My ZoneMeet Coins">
                          <span className="profile-balance-icon">💰</span> {user.coins || 0}
                        </div>
                        <div className="profile-balance-divider"></div>
                        <div className="profile-balance-item" title="Daily Login Streak" style={{ color: user.streak > 0 ? '#ff4500' : 'inherit' }}>
                          <span className="profile-balance-icon">🔥</span> {user.streak || 0}
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
                                const res = await axios.post("https://meetzone-backend.onrender.com/api/user/spend-coins", { email: user.email, amount: 100, feature: "profile_boost" });
                                if (res.data.success) {
                                  const newUser = { ...user, coins: res.data.coins, boostExpiry: res.data.boostExpiry, coinActivity: res.data.coinActivity }; setUser(newUser);
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
                            `Active (${Math.floor((user.boostExpiry - currentTime) / 60000).toString().padStart(2, '0')}:${Math.floor(((user.boostExpiry - currentTime) % 60000) / 1000).toString().padStart(2, '0')})`
                            : "Boost"}
                        </div>
                      </div>

                      {/* COIN CENTER BOX */}
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '15px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '15px' }}>

                        {/* Redeem Referral */}
                        {!user.referredBy && (
                          <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', padding: '12px', borderRadius: '16px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', marginBottom: '8px' }}>🎁 Referral Code</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="text"
                                placeholder="Code"
                                value={redeemCode}
                                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                                style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 12px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                              />
                              <button
                                onClick={handleRedeemReferral}
                                style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0 12px', borderRadius: '10px', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}
                              >
                                Redeem
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Transfer Coins */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '16px' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>💸 Transfer to Friend</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="text"
                                placeholder="ID"
                                value={transferRecipientId}
                                onChange={(e) => setTransferRecipientId(e.target.value)}
                                style={{ flex: 1.5, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 12px', color: '#fff', fontSize: '0.8rem', outline: 'none', minWidth: 0 }}
                              />
                              <input
                                type="number"
                                placeholder="Amt"
                                value={transferAmount}
                                onChange={(e) => setTransferAmount(e.target.value)}
                                style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 12px', color: '#fff', fontSize: '0.8rem', outline: 'none', minWidth: 0 }}
                              />
                            </div>
                            <button
                              onClick={handleTransferCoins}
                              style={{ width: '100%', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#fff', border: 'none', padding: '8px', borderRadius: '10px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              Send Coins Now
                            </button>
                          </div>
                        </div>

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
                            {getFlagUrl(user.country) && <img src={getFlagUrl(user.country)} alt="" style={{ width: '16px', height: '12px', borderRadius: '2px' }} />}
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


                      {/* Logout */}
                      <button className="profile-more-btn" onClick={logout} style={{ color: '#ef4444' }}>
                        <div className="profile-detail-left">🚪 Logout</div>
                        <span>›</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
        <div className="hero-content">
          <div className="status-badge">
            <div className="status-dot active"></div>
            <span>5,248 Users Online Now</span>
          </div>

          <h2 className="hero-title">
            Meet new people <br />
            <span>worldwide.</span>
          </h2>


          <p className="hero-description">
            The ultimate <strong>social video networking</strong> platform for <strong>live random chat</strong>.
            Experience high-quality video chat with people from over 100+ countries.
            Safe, fast, and completely anonymous.
          </p>

          <div className="action-buttons" style={{ position: 'relative', zIndex: 20 }}>
            <button className="btn btn-primary btn-lg" onClick={startChat} disabled={startingChat}>
              {startingChat ? "Connecting..." : "Start Random Video Chat"}
              {!startingChat && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>}
            </button>
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="icon">🌍</div>
            <h3>Worldwide</h3>
            <p>Connect with users globally.</p>
          </div>
          <div className="feature-card">
            <div className="icon">🛡️</div>
            <h3>Safe & Secure</h3>
            <p>End-to-end encrypted calls.</p>
          </div>
          <div className="feature-card">
            <div className="icon">⚡</div>
            <h3>Instant</h3>
            <p>Zero wait time for matching.</p>
          </div>
        </div>
      </main>

      {/* ABOUT ZONEMEET EXPERIENCE SECTION */}
      <div className="experience-section" style={{ padding: '100px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div className="experience-text">
            <h2 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '25px', lineHeight: '1.1' }}>
              Redefining Human <span>Connection</span>
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '30px' }}>
              ZoneMeet isn't just another video chat app; it's a global stage where strangers become friends in an instant.
              Our platform combines cutting-edge real-time technology with a focus on safety and serendipity.
              Whether you're looking for a deep conversation or a quick laugh, ZoneMeet connects you with the right person, at the right time.
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
              <img src="/video_chat_experience_1_1778757946493.png" alt="Experience" style={{ width: '100%', height: 'auto' }} />
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
              <img src="/global_connection_2_1778758015960.png" alt="Global" style={{ width: '100%', height: 'auto' }} />
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
              <img src="/safe_video_chat_3_1778758050606.png" alt="Safe" style={{ width: '100%', height: 'auto' }} />
            </div>
          </div>
        </div>
      </div>

      {/* GLOBAL FRIENDS NETWORK SECTION */}
      <div className="friends-promo-section" style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '80px', alignItems: 'center' }}>
          <div className="friends-visual" style={{ position: 'relative' }}>
            <img src="/global-friends.png" alt="Global Friends" style={{ width: '100%', borderRadius: '40px', boxShadow: '0 40px 100px rgba(99,102,241,0.2)' }} />
          </div>
          <div className="friends-text">
            <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '20px', letterSpacing: '-1px' }}>Build your <span>Global Circle.</span></h2>
            <p style={{ color: '#94a3b8', fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '30px' }}>
              Why stop at one conversation? Add interesting people to your <strong>Friends List</strong> and see when they are online. Direct call your friends anytime for <strong>FREE</strong>. Your global social network starts here.
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
            <img src="/home-support-3d.png" alt="Safety Shield" className="floating-3d-shield" />
            <div className="visual-glow" />
          </div>
          <div className="support-banner-text">
            <div className="support-tag">🛡️ ZERO TOLERANCE PLATFORM</div>
            <h2>Your Safety is our <br /><span>Top Priority.</span></h2>
            <p>
              Experience the web's safest random chat. Our <strong>AI Guardian</strong> technology works 24/7 to monitor streams and block inappropriate behavior instantly. Need help? Our human support team is just a click away.
            </p>
            <div className="support-features" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="s-feat">
                <span className="s-icon">💬</span>
                <div>
                  <h4>24/7 AI Chatbot</h4>
                  <p>Instant answers in any language.</p>
                </div>
              </div>
              <div className="s-feat">
                <span className="s-icon">🛡️</span>
                <div>
                  <h4>AI Monitoring</h4>
                  <p>Real-time stream safety scanning.</p>
                </div>
              </div>
              <div className="s-feat">
                <span className="s-icon">🔒</span>
                <div>
                  <h4>P2P Encryption</h4>
                  <p>Secured end-to-end video tunnels.</p>
                </div>
              </div>
              <div className="s-feat">
                <span className="s-icon">⚡</span>
                <div>
                  <h4>Instant Ban</h4>
                  <p>Violators removed in under 60s.</p>
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
              <span className="amount">{currency === "INR" ? "₹99" : "$1.07"}</span>
            </div>
            <ul className="premium-features">
              <li><span>✓</span> Gender & Country Filters</li>
              <li><span>✓</span> Priority Matching</li>
              <li><span>✓</span> Ad-Free Experience</li>
              <li><span>★</span> 50 ZoneMeet Coins (Free)</li>
            </ul>
            <button className="premium-btn" onClick={() => {
              setSelectedPlan({ name: "Starter", price: currency === "INR" ? "₹99" : "$1.07" });
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
              <span className="amount">{currency === "INR" ? "₹349" : "$3.82"}</span>
              <div className="savings">Save 18%</div>
            </div>
            <ul className="premium-features">
              <li><span>✓</span> All Gender & Country Filters</li>
              <li><span>✓</span> Instant Priority Matching</li>
              <li><span>✓</span> Unlimited Friend Requests</li>
              <li><span>★</span> 150 ZoneMeet Coins (Free)</li>
            </ul>
            <button className="premium-btn primary" onClick={() => {
              setSelectedPlan({ name: "Prime", price: currency === "INR" ? "₹349" : "$3.82" });
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
              <span className="amount">{currency === "INR" ? "₹999" : "$10.77"}</span>
              <div className="savings">Save 22%</div>
            </div>
            <ul className="premium-features">
              <li><span>✓</span> Season-Long Pro Access</li>
              <li><span>✓</span> Elite Identity Badge</li>
              <li><span>✓</span> Unlimited Interactions</li>
              <li><span>★</span> 500 ZoneMeet Coins (Free)</li>
            </ul>
            <button className="premium-btn" onClick={() => {
              setSelectedPlan({ name: "Silver", price: currency === "INR" ? "₹999" : "$10.77" });
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
                <span className="price">{currency === "INR" ? "₹899" : "$7.17"}</span>
                <span className="duration">/ 30 Days</span>
              </div>
              <button className="elite-btn-v3" onClick={() => {
                setSelectedPlan({ name: "VIP Elite", price: currency === "INR" ? "₹899" : "$7.17" });
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
              <strong>👤 Invisible Mode</strong>
              <p>Browse without being seen</p>
            </div>
          </div>
        </div>
      </div>


      {/* COINS SECTION */}
      <div className="pricing-section" id="coins-section" style={{ marginTop: '100px' }}>
        <div className="pricing-header">
          <h2 className="section-title">ZoneMeet <span>Coins</span> Store</h2>
          <p className="section-subtitle">Get coins to boost your profile or reconnect with strangers.</p>
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
                      NEXT RESET:<br/> {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}
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
            <div style={{ marginTop: '15px', fontWeight: '800', color: '#6366f1' }}>50 Coins Total</div>
          </div>
          <div className="utility-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👑</div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>VIP Privileges</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Coins are included free in VIP plans.</p>
            <div style={{ marginTop: '15px', fontWeight: '800', color: '#ec4899' }}>Free for VIPs</div>
          </div>
        </div>

        <div className="pricing-grid coins-grid">
          {[
            { name: "100 Coins", price: 49, original: 60, icon: "🪙", color: "#94a3b8" },
            { name: "200 Coins", price: 99, original: 150, icon: "💰", color: "#fbbf24", badge: "POP" },
            { name: "500 Coins", price: 199, original: 360, icon: "💎", color: "#6366f1" },
            { name: "1300 Coins", price: 499, original: 960, icon: "👑", color: "#ec4899", badge: "MAX" }
          ].map((pkg, idx) => (
            <div className="coin-square-card" key={idx} style={{ borderTop: `4px solid ${pkg.color}` }} onClick={() => {
              setSelectedPlan({ name: pkg.name, price: `₹${pkg.price}` });
              setPaymentStep("methods");
              setShowPaymentModal(true);
              setIsGifting(false);
              setGiftRecipientId("");
            }}>
              {pkg.badge && <div className="coin-mini-badge" style={{ background: pkg.color }}>{pkg.badge}</div>}
              <div className="coin-card-icon">{pkg.icon}</div>
              <div className="coin-card-name">{pkg.name}</div>
              <div className="coin-card-price">
                <span className="price-now">₹{pkg.price}</span>
                <span className="price-old">₹{pkg.original}</span>
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

          <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '25px' }}>
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
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.5' }}>Voice Change, Hide ID, Animated Avatars, Blurred Face & Animated Masks. The ultimate ninja mode.</p>
              <div className="buy-badge" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>Click to Purchase</div>
            </div>

            <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '20px' }}>
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <small style={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase' }}>Direct Reconnect</small>
                  <span>📞</span>
                </div>
                <h4 style={{ fontSize: '1.1rem', margin: '8px 0' }}>10 Coins</h4>
              </div>
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <small style={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase' }}>Stranger Messaging</small>
                  <span>💬</span>
                </div>
                <h4 style={{ fontSize: '1.1rem', margin: '8px 0' }}>5 Coins</h4>
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
                  </div>

                  <div className="methods-list-premium">
                    {currency === "INR" ? (
                      <>
                        <button className="pay-method-item" onClick={() => handleRazorpayPayment()}>
                          <div className="pay-icon-box">📱</div>
                          <div className="pay-details">
                            <strong>UPI Payment</strong>
                            <span>GPay, PhonePe, Paytm</span>
                          </div>
                          <div className="pay-arrow">›</div>
                        </button>
                        <button className="pay-method-item" onClick={() => handleRazorpayPayment()}>
                          <div className="pay-icon-box">💳</div>
                          <div className="pay-details">
                            <strong>Card Payment</strong>
                            <span>Debit & Credit Cards</span>
                          </div>
                          <div className="pay-arrow">›</div>
                        </button>
                        <button className="pay-method-item" onClick={() => handleRazorpayPayment()}>
                          <div className="pay-icon-box">🏦</div>
                          <div className="pay-details">
                            <strong>Net Banking</strong>
                            <span>All Indian Banks</span>
                          </div>
                          <div className="pay-arrow">›</div>
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="pay-method-item paypal" onClick={() => showModal({ message: "PayPal integration coming soon!", type: "info" })}>
                          <div className="pay-icon-box">🅿️</div>
                          <div className="pay-details">
                            <strong>PayPal</strong>
                            <span>Express International Checkout</span>
                          </div>
                          <div className="pay-arrow">›</div>
                        </button>
                        <button className="pay-method-item" onClick={() => handleRazorpayPayment()}>
                          <div className="pay-icon-box">💳</div>
                          <div className="pay-details">
                            <strong>Stripe / Card</strong>
                            <span>International Credit/Debit</span>
                          </div>
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
                    onChange={(e) => {
                      const states = State.getStatesOfCountry(e.target.value);
                      setOnboardForm({ ...onboardForm, countryCode: e.target.value, stateCode: states.length > 0 ? states[0].isoCode : "" });
                    }}
                  >
                    {Country.getAllCountries().map(c => (
                      <option key={c.isoCode} value={c.isoCode}>{c.flag} {c.name}</option>
                    ))}
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
                  {State.getStatesOfCountry(onboardForm.countryCode).length > 0 ? (
                    State.getStatesOfCountry(onboardForm.countryCode).map(s => (
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
        const currentStreak = user?.streak || 0;
        const DAILY_REWARDS = [
          { day: 1, coins: 5, icon: '🪙', label: 'Day 1' },
          { day: 2, coins: 10, icon: '🪙', label: 'Day 2' },
          { day: 3, coins: 15, icon: '💎', label: 'Day 3' },
          { day: 4, coins: 20, icon: '💎', label: 'Day 4' },
          { day: 5, coins: 25, icon: '⚡', label: 'Day 5' },
          { day: 6, coins: 50, icon: '🔥', label: 'Day 6' },
          { day: 7, coins: 100, icon: '👑', label: 'Day 7' },
        ];
        const isBroken = dailyStatus?.status === 'streak_broken';
        const canCollect = dailyStatus?.canCollect && !user?.bonusClaimedToday;
        const todayReward = dailyStatus?.todayReward || DAILY_REWARDS[Math.min(currentStreak, 6)]?.coins;
        const isGrandDay = currentStreak >= 7;

        return (
          <div className="payment-overlay" style={{ zIndex: 11000 }} onClick={() => setShowStreakModal(false)}>
            <div className="streak-reward-modal" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowStreakModal(false)} className="streak-modal-close">×</button>
              <div className="streak-modal-top">
                <div className="streak-big-fire">{isBroken ? '💔' : isGrandDay ? '👑' : '🔥'}</div>
                <h2 className="streak-modal-title">
                  {isBroken ? 'Streak Broken!' : isGrandDay ? '🎉 Grand Prize Unlocked!' : 'Daily Login Reward'}
                </h2>
                <p className="streak-modal-sub">
                  {isBroken
                    ? `You missed a day! Your ${dailyStatus.oldStreak}-day streak broke.`
                    : canCollect
                      ? `Collect your Day ${currentStreak} reward — +${todayReward} Coins!`
                      : `Come back tomorrow for Day ${currentStreak + 1}'s reward!`}
                </p>
              </div>

              {/* 7-Day Grid */}
              <div className="streak-days-grid">
                {DAILY_REWARDS.map(({ day, coins, icon, label }) => {
                  const done = currentStreak >= day;
                  const isToday = currentStreak === day;
                  const isNext = currentStreak + 1 === day;
                  const isGrand = day === 7;
                  return (
                    <div key={day} className={`streak-day-card ${done ? 'done' : ''} ${isToday && canCollect ? 'today' : ''} ${isNext && !canCollect ? 'today' : ''} ${isGrand ? 'grand' : ''}`}>
                      {done && !canCollect && <div className="streak-check">✓</div>}
                      {done && canCollect && isToday && <div className="streak-check" style={{ background: '#f59e0b' }}>!</div>}
                      <div className="streak-day-icon">{icon}</div>
                      <div className="streak-day-coins">+{coins}</div>
                      <div className="streak-day-label">{label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="streak-progress-wrap">
                <div className="streak-progress-fill" style={{ width: `${Math.min((currentStreak / 7) * 100, 100)}%` }} />
                <span className="streak-progress-text">{currentStreak}/7 days completed</span>
              </div>

              {/* Action Buttons */}
              {isBroken ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button className="streak-cta-btn broken" onClick={saveStreak}>
                    🛡️ Save Streak — 50 Coins
                  </button>
                  <button className="streak-skip-btn" onClick={() => setShowStreakModal(false)}>
                    Start fresh from Day 1
                  </button>
                </div>
              ) : canCollect ? (
                <button className={`streak-cta-btn ${isGrandDay ? 'grand' : 'normal'}`} onClick={collectDailyReward}>
                  {isGrandDay ? `👑 Claim Grand Prize — +100 Coins!` : `🎁 Collect Today's Reward — +${todayReward} Coins`}
                </button>
              ) : (
                <button className="streak-cta-btn normal" style={{ opacity: 0.7, cursor: 'default' }} onClick={() => setShowStreakModal(false)}>
                  ✅ Already Collected! Come back tomorrow
                </button>
              )}
            </div>
          </div>
        );
      })()}


      {/* HISTORY MODAL */}
      {showHistoryModal && (
        <div className="payment-overlay" style={{ zIndex: 11000 }} onClick={() => setShowHistoryModal(false)}>
          <div className="premium-modal" style={{ maxWidth: '440px', padding: 0, textAlign: 'left' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>🕒 Recent Connections</span>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ maxHeight: '65vh', overflowY: 'auto', padding: '1rem', scrollbarWidth: 'none' }}>
              {(!user?.recentStrangers || user.recentStrangers.length === 0) ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#475569' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🫥</div>
                  <p style={{ fontWeight: 600 }}>No recent connections yet.</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Start a chat to see your history here.</p>
                </div>
              ) : (
                user.recentStrangers.map((s, idx) => (
                  <div key={idx} style={{ padding: '12px 10px', borderBottom: idx === user.recentStrangers.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '12px', transition: 'background 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                        {s.name ? s.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>{s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          {s.country} • {new Date(s.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        showModal({
                          message: `Reconnect with ${s.name}? (10 Coins)`,
                          type: "question",
                          confirmText: "Reconnect",
                          cancelText: "Cancel",
                          onConfirm: async () => {
                            try {
                              const res = await axios.post('https://meetzone-backend.onrender.com/api/user/spend-coins', { email: user.email, amount: 10, feature: 'reconnect' });
                              if (res.data.success) {
                                setUser({ ...user, coins: res.data.coins });
                                const token = localStorage.getItem('token');
                                await axios.post('https://meetzone-backend.onrender.com/api/friends/request', { targetId: s.id, type: 'reconnect' }, { headers: { Authorization: `Bearer ${token}` } });
                                showModal({ message: `Request sent to ${s.name}!`, type: "success" });
                              }
                            } catch (err) {
                              showModal({ message: err.response?.data?.message || 'Failed', type: "error" });
                            }
                          }
                        });
                      }}
                      style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none', color: 'white', padding: '7px 14px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Reconnect
                    </button>
                  </div>
                ))
              )}
            </div>
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

        <div className="mystery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', maxWidth: '1100px', margin: '0 auto' }}>
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
                {[1,2,3,4,5].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: i % 2 === 0 ? '#fbbf24' : '#6366f1', animation: 'pulse 0.5s infinite alternate' }}></div>)}
              </div>
              <div style={{ position: 'absolute', top: '10%', right: '-15px', height: '80%', width: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                {[1,2,3,4,5].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: i % 2 === 0 ? '#6366f1' : '#fbbf24', animation: 'pulse 0.5s infinite alternate-reverse' }}></div>)}
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
        <div id="referral-section" style={{ padding: '80px 20px', maxWidth: '900px', margin: '40px auto 20px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 20px', fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: '800', color: '#fff', letterSpacing: '4px' }}>
                    {referralStats?.referralCode || "---"}
                  </div>
                  <button
                    onClick={() => {
                      if (!referralStats?.referralCode) return;
                      navigator.clipboard.writeText(referralStats.referralCode);
                      setReferralCopied(true);
                      setTimeout(() => setReferralCopied(false), 2000);
                    }}
                    style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8', padding: '14px 20px', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                  >
                    {referralCopied ? '✅ Copied!' : '📋 Copy Code'}
                  </button>
                </div>

                <div style={{ marginBottom: '12px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Invite Link</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 20px', fontSize: '0.85rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {typeof window !== 'undefined' ? `${window.location.origin}/?ref=${referralStats?.referralCode || ""}` : `zonemeet.com/?ref=${referralStats?.referralCode || ""}`}
                  </div>
                  <button
                    onClick={() => {
                      if (!referralStats?.referralCode) return;
                      const link = `${window.location.origin}/?ref=${referralStats.referralCode}`;
                      if (navigator.share) {
                        navigator.share({ title: 'Join ZoneMeet!', text: 'Join me on ZoneMeet — random video chat with real people!', url: link });
                      } else {
                        navigator.clipboard.writeText(link);
                        showModal({ message: 'Invite link copied! Share it with friends.', type: 'success' });
                      }
                    }}
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

      <div id="footer" style={{ textAlign: 'center', padding: '2rem 0', color: '#64748b', fontSize: '0.85rem', position: 'relative', zIndex: 10 }}>
        <p>You must be 18+ to use this service.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', marginTop: '1rem' }}>
          <a href="/terms" style={{ color: '#6366f1', textDecoration: 'none' }}>Terms &amp; Conditions</a>
          <a href="/privacy" style={{ color: '#6366f1', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/refund" style={{ color: '#6366f1', textDecoration: 'none' }}>Refund Policy</a>
          <a href="/guidelines" style={{ color: '#6366f1', textDecoration: 'none' }}>Community Guidelines</a>
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

        /* Profile Dropdown Styles */
        .profile-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: transparent; z-index: 1000; }
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

        .dashboard-hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding-top: 180px;
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

        .premium-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 32px; padding: 3rem 2rem; display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; transition: all 0.5s cubic-bezier(0.4,0,0.2,1); backdrop-filter: blur(10px); }
        .premium-card:hover { transform: translateY(-15px) scale(1.02); background: rgba(255,255,255,0.04); border-color: rgba(99,102,241,0.4); box-shadow: 0 30px 60px -12px rgba(0,0,0,0.5); }
        .premium-card.featured { background: linear-gradient(180deg, rgba(99,102,241,0.1) 0%, rgba(236,72,153,0.05) 100%); border: 1px solid rgba(99,102,241,0.5); transform: scale(1.08); z-index: 10; }
        .premium-card.featured:hover { transform: scale(1.1) translateY(-10px); }
        .popular-ribbon { position: absolute; top: -15px; background: linear-gradient(90deg, #6366f1, #ec4899); color: white; padding: 0.5rem 1.5rem; border-radius: 50px; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 10px 20px rgba(99,102,241,0.4); }
        .plan-icon { font-size: 3rem; margin-bottom: 1.5rem; }
        .card-header h3 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.25rem; color: white; }
        .card-header .duration { color: #64748b; font-size: 0.9rem; font-weight: 500; }
        .price-tag { margin: 2rem 0; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
        .amount { font-size: 3.5rem; font-weight: 900; color: white; letter-spacing: -0.02em; }
        .savings { background: rgba(16,185,129,0.1); color: #10b981; padding: 0.3rem 1rem; border-radius: 50px; font-size: 0.85rem; font-weight: 700; }
        .premium-features { list-style: none; padding: 0; margin: 0 0 2.5rem 0; width: 100%; display: flex; flex-direction: column; gap: 1rem; text-align: left; }
        .premium-features li { font-size: 0.95rem; color: #94a3b8; display: flex; align-items: center; gap: 0.75rem; }
        .premium-features li span { color: #6366f1; font-weight: 900; }
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
        .elite-features-grid { flex: 1; display: grid; grid-template-columns: 1fr; gap: 1.5rem; position: relative; z-index: 2; }
        .elite-feature-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 24px; transition: all 0.3s; }
        .elite-feature-item:hover { background: rgba(255,255,255,0.05); border-color: rgba(245,158,11,0.3); transform: translateX(10px); }
        .elite-feature-item strong { display: block; color: white; font-size: 1.1rem; margin-bottom: 0.25rem; }
        .elite-feature-item p { color: #64748b; font-size: 0.9rem; margin: 0; }

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
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 1.5rem;
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
        .streak-day-card.grand {
          background: linear-gradient(135deg, rgba(245,158,11,0.12), rgba(251,191,36,0.06));
          border-color: rgba(245,158,11,0.5);
        }
        .streak-day-card.grand.done {
          box-shadow: 0 0 20px rgba(245,158,11,0.35);
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
        .streak-cta-btn.broken { background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; box-shadow: 0 10px 30px rgba(99,102,241,0.35); }
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
        @media (max-width: 768px) {
          .bot-window {
            width: 300px;
            height: 400px;
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
