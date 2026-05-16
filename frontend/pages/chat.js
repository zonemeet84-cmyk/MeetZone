import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import * as nsfwjs from "nsfwjs";
import * as tf from "@tensorflow/tfjs";
import { Country, State } from "country-state-city";
import Script from "next/script";
// MediaPipe will be loaded via next/script

let socket;

const GENDERS = [
  { id: "all", name: "All Genders", icon: "🚻" },
  { id: "male", name: "Male Only", icon: "👨" },
  { id: "female", name: "Female Only", icon: "👩" },
];

const AGES = ["All Ages", "18-24", "25-34", "35-44", "45-54", "55+"];

// Preload Filter Images
let dogEarsImg, catEarsImg, animeEyesImg, glassesImg;
if (typeof window !== "undefined") {
  dogEarsImg = new Image();
  dogEarsImg.src = "https://i.imgur.com/BZlFjWg.png";
  catEarsImg = new Image();
  catEarsImg.src = "https://i.imgur.com/yY4R8Wm.png";
  animeEyesImg = new Image();
  animeEyesImg.src = "https://i.imgur.com/lXK9G6M.png";
  glassesImg = new Image();
  glassesImg.src = "https://i.imgur.com/YGmkF.png";
}

// AR Drawing Helpers
const drawImage = (ctx, img, x, y, w, h, angle) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
};

const glowCircle = (ctx, x, y, size) => {
  const gradient = ctx.createRadialGradient(x, y, 10, x, y, size);
  gradient.addColorStop(0, "rgba(0,255,255,0.8)");
  gradient.addColorStop(1, "rgba(0,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
};

const fireAura = (ctx, x, y, size) => {
  for (let i = 0; i < 20; i++) {
    const offsetX = (Math.random() - 0.5) * size;
    const offsetY = (Math.random() - 0.5) * size;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, ${Math.random() * 150}, 0, 0.5)`;
    ctx.arc(x + offsetX, y + offsetY, Math.random() * 15, 0, Math.PI * 2);
    ctx.fill();
  }
};

const particles = (ctx, x, y) => {
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.arc(x + (Math.random() - 0.5) * 100, y + (Math.random() - 0.5) * 100, Math.random() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
};


const STICKERS = [
  { id: 'heart', icon: '💖', price: 10, label: 'Love' },
  { id: 'rose', icon: '🌹', price: 50, label: 'Rose' },
  { id: 'diamond', icon: '💎', price: 100, label: 'Diamond' },
  { id: 'crown', icon: '👑', price: 500, label: 'Crown' },
  { id: 'car', icon: '🏎️', price: 1000, label: 'Supercar' },
];


export default function Home() {
  const { data: session, status: sessionStatus } = useSession();
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerConnection = useRef(null);
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  const onResultsRef = useRef(null);
  const nsfwModel = useRef(null);


  // Helper to convert 2-letter ISO country code to Emoji Flag
  const getFlagEmoji = (countryCode) => {
    if (!countryCode || countryCode.length !== 2) return "🌍";
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  // Helper to get Country Flag Image URL (Supports all countries, cross-platform safe)
  const getFlagUrl = (countryInput) => {
    if (!countryInput) return null;
    let code = countryInput;
    if (countryInput.length !== 2) {
      // It's a name, find the code
      const found = Country.getAllCountries().find(c => c.name.toLowerCase() === countryInput.toLowerCase());
      if (found) code = found.isoCode;
      else return null;
    }
    return `https://flagcdn.com/w20/${code.toLowerCase()}.png`;
  };

  // Helper to convert ISO code to Full Country Name (e.g. IN -> India)
  const getCountryName = (countryCode) => {
    if (!countryCode) return "Unknown";
    try {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
      return displayNames.of(countryCode.toUpperCase());
    } catch (e) {
      return countryCode;
    }
  };

  // --- CACHE BUSTER 1.0 ---
  const [friendReqStatus, setFriendReqStatus] = useState(false);
  const [friendNotification, setFriendNotification] = useState(null);
  const [showPartnerPreview, setShowPartnerPreview] = useState(false);

  const [partnerId, setPartnerId] = useState(null);
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [status, setStatus] = useState("Connecting to server...");
  const iceCandidatesQueue = useRef([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const router = useRouter();

  // Filters & Premium
  const [gender, setGender] = useState("all");
  const [country, setCountry] = useState("all");
  const [age, setAge] = useState("all");
  const [stateProv, setStateProv] = useState("All States");
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currency, setCurrency] = useState("INR");
  const [paymentStep, setPaymentStep] = useState("methods"); // 'methods', 'processing', 'success'
  // const [nsfwModel, setNsfwModel] = useState(null); // REMOVED duplicate
  const [showCoinPopup, setShowCoinPopup] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");

  // MediaPipe Filters
  const [activeMediaPipeFilter, setActiveMediaPipeFilter] = useState("None");
  const [unlockedFilters, setUnlockedFilters] = useState(["None"]); // Basic filters unlocked by default
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [receivedGift, setReceivedGift] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);


  const FILTERS_DATA = [
    { id: "None", name: "No Filter", icon: "🚫", cost: 0, category: "None" },
    // Beauty
    { id: "Smooth", name: "Skin Smooth", icon: "✨", cost: 80, category: "Beauty" },
    { id: "Glow", name: "Glow", icon: "🌟", cost: 50, category: "Beauty" },
    { id: "Whitening", name: "Whitening", icon: "⚪", cost: 100, category: "Beauty" },
    { id: "Beauty", name: "Beauty+", icon: "💄", cost: 120, category: "Beauty" },
    { id: "Makeup", name: "AI Makeup", icon: "💋", cost: 150, category: "Beauty" },
    // Funny
    { id: "Dog", name: "Dog Ears", icon: "🐶", cost: 50, category: "Funny" },
    { id: "Cat", name: "Cat Face", icon: "🐱", cost: 60, category: "Funny" },
    { id: "Beard", name: "Beard", icon: "🧔", cost: 90, category: "Funny" },
    { id: "Glasses", name: "Thug Glasses", icon: "🕶️", cost: 80, category: "Funny" },
    // Premium
    { id: "Anime", name: "Anime", icon: "🎎", cost: 200, category: "Premium" },
    { id: "Neon", name: "Neon Mask", icon: "⚡", cost: 180, category: "Premium" },
    // Couple
    { id: "Hearts", name: "Hearts", icon: "❤️", cost: 70, category: "Couple" },
    { id: "Fire", name: "Fire", icon: "🔥", cost: 90, category: "Couple" },
    { id: "Love", name: "Love Frame", icon: "🖼️", cost: 110, category: "Couple" }
  ];

  useEffect(() => {
    // Load NSFW Model via Ref
    const loadModel = async () => {
      if (typeof window !== "undefined" && window.nsfwjs && !nsfwModel.current) {
        try {
          const model = await window.nsfwjs.load();
          nsfwModel.current = model;
          console.log("NSFW Model Loaded");
        } catch (err) {
          console.error("NSFW Model Load Error:", err);
        }
      }
    };
    loadModel();
  }, []);

    // ROBUST MANUAL FACE TRACKING
    useEffect(() => {
      let faceMesh = null;
      let animationFrameId = null;

      const detectFace = async () => {
        if (localVideo.current && faceMeshRef.current) {
          const filter = activeFilterRef.current;
          // Only process frames if a filter is active to save CPU
          if (filter !== "None" && localVideo.current.readyState >= 2) {
            try {
              await faceMeshRef.current.send({ image: localVideo.current });
            } catch (e) {
              // Ignore errors
            }
          }
        }
        animationFrameId = requestAnimationFrame(detectFace);
      };


      const init = async () => {
        if (!window.FaceMesh) {
          setTimeout(init, 500);
          return;
        }

        try {
          const FaceMeshConstructor = window.FaceMesh.FaceMesh || window.FaceMesh;
          faceMesh = new FaceMeshConstructor({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559531/${file}`,
          });

          faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.8,
          });

          faceMesh.onResults(onResults);
          faceMeshRef.current = faceMesh;
          
          detectFace();
        } catch (err) {
          console.error("FaceMesh Init Error:", err);
        }
      };

      init();

      return () => {
        if (faceMesh) faceMesh.close();
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    }, []);


  const activeFilterRef = useRef("None");

  useEffect(() => {
    activeFilterRef.current = activeMediaPipeFilter;
  }, [activeMediaPipeFilter]);

  useEffect(() => {

    onResultsRef.current = (results) => {
      const cvs = canvasRef.current;
      if (!cvs) return;
      const ctx = cvs.getContext("2d");
      const w = cvs.width;
      const h = cvs.height;
      if (!w || !h) return;

      ctx.clearRect(0, 0, w, h);

      const currentFilter = activeFilterRef.current;
      if (currentFilter === "None") return;

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // COMMON CALCULATIONS
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const forehead = landmarks[10];
        const chin = landmarks[152];

        const x1 = leftEye.x * w;
        const y1 = leftEye.y * h;
        const x2 = rightEye.x * w;
        const y2 = rightEye.y * h;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);
        const faceWidth = Math.sqrt(dx * dx + dy * dy);
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;

        switch (currentFilter) {
          case "Dog": drawDogFilter(ctx, landmarks, w, h, centerX, centerY, faceWidth, angle); break;
          case "Cat": drawCatFilter(ctx, landmarks, w, h, centerX, centerY, faceWidth, angle); break;
          case "Beard": drawBeardFilter(ctx, landmarks, w, h); break;
          case "Glasses": drawGlassesFilter(ctx, landmarks, w, h); break;
          case "Neon": drawNeonMask(ctx, landmarks, w, h, centerX, centerY, faceWidth); break;
          case "Hearts": drawHeartsFilter(ctx, landmarks, w, h); break;
          case "Fire": drawFireFilter(ctx, landmarks, w, h, centerX, centerY, faceWidth); break;
          case "Glow": applyGlowEffect(ctx, w, h); break;
          case "Whitening": applyWhiteningEffect(ctx, w, h); break;
          case "Smooth": applySmoothingEffect(ctx, w, h); break;
          case "Love": drawLoveFrame(ctx, w, h); break;
          case "Anime": drawAnimeFilter(ctx, landmarks, w, h, centerX, centerY, faceWidth, angle); break;
          case "Beauty":
            ctx.filter = "brightness(1.1) contrast(1.1) blur(1px) saturate(1.2)";
            ctx.drawImage(localVideo.current, 0, 0, w, h);
            ctx.filter = "none";
            break;
          case "Makeup":
            ctx.fillStyle = "rgba(255,0,100,0.15)";
            ctx.beginPath();
            ctx.arc(centerX, centerY, faceWidth * 1.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.filter = "brightness(1.1) saturate(1.4)";
            ctx.drawImage(localVideo.current, 0, 0, w, h);
            ctx.filter = "none";
            break;
        }
      }
    };
  }, []);

  const onResults = (results) => {
    if (onResultsRef.current) onResultsRef.current(results);
  };


  // --- FILTER DRAWING FUNCTIONS ---

  const drawCatFilter = (ctx, landmarks, w, h, centerX, centerY, faceWidth, angle) => {
    const forehead = landmarks[10];

    if (catEarsImg.complete) {
      drawImage(ctx, catEarsImg, centerX, forehead.y * h - faceWidth, faceWidth * 2, faceWidth * 1.5, angle);
    }

    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;

    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(centerX - 20, centerY + 10 + i * 10);
      ctx.lineTo(centerX - 80, centerY + i * 10);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX + 20, centerY + 10 + i * 10);
      ctx.lineTo(centerX + 80, centerY + i * 10);
      ctx.stroke();
    }
  };

  const drawBeardFilter = (ctx, landmarks, w, h) => {
    const chin = landmarks[152];
    ctx.font = `${w * 0.25}px serif`;
    ctx.fillText("🧔", chin.x * w - (w * 0.12), chin.y * h - (h * 0.1));
  };

  const drawNeonMask = (ctx, landmarks, w, h, centerX, centerY, faceWidth) => {
    glowCircle(ctx, centerX, centerY, faceWidth * 2);

    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.arc(centerX, centerY, faceWidth * 1.5, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawHeartsFilter = (ctx, landmarks, w, h) => {
    const top = landmarks[10];
    ctx.font = `${w * 0.1}px serif`;
    ctx.fillText("❤️", top.x * w - 40, top.y * h - 40);
    ctx.fillText("❤️", top.x * w + 20, top.y * h - 50);
  };

  const drawFireFilter = (ctx, landmarks, w, h, centerX, centerY, faceWidth) => {
    fireAura(ctx, centerX, centerY, faceWidth * 2);

    ctx.filter = "brightness(1.3) contrast(1.3)";
    ctx.drawImage(localVideo.current, 0, 0, w, h);
    ctx.filter = "none";
  };

  const applyGlowEffect = (ctx, w, h) => {
    ctx.globalAlpha = 0.3;
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  };

  const applyWhiteningEffect = (ctx, w, h) => {
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, w, h);
  };

  const applySmoothingEffect = (ctx, w, h) => {
    ctx.filter = "blur(4px) contrast(1.1)";
    ctx.drawImage(ctx.canvas, 0, 0);
  };

  const drawLoveFrame = (ctx, w, h) => {
    ctx.strokeStyle = "rgba(255, 20, 147, 0.5)";
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.font = "30px serif";
    ctx.fillText("💖", 30, 50);
    ctx.fillText("💖", w - 60, h - 30);
  };

  const drawAnimeFilter = (ctx, landmarks, w, h, centerX, centerY, faceWidth, angle) => {
    if (animeEyesImg && animeEyesImg.complete) {
      drawImage(ctx, animeEyesImg, centerX, centerY, faceWidth * 2, faceWidth, angle);
      ctx.filter = "contrast(1.3) saturate(1.5)";
      ctx.drawImage(localVideo.current, 0, 0, w, h);
      ctx.filter = "none";
    }
  };



  const drawDogFilter = (ctx, landmarks, w, h, centerX, centerY, faceWidth, angle) => {
    const forehead = landmarks[10];

    if (dogEarsImg && dogEarsImg.complete) {
      drawImage(ctx, dogEarsImg, centerX, forehead.y * h - faceWidth, faceWidth * 2.2, faceWidth * 1.5, angle);
    }

    particles(ctx, centerX, centerY);
  };

  const drawGlassesFilter = (ctx, landmarks, w, h) => {
    // Eyes (Points 33, 263)
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    // POSITION
    const x1 = leftEye.x * w;
    const y1 = leftEye.y * h;
    const x2 = rightEye.x * w;
    const y2 = rightEye.y * h;

    // WIDTH
    const glassesWidth = Math.abs(x2 - x1) * 2;

    // CENTER
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;

    // ROTATION
    const angle = Math.atan2(y2 - y1, x2 - x1);

    if (glassesImg && glassesImg.complete) {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      try {
        ctx.drawImage(
          glassesImg,
          -glassesWidth / 2,
          -glassesWidth / 3,
          glassesWidth,
          glassesWidth / 2
        );
      } catch (e) { }
      ctx.restore();
    }
  };

  useEffect(() => {
    if (!localVideo.current || !socket) return;

    const interval = setInterval(async () => {
      if (!nsfwModel.current) return;
      try {
        const predictions = await nsfwModel.current.classify(localVideo.current);
        // Predictions: [{className: "Porn", probability: 0.9}, ...]
        const nsfwClasses = ["Porn", "Hentai", "Sexy"];
        const violation = predictions.find(p => nsfwClasses.includes(p.className) && p.probability > 0.75);

        if (violation) {
          console.log("NSFW CONTENT DETECTED!", violation);
          socket.emit("nsfw-detected");
        }
      } catch (err) {
        // Silent error
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    socket.on("banned-alert", (msg) => {
      alert(msg);
      router.push("/");
    });
    return () => socket.off("banned-alert");
  }, [socket]);

  // SCREENSHOT PREVENTION & RIGHT CLICK BLOCK
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p') || (e.ctrlKey && e.shiftKey && e.key === 'S')) {
        e.preventDefault();
        alert("📸 Screenshots and Screen Recording are restricted for privacy safety.");
      }
    };
    const handleContextMenu = (e) => e.preventDefault();

    // Sync state across tabs / same page navigation
    const handleStorage = (e) => {
      if (e.key === "user" && e.newValue) {
        setUser(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const [showAgeDrop, setShowAgeDrop] = useState(false);

  // Custom Dropdown states
  const [showGenderDrop, setShowGenderDrop] = useState(false);
  const [showCountryDrop, setShowCountryDrop] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [showStateDrop, setShowStateDrop] = useState(false);

  // User Reporting
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [showReportSuccess, setShowReportSuccess] = useState(false);


  const openReport = () => {
    if (!partnerId) {
      alert("No partner to report yet!");
      return;
    }
    setShowReportModal(true);
  };

  const closeReport = () => {
    setShowReportModal(false);
    setSelectedReason("");
    setReportDetails("");
  };

  const submitReport = async () => {
    if (!selectedReason) {
      alert("Please select a reason for reporting.");
      return;
    }

    const targetId = partnerInfo?.id || partnerId;
    if (!targetId) {
      alert("Partner connection lost. Cannot submit report.");
      return;
    }

    setIsReporting(true);
    try {
      // CAPTURE SCREENSHOT EVIDENCE
      let screenshot = null;
      if (remoteVideo.current) {
        const canvas = document.createElement("canvas");
        canvas.width = remoteVideo.current.videoWidth;
        canvas.height = remoteVideo.current.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(remoteVideo.current, 0, 0);
        screenshot = canvas.toDataURL("image/jpeg", 0.5); // Compressed JPEG
      }

      const token = localStorage.getItem("token");
      await axios.post("https://meetzone-backend.onrender.com/api/report", {
        targetId: targetId,
        reason: selectedReason,
        details: reportDetails,
        evidence: screenshot // Send screenshot as base64
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      closeReport();
      setShowReportSuccess(true);
      setTimeout(() => setShowReportSuccess(false), 3000);

      // Optionally skip to next partner after reporting
      nextPartner();
    } catch (err) {
      console.error(err);
      alert("Failed to submit report. Please try again.");
    } finally {
      setIsReporting(false);
    }
  };

  const handleSendGift = async (sticker) => {
    if (!partnerId || !partnerInfo) {
      alert("Connect with someone first!");
      return;
    }

    const freeCount = user.stickers ? user.stickers.filter(id => id === sticker.id).length : 0;
    const isFree = freeCount > 0;

    if (!isFree && user.coins < sticker.price && user.email !== "ds9376314@gmail.com") {
      alert("Insufficient coins! Go to Home to buy more.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("https://meetzone-backend.onrender.com/api/user/send-gift", {
        recipientId: partnerInfo.id,
        stickerId: sticker.id,
        amount: sticker.price,
        stickerIcon: sticker.icon
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        // Update local user state
        const updatedUser = { ...user, coins: res.data.coins, stickers: res.data.stickers, coinActivity: res.data.coinActivity };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // Local UI feedback
        setMessages(prev => [...prev, { sender: 'system', text: `You sent a ${sticker.icon} gift!` }]);
        setShowGiftPanel(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send gift.");
    }
  };


  const addFriend = async () => {
    if (!partnerInfo?.id) {
      alert("Partner ID not found. Try again.");
      return;
    }

    setFriendReqStatus(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("https://meetzone-backend.onrender.com/api/friends/request", { targetId: partnerInfo.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Also notify via socket for immediate UI feedback
      socket.emit("friend-request", { to: partnerId });

      setFriendNotification({ type: 'success', message: `Request sent to ${partnerInfo.name}` });
      setTimeout(() => setFriendNotification(null), 3000);
    } catch (err) {
      setFriendReqStatus(false);
      alert(err.response?.data?.message || "Failed to send friend request.");
    }
  };

  // Media Controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // Chat
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const chatEndRef = useRef(null);

  // --- SECRET IDENTITY STATES ---
  const [isSecretIdentityPanelOpen, setIsSecretIdentityPanelOpen] = useState(false);
  const [activeVoice, setActiveVoice] = useState("Normal");
  const [activeMask, setActiveMask] = useState("None");
  const [activeAvatar, setActiveAvatar] = useState("None");
  const [isFaceBlurred, setIsFaceBlurred] = useState(false);
  const [activeIdentityMenu, setActiveIdentityMenu] = useState(null); // 'filters', 'avatars', 'voice', 'privacy'


  // Pending States for "Apply" logic
  const [pendingMask, setPendingMask] = useState("None");
  const [pendingAvatar, setPendingAvatar] = useState("None");
  const [pendingVoice, setPendingVoice] = useState("Normal");
  const [pendingBlur, setPendingBlur] = useState(false);

  // Audio processing refs
  const audioCtx = useRef(null);
  const sourceNode = useRef(null);
  const pitchNode = useRef(null);
  const destinationNode = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Close identity popup on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeIdentityMenu) {
        if (!event.target.closest('.identity-popup-bubble') && !event.target.closest('.tool-btn')) {
          setActiveIdentityMenu(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeIdentityMenu]);

  const [iceServers, setIceServers] = useState([
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]);

  // Fetch Twilio TURN credentials on load
  useEffect(() => {
    axios.get("https://meetzone-backend.onrender.com/api/turn-credentials")
      .then(res => { if (res.data.iceServers) setIceServers(res.data.iceServers); })
      .catch(() => {}); // fallback to STUN if fails
  }, []);

  const servers = { iceServers };

  useEffect(() => {
    if (sessionStatus === "loading") return;

    let streamInstance;

    const init = async () => {
      // 0. QUICK PROFILE LOAD FROM CACHE
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          const u = JSON.parse(savedUser);
          setUser(u);
          if (u.unlockedFilters) setUnlockedFilters(u.unlockedFilters);
          setAuthLoading(false); // Stop loading immediately if we have a profile
          console.log("Profile loaded from cache instantly");
        } catch(e) {}
      }

      const token = localStorage.getItem("token");

      // 1. Auth Logic
      if (session) {
        const stored = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : {};
        const userData = {
          ...stored,
          name: session.user.name,
          email: session.user.email,
          premium: (stored.premium || (session.user.email === "ds9376314@gmail.com")) || false,
          planName: (stored.planName || (session.user.email === "ds9376314@gmail.com" ? "VIP Elite" : null)),
          gender: stored.gender || "All",
          country: stored.country || "All",
          state: stored.state || "All States",
          age: stored.age || "All Ages"
        };
        
        setUser(userData);
        if (userData.unlockedFilters) {
          setUnlockedFilters(userData.unlockedFilters);
        }

        if (!stored.gender || stored.gender === "All" || !stored.country || stored.country === "All") {
          router.push("/");
          return;
        }
        setAuthLoading(false);
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
              setUnlockedFilters(userData.unlockedFilters);
            }
            localStorage.setItem("user", JSON.stringify(userData));

            // Check for incomplete profile
            const u = res.data.user;
            if (!u.gender || u.gender === "All" || !u.country || u.country === "All" || u.gender === "Other" || u.country === "Unknown") {
              router.push("/");
              return;
            }
          } else {
            setAuthError("Session invalid. Please login again.");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.push("/login");
          }
        } catch (err) {
          const savedUser = localStorage.getItem("user");
          if (savedUser) {
            const u = JSON.parse(savedUser);
            setUser(u);
            if (u.unlockedFilters) {
              setUnlockedFilters(u.unlockedFilters);
            }
            setAuthLoading(false);
          } else {
            setAuthError("Connection error.");
          }
        } finally {
          setAuthLoading(false);
        }
      } else {
        setAuthError("No token found. Please login.");
        setAuthLoading(false);
        return;
      }

      // 2. Camera Logic
      try {
        streamInstance = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (localVideo.current) {
          localVideo.current.srcObject = streamInstance;
        }
      } catch (err) {
        console.error("Error accessing media devices.", err);
        setStatus("Please allow camera/mic access");
      }

      // 4. AI Guard: NSFW Detection
      const initNSFW = async () => {
        try {
          await tf.ready();
          nsfwModel.current = await nsfwjs.load();
          console.log("NSFW Guardian active.");
          
          const checkVideo = async () => {
            /* 
            // AI Video Guard Temporarily Disabled by User Request
            if (localVideo.current && localVideo.current.readyState === 4) {
              const predictions = await nsfwModel.current.classify(localVideo.current);
              const nsfw = predictions.find(p => p.className === "Porn" || p.className === "Hentai");
              if (nsfw && nsfw.probability > 0.99) {
                console.log("NSFW Content Detected! Reporting...");
                socket.emit("nsfw-detected");
                return;
              }
            }
            */
            setTimeout(checkVideo, 3000);
          };
          checkVideo();
        } catch (err) {
          console.error("NSFW Guardian failed to load:", err);
        }
      };
      initNSFW();

      // 3. Socket Logic
      socket = io("https://meetzone-backend.onrender.com");

      socket.on("connect", () => {
        setStatus("Waiting for a partner...");
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const profile = JSON.parse(storedUser);
          if (router.query.room) {
            profile.roomId = router.query.room;
            socket.emit("join-room", router.query.room);
            setStatus("Joining Direct Chat...");
          }
          socket.emit("set-profile", profile);
        }
      });

      socket.on("friend-request-received", ({ fromName }) => {
        setFriendNotification({ type: 'received', message: `${fromName} sent you a friend request!` });
        setTimeout(() => setFriendNotification(null), 5000);
      });

      socket.on("warning-alert", (msg) => {
        alert(msg);
      });

      socket.on("banned-alert", (msg) => {
        alert(msg);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      });

      socket.on("receive-sticker", ({ stickerIcon, senderName, amount }) => {
        setReceivedGift({ icon: stickerIcon, from: senderName, amount });
        setMessages(prev => [...prev, { sender: 'system', text: `${senderName} sent you a ${stickerIcon} gift (+${amount} coins!)` }]);

        // Auto clear after 4 seconds
        setTimeout(() => setReceivedGift(null), 4000);
      });

      socket.on("incoming-direct-call", (callInfo) => {
        setIncomingCall(callInfo);
      });

      socket.on("direct-call-accepted", ({ roomId }) => {
        router.push(`/chat?room=${roomId}`);
      });

      socket.on("direct-call-rejected", () => {
        alert("Call was declined.");
      });


      socket.on("matched", async ({ partnerId, initiator, partnerInfo }) => {
        setPartnerId(partnerId);
        setPartnerInfo(partnerInfo);
        setShowPartnerPreview(true);
        setStatus("Partner Found!");
        setMessages([]);
        iceCandidatesQueue.current = [];
        createPeer(partnerId);

        if (initiator) {
          try {
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            socket.emit("offer", { offer, to: partnerId });
          } catch (err) {
            console.error("Failed to create offer:", err);
          }
        }
      });

      socket.on("offer", async ({ offer, from }) => {
        if (!peerConnection.current) createPeer(from);
        try {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          socket.emit("answer", { answer, to: from });
          while (iceCandidatesQueue.current.length > 0) {
            const candidate = iceCandidatesQueue.current.shift();
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (err) {
          console.error("Error handling offer:", err);
        }
      });

      socket.on("answer", async ({ answer }) => {
        try {
          if (peerConnection.current && peerConnection.current.signalingState === "have-local-offer") {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
            while (iceCandidatesQueue.current.length > 0) {
              const candidate = iceCandidatesQueue.current.shift();
              await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
          }
        } catch (err) {
          console.error("Error handling answer:", err);
        }
      });

      socket.on("ice-candidate", async ({ candidate }) => {
        try {
          if (peerConnection.current && peerConnection.current.remoteDescription) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            iceCandidatesQueue.current.push(candidate);
          }
        } catch (err) {
          console.error("Error adding ice candidate:", err);
        }
      });

      socket.on("receive-message", ({ text }) => {
        setMessages((prev) => [...prev, { text, sender: "partner" }]);
      });

      socket.on("partner-disconnected", () => {
        setStatus("Partner disconnected. Searching...");
        closeConnection();
      });
    };

    init();

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
      if (socket) socket.disconnect();
    };
  }, [session, sessionStatus]);

  const createPeer = (partner) => {
    peerConnection.current = new RTCPeerConnection(servers);
    const stream = localVideo.current.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
      });
    }

    peerConnection.current.ontrack = (event) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
        // Short delay to ensure video is ready
        setTimeout(() => {
          setShowPartnerPreview(false);
          setStatus("Connected");
        }, 1500);
      }
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: partner,
        });
      }
    };
  };

  const closeConnection = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (remoteVideo.current) {
      remoteVideo.current.srcObject = null;
    }
    setPartnerId(null);
    setPartnerInfo(null);
  };

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

  const sendMessage = (e) => {
    e.preventDefault();

    // BAD WORD DETECTION
    const badWords = ["abuse", "fake", "sex", "scam", "nude", "porn", "pussy", "dick", "lund", "chod", "gand"];
    const hasBadWord = badWords.some(word => message.toLowerCase().includes(word));

    if (hasBadWord) {
      alert("⚠️ Warning: Your message contains restricted words. Please maintain a respectful environment.");
      return;
    }

    if (message.trim() && partnerId) {
      // DEDUCT 5 COINS ONLY IF NOT FRIENDS
      if (!partnerInfo?.isFriend && user.email !== "ds9376314@gmail.com") {
        const msgToPrompt = message;
        setMessage("");
        setMessages(prev => [...prev, { 
          sender: 'system', 
          type: 'coin-prompt',
          text: `Sending this message costs 5 coins.`,
          pendingText: msgToPrompt
        }]);
        return;
      }

      socket.emit("send-message", { text: message, to: partnerId });
      setMessages((prev) => [...prev, { text: message, sender: "me" }]);
      setMessage("");
    }
  };

  const confirmAndSendMessage = async (pendingText) => {
    if (!pendingText) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("https://meetzone-backend.onrender.com/api/user/spend-coins", {
        email: user.email,
        amount: 5,
        feature: "Friend Message"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        socket.emit("send-message", { text: pendingText, to: partnerId });
        setMessages((prev) => {
          // Remove the prompt message
          const filtered = prev.filter(m => m.type !== 'coin-prompt');
          return [...filtered, { text: pendingText, sender: "me" }];
        });
        
        // Update local coins
        const updatedUser = { ...user, coins: res.data.coins };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      alert(err.response?.data?.message || "Not enough coins to send message!");
      setMessages(prev => prev.filter(m => m.type !== 'coin-prompt'));
    }
  };

  const nextPartner = () => {
    closeConnection();
    setFriendReqStatus(false);
    setShowPartnerPreview(false);
    socket.emit("next");
    setStatus("Searching for next partner...");
  };

  const stopMatching = () => {
    closeConnection();
    setFriendReqStatus(false);
    setShowPartnerPreview(false);
    socket.emit("stop-matching");
    setStatus("Matching Stopped. Click Next to search.");
  };

  const purchaseFilter = async (filter) => {
    if (unlockedFilters.includes(filter.id)) {
      setActiveMediaPipeFilter(filter.id);
      return;
    }

    if (user.coins < filter.cost) {
      alert("Not enough coins to unlock this filter!");
      return;
    }

    if (confirm(`Unlock ${filter.name} for ${filter.cost} coins?`)) {
      try {
        const res = await axios.post("https://meetzone-backend.onrender.com/api/user/spend-coins", {
          email: user.email,
          userId: user.id,
          amount: filter.cost,
          feature: `Unlock Filter: ${filter.name}`,
          filterId: filter.id
        });

        if (res.data.success) {
          const updatedFilters = res.data.unlockedFilters || [...unlockedFilters, filter.id];
          setUnlockedFilters(updatedFilters);
          setActiveMediaPipeFilter(filter.id);
          const updatedUser = { ...user, coins: res.data.coins, unlockedFilters: updatedFilters };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
          alert(`${filter.name} unlocked!`);
        }
      } catch (err) {
        alert("Failed to purchase filter.");
      }
    }
  };

  const toggleMic = () => {
    const stream = localVideo.current.srcObject;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const applyVoiceFilter = async (voice) => {
    setActiveVoice(voice);
    if (!localVideo.current.srcObject) return;

    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (voice === "Normal") {
      // Reset logic if needed or just bypass
      return;
    }

    // Basic Pitch Shifting Logic Simulation (Note: Real pitch shifting requires complex FFT nodes, 
    // here we simulate with BiquadFilter for tonal changes as a lightweight alternative)
    if (sourceNode.current) sourceNode.current.disconnect();

    sourceNode.current = audioCtx.current.createMediaStreamSource(localVideo.current.srcObject);
    const filter = audioCtx.current.createBiquadFilter();

    if (voice === "Robot") {
      filter.type = "peaking";
      filter.frequency.value = 1000;
      filter.Q.value = 20;
    } else if (voice === "Deep") {
      filter.type = "lowpass";
      filter.frequency.value = 400;
    } else if (voice === "Chipmunk") {
      filter.type = "highpass";
      filter.frequency.value = 1500;
    } else if (voice === "Alien") {
      filter.type = "notch";
      filter.frequency.value = 800;
      filter.Q.value = 10;
    }

    sourceNode.current.connect(filter);
    // In a real WebRTC app, we'd need to replace the track in the peerConnection with this processed stream
    // For this demonstration, we are setting the UI state.
  };

  const toggleCamera = () => {
    const stream = localVideo.current.srcObject;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const handleFilterChange = (type, value) => {
    if (!user?.premium) {
      setShowPricingModal(true);
      return;
    }
    // Feature Gating
    if ((type === "age" || type === "state" || type === "stateProv") && (!user?.premium || user?.planName !== "VIP Elite")) {
      setShowPricingModal(true);
      return;
    }

    if (type === "gender") {
      setGender(value);
      setShowGenderDrop(false);
    }
    if (type === "country") {
      setCountry(value);
      setStateProv("All States");
      setShowCountryDrop(false);
      setShowStateDrop(false);
    }
    if (type === "age") {
      setAge(value);
      setShowAgeDrop(false);
    }
    if (type === "state" || type === "stateProv") {
      setStateProv(value);
      setShowStateDrop(false);
    }
    socket.emit("update-filters", {
      gender: type === "gender" ? value : gender,
      country: type === "country" ? value : country,
      age: type === "age" ? value : age,
      state: type === "state" ? value : stateProv
    });
  };

  const handleTestPayment = async () => {
    try {
      setPaymentStep("processing");

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const verifyRes = await axios.post("https://meetzone-backend.onrender.com/api/payment/razorpay/verify", {
        razorpay_order_id: "test_order",
        razorpay_payment_id: "test_payment",
        razorpay_signature: "test_sig",
        userEmail: user.email,
        planName: selectedPlan.name
      });

      if (verifyRes.data.success) {
        setPaymentStep("success");
      }
    } catch (err) {
      console.error(err);
      setPaymentStep("methods");
      alert("⚠️ Payment Error: Payment gateway is not connected. Please contact support or try again later.");
    }
  };

  const handleRazorpayPayment = async (plan) => {
    handleTestPayment();
  };

  const selectedCountry = country === "all" ? { name: "Worldwide", flag: "🌎" } : Country.getCountryByCode(country);
  const selectedGender = GENDERS.find(g => g.id === gender);

  return (
    <>
      <div className="container chat-page-v2">
        <Head>
          <title>Live Video Chat | ZoneMeet</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559531/face_mesh.js" crossorigin="anonymous"></script>
        </Head>



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

        {authLoading && (
          <div className="auth-overlay">
            <div className="loader">Verifying your ZoneMeet...</div>
          </div>
        )}

        {authError && !user && (
          <div className="auth-overlay error">
            <div className="error-card">
              <h2>Authentication Required</h2>
              <p>{authError}</p>
              <button className="btn btn-primary" onClick={() => router.push("/login")}>Go to Login</button>
            </div>
          </div>
        )}

        <div className="header-v2">
          <div className="brand" onClick={() => router.push("/")}>
            <h1 className="logo-text">Zone<span className="logo-highlight">Meet</span><span className="logo-dot">.</span></h1>
          </div>

          <div className="header-actions">
            <div className="header-coins-pill" onClick={() => router.push("/#coins-section")}>
              <span className="coin-icon">💰</span>
              <span className="coin-count">{user?.coins || 0}</span>
              <span className="plus-icon">+</span>
            </div>

            <div className="user-profile-tag">
              <div className="avatar">
                {user?.name?.charAt(0) || "?"}
              </div>
              <div className="user-details">
                <span className="user-name">
                  {user?.name || "ZoneMeet User"}
                  {user?.email === "ds9376314@gmail.com" && <span className="vip-badge-inline">VIP</span>}
                </span>
                <span className="user-sub">
                  {user?.gender || "Guest"} • {getFlagUrl(user?.country) && <img src={getFlagUrl(user?.country)} alt="" style={{ width: '14px', height: '10px', marginRight: '4px', verticalAlign: 'middle', borderRadius: '1px' }} />}
                  {user?.country || "Earth"}
                </span>
              </div>
              {user?.premium && (
                user.planName === "VIP Elite" ? (
                  <div className="vip-crown-tag">
                    👑 VIP ELITE
                  </div>
                ) : (
                  <div className="pro-badge-v2">
                    🛡️ {user.planName} PRO
                  </div>
                )
              )}
            </div>

            <button className="btn-home" onClick={() => router.push("/")}>
              <span className="icon">🏠</span>
              <span className="text">Go Home</span>
            </button>
          </div>
        </div>

        <div className="main-layout">
          <div className="video-column">
            <div className="filters-row-v2">
              {/* CUSTOM GENDER DROPDOWN */}
              <div className="custom-dropdown-container">
                <label>Gender</label>
                <div className="dropdown-trigger" onClick={() => setShowGenderDrop(!showGenderDrop)}>
                  <span className="icon-val">{selectedGender.icon}</span>
                  <span className="label-val">{selectedGender.name}</span>
                  <span className="arrow-val">▼</span>
                </div>
                {showGenderDrop && (
                  <div className="dropdown-menu">
                    {GENDERS.map(g => (
                      <div
                        key={g.id}
                        className={`dropdown-item ${gender === g.id ? "active" : ""}`}
                        onClick={() => handleFilterChange("gender", g.id)}
                      >
                        <span className="icon">{g.icon}</span>
                        {g.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CUSTOM COUNTRY DROPDOWN */}
              <div className="custom-dropdown-container">
                <label>Country</label>
                <div className="dropdown-trigger" onClick={() => {
                  if (!user?.premium) { setShowPricingModal(true); return; }
                  setShowCountryDrop(!showCountryDrop);
                }}>
                  <span className="icon-val">
                    {country === "all" ? "🌎" : Country.getCountryByCode(country)?.flag}
                  </span>
                  <span className="label-val">
                    {country === "all" ? "Worldwide" : Country.getCountryByCode(country)?.name}
                  </span>
                  <span className="arrow-val">▼</span>
                </div>
                {showCountryDrop && (
                  <div className="dropdown-menu">
                    <div className="search-box">
                      <input
                        placeholder="Search country..."
                        autoFocus
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                      />
                    </div>
                    <div className="items-list">
                      <div className={`dropdown-item ${country === "all" ? "active" : ""}`} onClick={() => handleFilterChange("country", "all")}>
                        <span className="icon">🌎</span> Worldwide
                      </div>
                      {Country.getAllCountries().filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map(c => (
                        <div key={c.isoCode} className={`dropdown-item ${country === c.isoCode ? "active" : ""}`} onClick={() => handleFilterChange("country", c.isoCode)}>
                          <span className="icon">{c.flag}</span> {c.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CUSTOM STATE DROPDOWN */}
              <div className="custom-dropdown-container">
                <label>State / Province</label>
                <div className="dropdown-trigger" onClick={() => {
                  if (!user?.premium) { setShowPricingModal(true); return; }
                  if (country === "all") { alert("Please select a country first"); return; }
                  setShowStateDrop(!showStateDrop);
                }}>
                  <span className="icon-val">📍</span>
                  <span className="label-val">{stateProv}</span>
                  <span className="arrow-val">▼</span>
                </div>
                {showStateDrop && (
                  <div className="dropdown-menu">
                    <div className="items-list">
                      <div className={`dropdown-item ${stateProv === "All States" ? "active" : ""}`} onClick={() => handleFilterChange("stateProv", "All States")}>
                        All States
                      </div>
                      {State.getStatesOfCountry(country).map(s => (
                        <div key={s.isoCode || s.name} className={`dropdown-item ${stateProv === s.name ? "active" : ""}`} onClick={() => handleFilterChange("stateProv", s.name)}>
                          {s.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CUSTOM AGE DROPDOWN (VIP ELITE) */}
              <div className="custom-dropdown-container age-drop" style={{ width: "120px" }}>
                <label>Age</label>
                <div className="dropdown-trigger" onClick={() => {
                  if (!user?.premium || user?.planName !== "VIP Elite") setShowPricingModal(true);
                  else setShowAgeDrop(!showAgeDrop);
                }}>
                  <span className="icon-val">🎯</span>
                  <span className="label-val">{age === "all" ? "All Ages" : age}</span>
                  <span className="arrow-val">▼</span>
                </div>
                {showAgeDrop && (
                  <div className="dropdown-menu">
                    <div className="items-list">
                      {AGES.map(a => (
                        <div
                          key={a}
                          className={`dropdown-item ${age === a ? "active" : ""}`}
                          onClick={() => handleFilterChange("age", a)}
                        >
                          {a}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!user?.premium && (
                <div className="paywall-badge-v2" onClick={() => setShowPricingModal(true)}>
                  <span>✨ Unlock Filters</span>
                </div>
              )}
            </div>

            <div className="video-grid-v2">
              <div className={`video-card ${isFaceBlurred ? 'blurred-face' : ''}`}>
                <video
                  ref={localVideo}
                  autoPlay
                  muted
                  playsInline
                  className="natural-view"
                  style={{
                    filter: isFaceBlurred ? 'blur(25px)' : 'none',
                    display: activeAvatar !== "None" ? 'none' : 'block'
                  }}
                />
                <canvas
                  ref={canvasRef}
                  width="640"
                  height="480"
                  className="natural-view"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    pointerEvents: "none",
                    zIndex: 999,
                    display: activeAvatar !== "None" ? 'none' : 'block'
                  }}
                />


                {activeAvatar !== "None" && (
                  <div className="avatar-video-replacement">
                    <img src={`https://robohash.org/${activeAvatar}?set=set${activeAvatar === 'Robot' ? '1' : activeAvatar === 'Anime' ? '5' : '4'}&key=${activeAvatar}`} alt="Avatar" />
                  </div>
                )}

                {activeMask !== "None" && activeAvatar === "None" && (
                  <div className="video-mask-overlay">
                    <div className={`mask-${activeMask.toLowerCase()}`}></div>
                  </div>
                )}
                <div className="card-label">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: '500' }}>You</span>
                      <span className={`gender-highlight ${user?.gender?.toLowerCase()}`}>{user?.gender || "Unknown"}</span>
                      <span className="country-highlight" title={user?.country}>
                        {getFlagUrl(user?.country) && <img src={getFlagUrl(user?.country)} alt={user?.country} style={{ width: '16px', height: '12px', borderRadius: '2px' }} />}
                        {getCountryName(user?.country)}
                      </span>
                    </span>
                    {user?.premium && user?.planName && (
                      <span className={user.planName === "VIP Elite" ? "vip-crown-tag" : "pro-badge-v2"} style={{ margin: 0, padding: '0.15rem 0.6rem', fontSize: '0.65rem' }}>
                        {user.planName === "VIP Elite" ? "👑 VIP ELITE" : `🛡️ ${user.planName}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="card-controls">
                  <button className={`ctrl-btn ${!isMicOn ? "off" : ""}`} onClick={toggleMic}>
                    {isMicOn ? "🎙️" : "🔇"}
                  </button>
                  <button className={`ctrl-btn ${!isCameraOn ? "off" : ""}`} onClick={toggleCamera}>
                    {isCameraOn ? "📹" : "🚫"}
                  </button>

                </div>
              </div>

              {/* Floating Gift Overlay */}
              {receivedGift && (
                <div className="floating-gift-overlay">
                  <div className="floating-sticker-container">
                    <div className="sticker-glow"></div>
                    <div className="sticker-emoji">{receivedGift.icon}</div>
                    <div className="sticker-info">
                      <div className="sticker-sender">From {receivedGift.from}</div>
                      <div className="sticker-amount">+{receivedGift.amount} Coins</div>
                    </div>
                  </div>
                </div>
              )}



            <div className="video-card">
              <video ref={remoteVideo} autoPlay playsInline className="natural-view" />

              {/* PARTNER PREVIEW OVERLAY */}
              {showPartnerPreview && partnerInfo && (
                <div className="partner-preview-overlay">
                  <div className="preview-content">
                    <div className="preview-avatar">
                      {partnerInfo.name?.charAt(0) || "?"}
                    </div>
                    <div className="preview-details">
                      <h2 className="preview-name">{partnerInfo.name}</h2>
                      <div className="preview-badges">
                        <span className={`preview-gender ${partnerInfo.gender?.toLowerCase()}`}>
                          {partnerInfo.gender === "Male" ? "♂️" : "♀️"} {partnerInfo.gender}
                        </span>
                        <span className="preview-country">
                          {getFlagUrl(partnerInfo.country) && <img src={getFlagUrl(partnerInfo.country)} alt="" />}
                          {getCountryName(partnerInfo.country)}
                        </span>
                      </div>
                      <div className="connecting-pulse">
                        <div className="pulse-dot"></div>
                        <span>Establishing Secure Connection...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="card-label">
                {partnerInfo ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: '500' }}>{partnerInfo.name}</span>
                      <span className={`gender-highlight ${partnerInfo.gender?.toLowerCase()}`}>{partnerInfo.gender || "Unknown"}</span>
                      <span className="country-highlight" title={partnerInfo.country}>
                        {getFlagUrl(partnerInfo.country) && <img src={getFlagUrl(partnerInfo.country)} alt={partnerInfo.country} style={{ width: '16px', height: '12px', borderRadius: '2px' }} />}
                        {getCountryName(partnerInfo.country)}
                      </span>
                    </span>
                    {partnerInfo.premium && partnerInfo.planName && (
                      <span className={partnerInfo.planName === "VIP Elite" ? "vip-crown-tag" : "pro-badge-v2"} style={{ margin: 0, padding: '0.15rem 0.6rem', fontSize: '0.65rem' }}>
                        {partnerInfo.planName === "VIP Elite" ? "👑 VIP ELITE" : `🛡️ ${partnerInfo.planName}`}
                      </span>
                    )}
                  </div>
                ) : "Searching..."}
              </div>

              <div className="card-controls">
                {partnerId && (
                  <button className={`ctrl-btn ${friendReqStatus ? 'active' : ''}`} onClick={addFriend} disabled={friendReqStatus} title="Add Friend">
                    {friendReqStatus ? "✅" : "👤+"}
                  </button>
                )}
              </div>
            </div>
            </div>

          {/* BOTTOM IDENTITY TOOLS & POPUPS */}
          <div className="identity-container">
              {/* Floating Popup */}
              {activeIdentityMenu && (user?.email === "ds9376314@gmail.com" || user?.planName === "VIP Elite" || user?.hasSecretIdentity) && (
                <div className="identity-popup-bubble">
                  <div className="popup-arrow" />
                  <div className="popup-header">
                    <span>{activeIdentityMenu.toUpperCase()}</span>
                    <button onClick={() => setActiveIdentityMenu(null)}>×</button>
                  </div>
                  <div className="popup-options-row">
                    {activeIdentityMenu === 'filters' && (
                      <div className="filters-by-category">
                        {["Beauty", "Funny", "Premium", "Couple"].map(cat => (
                          <div key={cat} className="category-section">
                            <h4 className="cat-title">{cat}</h4>
                            <div className="popup-options-row">
                              {FILTERS_DATA.filter(f => f.category === cat).map(f => (
                                <div
                                  key={f.id}
                                  className={`mini-option ${activeMediaPipeFilter === f.id ? 'selected' : ''}`}
                                  onClick={() => setActiveMediaPipeFilter(f.id)}
                                >
                                  <span className="filter-icon">{f.icon}</span>
                                  <div className="filter-info">
                                    <span className="filter-name">{f.name}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeIdentityMenu === 'avatars' && ['None', 'Robot', 'Anime', 'Girl', 'Ninja', 'Hero', 'Cat', 'Cyber'].map(a => (
                      <div key={a} className={`mini-option ${activeAvatar === a ? 'selected' : ''}`} onClick={() => setActiveAvatar(a)}>
                        {a === 'None' ? '🚫' : '👤'} {a}
                      </div>
                    ))}

                    {activeIdentityMenu === 'voice' && ['Normal', 'Robot', 'Deep', 'Chipmunk', 'Alien', 'Echo'].map(v => (
                      <div key={v} className={`mini-option ${activeVoice === v ? 'selected' : ''}`} onClick={() => applyVoiceFilter(v)}>
                        {v === 'Normal' ? '⏺️' : '🎙️'} {v}
                      </div>
                    ))}

                    {activeIdentityMenu === 'privacy' && (
                      <div className={`mini-option ${isFaceBlurred ? 'selected' : ''}`} onClick={() => setIsFaceBlurred(!isFaceBlurred)}>
                        {isFaceBlurred ? '✅ Blur Active' : '🌫️ Blur Hidden'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Gift Panel Bubble */}
              {showGiftPanel && (
                <div className="identity-popup-bubble gift-bubble">
                  <div className="popup-arrow" />
                  <div className="popup-header">
                    <span>Send a Gift</span>
                    <button onClick={() => setShowGiftPanel(false)}>×</button>
                  </div>
                  <div className="gift-grid">
                    {STICKERS.map(s => {
                      const freeCount = user?.stickers ? user.stickers.filter(id => id === s.id).length : 0;
                      return (
                        <div key={s.id} className="gift-item" onClick={() => handleSendGift(s)}>
                          {freeCount > 0 && <div className="free-badge">{freeCount} Free</div>}
                          <span className="gift-icon">{s.icon}</span>
                          <span className="gift-label">{s.label}</span>
                          <span className="gift-price">{freeCount > 0 ? "🆓 Free" : `💰 ${s.price}`}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding: '10px', textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    Coins will be sent to <strong>{partnerInfo?.name || "partner"}</strong> instantly.
                  </div>
                </div>
              )}


              {/* Bottom Mini Bar */}
              <div className="bottom-mini-bar">
                {(user?.email === "ds9376314@gmail.com" || user?.planName === "VIP Elite" || user?.hasSecretIdentity) && (
                  <>
                    <button className={`tool-btn ${activeIdentityMenu === 'filters' ? 'active' : ''}`} onClick={() => setActiveIdentityMenu(activeIdentityMenu === 'filters' ? null : 'filters')}>
                      🎭 Filters
                    </button>
                    <button className={`tool-btn ${activeIdentityMenu === 'avatars' ? 'active' : ''}`} onClick={() => setActiveIdentityMenu(activeIdentityMenu === 'avatars' ? null : 'avatars')}>
                      👤 Avatars
                    </button>
                    <button className={`tool-btn ${activeIdentityMenu === 'voice' ? 'active' : ''}`} onClick={() => setActiveIdentityMenu(activeIdentityMenu === 'voice' ? null : 'voice')}>
                      🎙 Voice
                    </button>
                    <button className={`tool-btn ${activeIdentityMenu === 'privacy' ? 'active' : ''}`} onClick={() => setActiveIdentityMenu(activeIdentityMenu === 'privacy' ? null : 'privacy')}>
                      🌫 Privacy
                    </button>
                  </>
                )}
                <button className={`tool-btn ${showGiftPanel ? 'active' : ''}`} onClick={() => setShowGiftPanel(!showGiftPanel)} style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', borderColor: 'rgba(236, 72, 153, 0.3)' }}>
                  🎁 Gifts
                </button>
              </div>

            </div>


          <div className="bottom-actions">
            <div className="conn-status">
              <div className={`dot ${partnerId ? "active" : "searching"}`} />
              {status}
            </div>
            <div style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
              By continuing with Camera/Mic, you agree to our <a href="/terms" target="_blank" style={{ color: '#6366f1' }}>Terms</a> and <a href="/guidelines" target="_blank" style={{ color: '#6366f1' }}>Community Guidelines</a>.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="stop-btn" onClick={stopMatching}>
                🛑 Stop
              </button>
              <button className="report-trigger-btn" onClick={openReport}>
                🚨 Report
              </button>
              <button className="next-btn" onClick={nextPartner}>
                Skip & Next
                <span className="icon">→</span>
              </button>
            </div>
          </div>
        </div>

        <div className="chat-column">
          <div className="chat-box-v2">
            <div className="chat-box-header">
              <h3>Live Chat</h3>
              <span className="msg-count">{messages.length} msgs</span>
            </div>
            <div className="chat-box-messages">
              {messages.length === 0 && <div className="empty-chat">Say Hi! 👋</div>}
              {messages.map((msg, i) => (
                <div key={i} className={`msg-row ${msg.sender}`}>
                  {msg.type === 'coin-prompt' ? (
                    <div className="coin-prompt-inline">
                      <div className="prompt-text">
                        <span className="coin-icon">💰</span>
                        {msg.text}
                      </div>
                      <div className="prompt-actions">
                        <button className="yes-btn" onClick={() => confirmAndSendMessage(msg.pendingText)}>Yes (-5)</button>
                        <button className="no-btn" onClick={() => setMessages(prev => prev.filter(m => m.type !== 'coin-prompt'))}>No</button>
                      </div>
                    </div>
                  ) : (
                    <div className="msg-content">{msg.text}</div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form className="chat-box-input" onSubmit={sendMessage}>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Aa"
                disabled={!partnerId}
              />
              <button type="submit" disabled={!partnerId || !message}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
              </button>
            </form>
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

                  <div className="methods-list-premium">
                    {currency === "INR" ? (
                      <>
                        <button className="pay-method-item" onClick={handleTestPayment}>
                          <div className="pay-icon-box">📱</div>
                          <div className="pay-details">
                            <strong>UPI Payment</strong>
                            <span>GPay, PhonePe, Paytm</span>
                          </div>
                          <div className="pay-arrow">›</div>
                        </button>
                        <button className="pay-method-item" onClick={handleTestPayment}>
                          <div className="pay-icon-box">💳</div>
                          <div className="pay-details">
                            <strong>Card Payment</strong>
                            <span>Debit & Credit Cards</span>
                          </div>
                          <div className="pay-arrow">›</div>
                        </button>
                        <button className="pay-method-item" onClick={handleTestPayment}>
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
                        <button className="pay-method-item paypal" onClick={() => alert("PayPal integration coming soon!")}>
                          <div className="pay-icon-box">🅿️</div>
                          <div className="pay-details">
                            <strong>PayPal</strong>
                            <span>Express International Checkout</span>
                          </div>
                          <div className="pay-arrow">›</div>
                        </button>
                        <button className="pay-method-item" onClick={handleTestPayment}>
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

      {/* PREMIUM PRICING MODAL */}
      {showPricingModal && (
        <div className="payment-overlay" onClick={() => setShowPricingModal(false)}>
          <div className="premium-modal pricing-wide" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowPricingModal(false)}>×</button>

            <div className="modal-header-premium">
              <h2 className="total-amount" style={{ fontSize: '2.5rem' }}>Upgrade to ZoneMeet Pro</h2>
              <p className="modal-subtitle">Choose a plan to unlock advanced filters and priority matching.</p>

              <div className="currency-selector" style={{ marginTop: '1.5rem', marginBottom: '0' }}>
                <div className="currency-pill">
                  <button className={currency === "INR" ? "active" : ""} onClick={() => setCurrency("INR")}>INR (₹)</button>
                  <button className={currency === "USD" ? "active" : ""} onClick={() => setCurrency("USD")}>USD ($)</button>
                </div>
              </div>
            </div>

            <div className="modal-body-premium">
              <div className="pricing-grid-premium">
                {/* STARTER */}
                <div className="premium-card-mini" onClick={() => router.push("/#pricing-section")}>
                  <div className="card-top">
                    <span className="icon">✨</span>
                    <span className="name">Starter</span>
                  </div>
                  <div className="card-price">{currency === "INR" ? "₹99" : "$1.07"}</div>
                  <div className="card-dur">7 Days</div>
                </div>

                {/* PRIME */}
                <div className="premium-card-mini featured" onClick={() => router.push("/#pricing-section")}>
                  <div className="popular-ribbon-mini">Best Choice</div>
                  <div className="card-top">
                    <span className="icon">🚀</span>
                    <span className="name">Prime</span>
                  </div>
                  <div className="card-price">{currency === "INR" ? "₹349" : "$3.82"}</div>
                  <div className="card-dur">30 Days</div>
                </div>

                {/* SILVER */}
                <div className="premium-card-mini" onClick={() => router.push("/#pricing-section")}>
                  <div className="card-top">
                    <span className="icon">💎</span>
                    <span className="name">Silver</span>
                  </div>
                  <div className="card-price">{currency === "INR" ? "₹999" : "$10.77"}</div>
                  <div className="card-dur">90 Days</div>
                </div>

                {/* ELITE */}
                <div className="premium-card-mini elite-gold" onClick={() => router.push("/#pricing-section")}>
                  <div className="elite-badge-mini">👑 VIP</div>
                  <div className="card-top">
                    <span className="icon">🤴</span>
                    <span className="name">Elite</span>
                  </div>
                  <div className="card-price">{currency === "INR" ? "₹899" : "$7.17"}</div>
                  <div className="card-dur">30 Days</div>
                </div>
              </div>

              <div className="pricing-footer-features">
                <div className="feature-item"><span>✓</span> Gender & Country Filters</div>
                <div className="feature-item"><span>✓</span> Unlimited Interactions</div>
                <div className="feature-item"><span>✓</span> Priority Support</div>
                <div className="feature-item"><span>✓</span> Ad-Free Experience</div>
              </div>

              {/* CTA to go to home */}
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button
                  onClick={() => router.push("/#pricing-section")}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: 'white',
                    border: 'none',
                    padding: '1rem 2.5rem',
                    borderRadius: '16px',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 10px 25px rgba(99,102,241,0.3)',
                    transition: 'all 0.3s'
                  }}
                >
                  🏠 Go to Subscription Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* USER REPORT MODAL */}
      {showReportModal && (
        <div className="report-modal-overlay" onClick={closeReport}>
          <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="report-close" onClick={closeReport}>×</div>
            <h2>🚨 Report User</h2>
            <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '20px', fontSize: '0.9rem' }}>
              Reporting partner: <strong>{partnerInfo?.name || "ZoneMeet User"}</strong>
            </p>

            <div className="reasons-grid">
              {["Nudity / NSFW", "Abuse / Harassment", "Spam", "Fake Profile", "Underage User", "Violence", "Recording Screen", "Scammer"].map(reason => (
                <button
                  key={reason}
                  className={`reason-btn ${selectedReason === reason ? 'active' : ''}`}
                  onClick={() => setSelectedReason(reason)}
                >
                  {reason}
                </button>
              ))}
            </div>

            <textarea
              className="report-details-box"
              placeholder="Additional details (optional)..."
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
            />

            <button className="report-submit-btn" onClick={submitReport} disabled={isReporting}>
              {isReporting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </div>
      )}


      {/* REPORT SUCCESS TOAST */}
      <div className={`report-success-toast ${showReportSuccess ? 'show' : ''}`}>
        ✅ Report Submitted Successfully
      </div>

      {/* FRIEND SYSTEM TOASTS */}
      {friendNotification && (
        <div className={`friend-toast ${friendNotification.type}`}>
          {friendNotification.type === 'received' ? '✨' : '✅'} {friendNotification.message}
          {friendNotification.type === 'received' && (
            <button onClick={() => router.push("/friends")} style={{ marginLeft: '10px', background: 'white', color: '#6366f1', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer' }}>
              View
            </button>
          )}
        </div>
      )}

      {/* COIN DEDUCTION MODAL FOR MESSAGING */}
      {showCoinPopup && (

        <div className="auth-overlay" style={{ background: 'rgba(0,0,0,0.8)', zIndex: 10001 }}>
          <div className="error-card" style={{ maxWidth: '400px', padding: '30px', textAlign: 'center', background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '30px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🪙</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Spend Coins?</h2>
            <p style={{ color: '#94a3b8', marginBottom: '25px', lineHeight: '1.5' }}>
              Sending a message to a non-friend partner costs <strong>5 Coins</strong>. Do you want to continue?
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={confirmAndSendMessage} style={{ padding: '12px 25px', borderRadius: '15px', fontWeight: '800' }}>Confirm (-5)</button>
              <button className="btn btn-secondary" onClick={() => setShowCoinPopup(false)} style={{ padding: '12px 25px', borderRadius: '15px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}


      <style jsx global>{`
        .chat-page-v2 {
          max-width: 100% !important;
          min-height: 100vh;
          overflow-y: auto;
          padding: 1rem 2rem !important;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          user-select: none; /* Prevent text selection */
          -webkit-user-drag: none; /* Prevent dragging elements */
        }

        /* FILTERS ROW V2 */
        .filters-row-v2 {
          display: flex;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          align-items: center;
          position: relative;
          z-index: 100;
        }

        .custom-dropdown-container {
          position: relative;
          width: 180px;
        }

        .custom-dropdown-container label {
          display: block;
          font-size: 0.65rem;
          color: #94a3b8;
          text-transform: uppercase;
          font-weight: 800;
          margin-bottom: 0.4rem;
          letter-spacing: 0.05em;
        }

        .dropdown-trigger {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.4rem 0.75rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          height: 38px;
          overflow: hidden;
        }

        .dropdown-trigger:hover {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.1);
        }

        .icon-val { font-size: 1rem; line-height: 1; }
        .label-val { 
          flex: 1; 
          font-size: 0.8rem; 
          font-weight: 700; 
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: left;
        }
        .arrow-val { font-size: 0.5rem; color: #64748b; }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 100%;
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          overflow: hidden;
          animation: slideDown 0.2s ease-out;
          z-index: 1000;
        }

        .search-box {
          padding: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .search-box input {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          font-size: 0.75rem;
          outline: none;
        }

        .items-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .dropdown-item {
          padding: 0.6rem 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          color: #cbd5e1;
          transition: all 0.2s;
        }

        .dropdown-item:hover {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
        }

        .dropdown-item.active {
          background: #6366f1;
          color: white;
        }

        .no-results {
          padding: 0.75rem;
          font-size: 0.75rem;
          color: #64748b;
          text-align: center;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .paywall-badge-v2 {
          margin-left: auto;
          background: linear-gradient(to right, #f59e0b, #d97706);
          color: black;
          padding: 0.4rem 1rem;
          border-radius: 50px;
          font-weight: 800;
          font-size: 0.75rem;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
          transition: all 0.2s;
        }

        .paywall-badge-v2:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
        }

        /* REST OF THE STYLES FROM PREVIOUS VERSION */
        .header-v2 {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          padding: 0.5rem 1.25rem;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .user-profile-tag {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.4rem 1.2rem 0.4rem 0.5rem;
          border-radius: 100px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.3s;
        }

        .btn-home {
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: #fff;
          padding: 0.5rem 1.25rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.3s;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .btn-home:hover {
          background: #6366f1;
          border-color: #6366f1;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
        }

        .btn-home .icon {
          font-size: 1.1rem;
        }

        .avatar {
          width: 32px;
          height: 32px;
          background: #6366f1;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.9rem;
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.5);
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: #fff;
        }

        .user-sub {
          font-size: 0.65rem;
          color: #94a3b8;
          font-weight: 600;
          text-transform: uppercase;
        }

        .vip-badge-inline {
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
          color: #000;
          font-size: 0.6rem;
          font-weight: 900;
          padding: 0.1rem 0.5rem;
          border-radius: 4px;
          margin-left: 6px;
          vertical-align: middle;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
        }

        .pro-badge-v2 {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          margin-left: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .main-layout {
          display: flex;
          gap: 1rem;
          height: calc(100vh - 100px);
        }

        .video-column {
          flex: 8;
          display: flex;
          flex-direction: column;
          gap: 0;
          height: 100%;
          justify-content: center;
        }

        .chat-column {
          flex: 1;
          min-width: 300px;
          max-width: 400px;
        }

        .video-grid-v2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          flex: 1;
          margin-bottom: -85px; /* Pull bottom bar up to touch video */
        }


        .video-card {
          background: #000;
          border-radius: 24px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          aspect-ratio: 4 / 3;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .video-card video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-card video.mirrored {
          transform: scaleX(-1);
        }

        .natural-view {
          transform: scaleX(1) !important;
        }

        /* PARTNER PREVIEW STYLES */
        .partner-preview-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: #0f172a;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.5s ease;
        }

        .preview-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          backdrop-filter: blur(20px);
          max-width: 80%;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
        }

        .preview-avatar {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.2rem;
          font-weight: 800;
          color: white;
          box-shadow: 0 0 30px rgba(99, 102, 241, 0.5);
          animation: avatarPulse 2s infinite;
        }

        @keyframes avatarPulse {
          0% { transform: scale(1); box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
          50% { transform: scale(1.1); box-shadow: 0 0 40px rgba(99, 102, 241, 0.6); }
          100% { transform: scale(1); box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
        }

        .preview-name {
          font-size: 1.75rem;
          font-weight: 900;
          color: white;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .preview-badges {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .preview-gender, .preview-country {
          background: rgba(255, 255, 255, 0.05);
          padding: 0.4rem 1rem;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #cbd5e1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .preview-gender.male { color: #3b82f6; border-color: rgba(59, 130, 246, 0.3); }
        .preview-gender.female { color: #ec4899; border-color: rgba(236, 72, 153, 0.3); }

        .preview-country img {
          width: 18px;
          height: 12px;
          border-radius: 2px;
        }

        .connecting-pulse {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 600;
          margin-top: 0.5rem;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #6366f1;
          border-radius: 50%;
          animation: pulseAnim 1.5s infinite;
        }

        @keyframes pulseAnim {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(2); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }

        .card-label {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: rgba(0, 0, 0, 0.6);
          padding: 0.4rem 0.8rem;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
          backdrop-filter: blur(4px);
        }

        .card-controls {
          position: absolute;
          bottom: 1rem;
          left: 1rem;
          display: flex;
          gap: 0.5rem;
        }

        .ctrl-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(15, 23, 42, 0.7);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .ctrl-btn.off {
          background: rgba(239, 68, 68, 0.6);
        }

        .add-friend-btn {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          background: #10b981;
          border: none;
          color: white;
          padding: 0.5rem 1.25rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
          transition: all 0.3s;
        }

        .add-friend-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
          background: #059669;
        }

        .add-friend-btn:disabled {
          background: #334155;
          cursor: not-allowed;
          box-shadow: none;
        }

        .friend-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 1rem 1.5rem;
          border-radius: 16px;
          color: white;
          font-weight: 700;
          font-size: 0.9rem;
          z-index: 1000000;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          animation: slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .friend-toast.success { background: #10b981; }
        .friend-toast.received { background: #6366f1; }

        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .bottom-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.03);
          padding: 0.75rem 1.5rem;
          border-radius: 20px;
        }

        .conn-status {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: #94a3b8;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .dot.active { background: #10b981; box-shadow: 0 0 10px #10b981; }
        .dot.searching { background: #f59e0b; animation: pulse 1.5s infinite; }

        .next-btn {
          background: #6366f1;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.2s;
        }

        .next-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(99, 102, 241, 0.4);
        }

        /* CHAT SIDEBAR STYLES */
        .chat-box-v2 {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .chat-box-header {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-box-header h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #6366f1;
        }

        .msg-count {
          font-size: 0.7rem;
          color: #64748b;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
        }

        .chat-box-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .empty-chat {
          text-align: center;
          color: #475569;
          margin-top: 2rem;
          font-size: 0.9rem;
        }

        .msg-row {
          display: flex;
          width: 100%;
        }

        .msg-row.me { justify-content: flex-end; }
        .msg-row.partner { justify-content: flex-start; }

        .msg-content {
          max-width: 85%;
          padding: 0.6rem 0.9rem;
          font-size: 0.85rem;
          line-height: 1.4;
          border-radius: 15px;
        }

        .me .msg-content {
          background: #6366f1;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .partner .msg-content {
          background: rgba(255, 255, 255, 0.1);
          color: #f1f5f9;
          border-bottom-left-radius: 4px;
        }

        .chat-box-input {
          padding: 1rem;
          display: flex;
          gap: 0.5rem;
          background: rgba(0, 0, 0, 0.1);
        }

        .chat-box-input input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 0.6rem 1rem;
          border-radius: 12px;
          font-size: 0.85rem;
          outline: none;
        }

        .chat-box-input button {
          background: #6366f1;
          color: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .btn-icon-only {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.2rem;
        }

        /* MODAL STYLES */
        .pricing-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(15px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          overflow-y: auto;
        }

        .pricing-modal-content {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          padding: 2.5rem;
          width: 100%;
          max-width: 650px;
          position: relative;
          text-align: center;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          margin: auto; /* For centering in overflow-y auto */
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .close-modal {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: none;
          border: none;
          color: #64748b;
          font-size: 2rem;
          cursor: pointer;
        }

        .modal-title {
          font-size: 1.8rem;
          font-weight: 800;
          background: linear-gradient(to right, #6366f1, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .modal-subtitle {
          color: #94a3b8;
          font-size: 0.9rem;
          margin-bottom: 2rem;
        }

        .currency-toggle-mini {
          display: inline-flex;
          background: rgba(0, 0, 0, 0.2);
          padding: 0.3rem;
          border-radius: 10px;
          margin-bottom: 1.5rem;
        }

        .currency-toggle-mini button {
          background: none;
          border: none;
          color: #64748b;
          padding: 0.4rem 1rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }

        .currency-toggle-mini button.active {
          background: #6366f1;
          color: white;
        }

        .currency-selector { display: flex; justify-content: center; margin-bottom: 2rem; }
        .currency-pill { background: rgba(255,255,255,0.05); padding: 0.4rem; border-radius: 100px; display: flex; gap: 0.5rem; }
        .currency-pill button { background: transparent; border: none; color: #94a3b8; padding: 0.5rem 1.5rem; border-radius: 100px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.3s; }
        .currency-pill button.active { background: #6366f1; color: white; box-shadow: 0 4px 12px rgba(99,102,241,0.3); }

        .pricing-grid-premium { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 2rem 0; }
        .premium-card-mini { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 1.5rem; text-align: center; cursor: pointer; transition: all 0.3s; position: relative; }
        .premium-card-mini:hover { background: rgba(255,255,255,0.05); border-color: #6366f1; transform: translateY(-5px); }
        .premium-card-mini.featured { border-color: #6366f1; background: rgba(99, 102, 241, 0.05); }
        .premium-card-mini.elite-gold { border-color: #f59e0b; background: rgba(245, 158, 11, 0.05); }
        .card-top { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
        .card-top .icon { font-size: 1.75rem; }
        .card-top .name { font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; }
        .card-price { font-size: 1.5rem; font-weight: 900; color: white; }
        .card-dur { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }
        .popular-ribbon-mini { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #6366f1; color: white; font-size: 0.6rem; font-weight: 800; padding: 0.25rem 0.75rem; border-radius: 50px; white-space: nowrap; }
        .elite-badge-mini { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #f59e0b; color: black; font-size: 0.6rem; font-weight: 800; padding: 0.25rem 0.75rem; border-radius: 50px; white-space: nowrap; }
        
        .pricing-footer-features { display: flex; flex-wrap: wrap; justify-content: center; gap: 1.5rem; margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 2rem; }
        .feature-item { font-size: 0.85rem; color: #94a3b8; display: flex; align-items: center; gap: 0.5rem; }
        .feature-item span { color: #6366f1; font-weight: 900; }

        .payment-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.95); backdrop-filter: blur(15px); z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 2rem; }
        .premium-modal { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); width: 100%; max-width: 500px; border-radius: 40px; position: relative; overflow: hidden; box-shadow: 0 50px 100px rgba(0,0,0,0.5); animation: modalSlideUp 0.6s cubic-bezier(0.16,1,0.3,1); }
        .premium-modal.pricing-wide { max-width: 800px; }
        @keyframes modalSlideUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
        .modal-close-btn { position: absolute; top: 1.5rem; right: 1.5rem; background: rgba(255,255,255,0.05); border: none; color: #94a3b8; width: 40px; height: 40px; border-radius: 50%; font-size: 1.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; }
        .modal-header-premium { padding: 4rem 2rem 2rem; text-align: center; }
        .plan-pill { background: rgba(99,102,241,0.1); color: #6366f1; display: inline-block; padding: 0.4rem 1.2rem; border-radius: 50px; font-weight: 800; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 1rem; }
        .total-amount { font-size: 3.5rem; font-weight: 900; color: white; margin: 0; letter-spacing: -0.04em; }
        .modal-subtitle { color: #64748b; font-size: 0.9rem; margin-top: 0.5rem; }
        .modal-body-premium { padding: 0 3rem 3rem; }
        
        .methods-list-premium { display: flex; flex-direction: column; gap: 1rem; }
        .pay-method-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 1.25rem; border-radius: 24px; display: flex; align-items: center; gap: 1.25rem; cursor: pointer; transition: all 0.3s; width: 100%; text-align: left; }
        .pay-method-item:hover { background: rgba(255,255,255,0.06); border-color: #6366f1; transform: translateX(10px); }
        .pay-icon-box { font-size: 1.75rem; background: #000; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 16px; flex-shrink: 0; }
        .pay-details strong { display: block; color: white; font-size: 1.1rem; }
        .pay-details span { color: #64748b; font-size: 0.85rem; }
        .pay-arrow { color: #475569; font-size: 1.5rem; margin-left: auto; }

        .status-container { text-align: center; padding: 2rem 0; }
        .premium-loader { width: 60px; height: 60px; border: 4px solid rgba(99,102,241,0.1); border-top-color: #6366f1; border-radius: 50%; animation: premiumSpin 1s linear infinite; margin: 0 auto 2rem; }
        @keyframes premiumSpin { to { transform: rotate(360deg); } }
        .success-glow { width: 80px; height: 80px; background: #10b981; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 2rem; box-shadow: 0 0 40px rgba(16,185,129,0.4); }
        .btn-start-pro { background: #10b981; color: white; border: none; width: 100%; padding: 1.25rem; border-radius: 20px; font-weight: 800; font-size: 1.1rem; cursor: pointer; transition: all 0.3s; }
        .btn-start-pro:hover { background: #059669; transform: translateY(-2px); }
        .btn-cancel-payment { background: transparent; border: none; color: #ef4444; font-weight: 700; font-size: 0.9rem; cursor: pointer; margin-top: 1rem; }
        
        .modal-footer-premium { padding: 2rem; background: rgba(0,0,0,0.2); text-align: center; }
        .security-tag { color: #475569; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        
        .vip-crown-tag {
          background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%);
          color: #000;
          font-weight: 900;
          font-size: 0.7rem;
          padding: 0.3rem 0.9rem;
          border-radius: 8px;
          margin-left: 8px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.4);
          position: relative;
          overflow: hidden;
          animation: vipPulse 2s infinite ease-in-out;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .vip-crown-tag::after {
          content: '';
          position: absolute;
          top: -100%;
          left: -100%;
          width: 300%;
          height: 300%;
          background: linear-gradient(45deg, transparent 45%, rgba(255, 255, 255, 0.6) 50%, transparent 55%);
          animation: shine 3s infinite;
        }

        @keyframes shine {
          0% { transform: translate(-30%, -30%); }
          100% { transform: translate(30%, 30%); }
        }

        @keyframes vipPulse {
          0% { transform: scale(1); box-shadow: 0 0 15px rgba(245, 158, 11, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 25px rgba(245, 158, 11, 0.6); }
          100% { transform: scale(1); box-shadow: 0 0 15px rgba(245, 158, 11, 0.4); }
        }

        @keyframes vipGlow {
          0% { box-shadow: 0 0 5px #ffcc00; }
          50% { box-shadow: 0 0 15px #ff9900; }
          100% { box-shadow: 0 0 5px #ffcc00; }
        }

        /* REPORT SYSTEM STYLES */
        .report-trigger-btn {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s;
        }
        .report-trigger-btn:hover {
          background: #ef4444;
          color: white;
          transform: translateY(-2px);
        }

        .report-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(10px);
          z-index: 200000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .report-modal-content {
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          width: 100%;
          max-width: 420px;
          border-radius: 24px;
          padding: 30px;
          position: relative;
          animation: modalSlideUp 0.3s ease;
        }

        .report-close {
          position: absolute;
          top: 15px; right: 20px;
          font-size: 2rem;
          color: #64748b;
          cursor: pointer;
        }

        .reasons-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }

        .reason-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #94a3b8;
          padding: 12px;
          border-radius: 12px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .reason-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
          color: white;
        }

        .reason-btn.active {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
        }

        .report-details-box {
          width: 100%;
          height: 100px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 15px;
          color: white;
          font-size: 0.9rem;
          resize: none;
          outline: none;
          margin-bottom: 20px;
        }

        .report-submit-btn {
          width: 100%;
          padding: 15px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 14px;
          font-weight: 800;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .report-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3);
        }

        .report-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .coin-prompt-inline {
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.3);
          padding: 10px 15px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          margin: 5px 0;
          animation: slideIn 0.3s ease;
        }

        .prompt-text {
          font-size: 0.8rem;
          font-weight: 600;
          color: #e2e8f0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .prompt-actions {
          display: flex;
          gap: 8px;
        }

        .prompt-actions button {
          flex: 1;
          padding: 6px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .yes-btn {
          background: #6366f1;
          color: #fff;
        }

        .no-btn {
          background: rgba(255,255,255,0.05);
          color: #94a3b8;
        }

        .yes-btn:hover { background: #4f46e5; }
        .no-btn:hover { background: rgba(255,255,255,0.1); }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
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

        .report-success-toast {
          position: fixed;
          bottom: -100px;
          left: 50%;
          transform: translateX(-50%);
          background: #10b981;
          color: white;
          padding: 15px 30px;
          border-radius: 50px;
          font-weight: 700;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 300000;
        }

        .report-success-toast.show {
          bottom: 40px;
        }

        /* MOBILE RESPONSIVENESS FOR CHAT */
        @media (max-width: 1024px) {
          .chat-main-v2 {
            flex-direction: column;
            gap: 20px;
          }
          .video-column {
            max-width: 100% !important;
            flex-direction: column !important;
          }
          .video-card {
            width: 100% !important;
            height: 38vh !important;
          }
          .chat-column {
            width: 100% !important;
            height: 400px;
          }
        }

        @media (max-width: 768px) {
          .toolbar-inner {
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
          }
          .tool-divider { display: none; }
          .pricing-modal-content {
            padding: 1.5rem !important;
            width: 95% !important;
          }
          .pricing-grid-premium {
            grid-template-columns: 1fr 1fr !important;
          }
          .total-amount {
            font-size: 2.5rem !important;
          }
          .identity-container {
            margin-top: 0;
            padding: 10px;
          }
          .bottom-mini-bar {
            padding: 10px !important;
            gap: 10px !important;
          }
          .mini-btn-label {
            display: none;
          }
          .incoming-call-card {
            width: 90% !important;
          }
        }

        @media (max-width: 480px) {
          .video-card {
            height: 35vh !important;
          }
          .chat-column {
            height: 300px;
          }
          .pricing-grid-premium {
            grid-template-columns: 1fr !important;
          }
        }

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
        .header-coins-pill:hover {
           background: rgba(255, 255, 255, 0.1);
           transform: translateY(-2px);
           border-color: #fbbf24;
        }
        .coin-icon { font-size: 1.2rem; }
        .coin-count { color: #fff; font-weight: 800; font-size: 0.9rem; }
        
        /* USER REQUESTED BOTTOM BAR & POPUPS CSS */
        .identity-container {
          margin-top: -60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 100;
        }
        .bottom-mini-bar {
          display: flex;
          gap: 6px;
          background: #111827;
          padding: 4px 8px;
          border-radius: 14px;
          border: 1px solid #334155;
          z-index: 999;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .tool-btn {
          background: #1e293b;
          border: none;
          color: white;
          padding: 8px 12px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          transition: 0.2s;
          font-weight: 700;
        }
        .tool-btn:hover { background: #334155; }
        .tool-btn.active { background: #ec4899; color: white; border: 1px solid #fff; }

        .identity-popup-bubble {
          position: absolute;
          bottom: 75px;
          background: #111827;
          padding: 12px;
          border-radius: 18px;
          border: 1px solid #334155;
          z-index: 1000;
          min-width: 250px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6);
          animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .popup-arrow {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0; 
          height: 0; 
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid #111827;
        }
        @keyframes popIn { from { opacity: 0; transform: scale(0.9) translateY(10px) translateX(-50%); } to { opacity: 1; transform: scale(1) translateY(0) translateX(-50%); } }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .popup-header span { font-size: 0.65rem; font-weight: 900; color: #ec4899; letter-spacing: 1.5px; }
        .popup-header button { background: none; border: none; color: #64748b; font-size: 1.1rem; cursor: pointer; line-height: 1; }

        .filters-by-category {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 0.5rem;
          max-height: 400px;
          overflow-y: auto;
        }
        .category-section { display: flex; flex-direction: column; gap: 0.75rem; }
        .cat-title { font-size: 0.75rem; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid rgba(99, 102, 241, 0.2); padding-bottom: 0.4rem; margin: 0; text-align: left; }
        .popup-options-row { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: flex-start; }
        .mini-option { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 0.75rem; border-radius: 16px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 0.4rem; min-width: 90px; position: relative; }
        .mini-option:hover { background: rgba(99, 102, 241, 0.1); border-color: #6366f1; transform: translateY(-2px); }
        .mini-option.selected { background: #6366f1; border-color: #818cf8; color: white; box-shadow: 0 0 15px rgba(99, 102, 241, 0.4); }
        .mini-option.locked-filter { opacity: 0.8; filter: grayscale(0.5); }
        .mini-option.locked-filter::after { content: "🔒"; position: absolute; top: 5px; right: 5px; font-size: 0.6rem; }
        .filter-icon { font-size: 1.5rem; }
        .filter-info { display: flex; flex-direction: column; align-items: center; }
        .filter-name { font-size: 0.7rem; font-weight: 700; text-align: center; color: #fff; }
        .filter-cost { font-size: 0.6rem; color: #fbbf24; font-weight: 800; margin-top: 2px; }
        .mini-option:hover { background: #334155; transform: scale(1.05); }
        .mini-option.selected {
          background: #6366f1;
          border-color: #818cf8;
          color: white;
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
        }

        /* REAL SNAP-LIKE MASK COMPONENTS */
        .mask-doggy::before, .mask-doggy::after {
          content: '👂';
          position: absolute;
          font-size: 5rem;
          top: 10%;
        }
        .mask-doggy::before { left: 15%; transform: rotate(-20deg); }
        .mask-doggy::after { right: 15%; transform: rotate(20deg); }
        .mask-doggy::placeholder { /* Main face part */ }
        .mask-doggy::after { 
           content: '🐶'; 
           position: absolute; 
           top: 50%; 
           left: 50%; 
           transform: translate(-50%, -50%); 
           font-size: 10rem;
           opacity: 0.3; /* Overlay look */
        }

        .mask-glass::before {
          content: '👓';
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 8rem;
          filter: drop-shadow(0 0 10px #00f2ff);
        }

        .video-mask-overlay {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none;
          z-index: 5;
        }
        
        @media (max-width: 768px) {
          .toolbar-inner { flex-wrap: wrap; gap: 15px; }
          .tool-divider { display: none; }
        }

        /* SECRET IDENTITY STYLES */
        .video-mask-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 5;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        /* SNAP FILTERS STYLES */
        .mask-doggy::before { 
          content: '🐶'; 
          font-size: 10rem; 
          position: absolute; 
          top: 50%; 
          left: 50%;
          transform: translate(-50%, -50%);
          filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));
          animation: faceMove 4s infinite ease-in-out;
        }
        .mask-crown::before { 
          content: '🌸'; 
          font-size: 8rem; 
          position: absolute; 
          top: 15%; 
          left: 50%;
          transform: translateX(-50%);
          animation: crownFloat 3s infinite ease-in-out;
          filter: drop-shadow(0 0 15px rgba(236, 72, 153, 0.6));
        }
        .mask-fire {
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, transparent 40%, rgba(255, 69, 0, 0.2) 70%);
          mix-blend-mode: color-dodge;
        }
        .mask-fire::before, .mask-fire::after { 
          content: '🔥'; 
          font-size: 6rem; 
          position: absolute; 
          top: 40%;
          animation: eyeBurn 0.5s infinite alternate;
        }
        .mask-fire::before { left: 25%; }
        .mask-fire::after { right: 25%; }

        .mask-stars {
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
        }
        .mask-stars::before { 
          content: '✨'; 
          font-size: 4rem; 
          position: absolute; 
          top: 20%; left: 20%; 
          animation: starPulse 2s infinite; 
        }
        .mask-stars::after { 
          content: '✨'; 
          font-size: 4rem; 
          position: absolute; 
          bottom: 20%; right: 20%; 
          animation: starPulse 2s infinite 1s; 
        }

        @keyframes faceMove {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -52%) scale(1.05); }
        }
        @keyframes crownFloat {
          0%, 100% { transform: translateX(-50%) translateY(0) rotate(-2deg); }
          50% { transform: translateX(-50%) translateY(-15px) rotate(2deg); }
        }
        @keyframes eyeBurn {
          from { transform: scale(1); filter: blur(0px) drop-shadow(0 0 10px orange); }
          to { transform: scale(1.2); filter: blur(2px) drop-shadow(0 0 20px red); }
        }
        @keyframes starPulse {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.5) rotate(180deg); opacity: 0.5; }
        }

        .avatar-video-replacement {
          width: 100%;
          height: 100%;
          background: #000;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .avatar-video-replacement img {
          max-width: 80%;
          max-height: 80%;
          border-radius: 50%;
        }

        .secret-btn.active {
          background: #ec4899 !important;
          box-shadow: 0 0 20px rgba(236, 72, 153, 0.5);
        }

        @media (max-width: 1200px) {
          .secret-identity-panel {
            left: 0;
            top: 100%;
            width: 100%;
            margin-left: 0;
            margin-top: 20px;
          }
        }

        /* GIFTING STYLES */
        .gift-bubble {
          bottom: 70px;
          left: 50%;
          transform: translateX(-50%);
          width: 280px !important;
          background: #111827 !important;
        }
        .gift-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding: 15px;
        }
        .gift-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 10px 5px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .gift-item:hover {
          background: rgba(236, 72, 153, 0.1);
          border-color: rgba(236, 72, 153, 0.3);
          transform: translateY(-3px);
        }
        .gift-icon { font-size: 1.8rem; }
        .gift-label { font-size: 0.7rem; color: #fff; font-weight: 700; }
        .gift-price { font-size: 0.65rem; color: #fbbf24; font-weight: 800; }

        .free-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ef4444;
          color: white;
          font-size: 0.6rem;
          font-weight: 900;
          padding: 2px 6px;
          border-radius: 10px;
          border: 1px solid #1e293b;
          box-shadow: 0 2px 5px rgba(239, 68, 68, 0.4);
          animation: pulse 2s infinite;
          z-index: 2;
        }

        .floating-gift-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .floating-sticker-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: giftEntrance 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards,
                     giftFloat 3s infinite ease-in-out 0.8s;
        }
        .sticker-emoji {
          font-size: 6rem;
          filter: drop-shadow(0 0 30px rgba(255, 255, 255, 0.5));
          z-index: 2;
        }
        .sticker-glow {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 150px; height: 150px;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%);
          filter: blur(20px);
          animation: glowPulse 2s infinite;
        }
        .sticker-info {
          margin-top: 20px;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(10px);
          padding: 10px 20px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .sticker-sender { color: #fff; font-weight: 800; font-size: 1rem; }
        .sticker-amount { color: #fbbf24; font-weight: 900; font-size: 1.2rem; }

        @keyframes giftEntrance {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes giftFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.3); }
        }
      `}</style>
      </div>
    </>
  );
}
