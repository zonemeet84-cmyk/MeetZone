import { useEffect, useRef, useState, useCallback } from "react";
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
  const isFaceDetectedRef = useRef(false);
  const prevFramePixelsRef = useRef(null);


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

  // --- PREMIUM TOAST NOTIFICATION SYSTEM ---
  const [toastQueue, setToastQueue] = useState([]);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToastQueue(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToastQueue(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const [partnerId, setPartnerId] = useState(null);
  const partnerIdRef = useRef(null);
  useEffect(() => { partnerIdRef.current = partnerId; }, [partnerId]);
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [status, setStatus] = useState("Connecting to server...");
  const iceCandidatesQueue = useRef([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [banInfo, setBanInfo] = useState(null); // { reason, screenshot }
  const router = useRouter();

  // Filters & Premium
  const [gender, setGender] = useState("all");
  const [country, setCountry] = useState("all");
  const [age, setAge] = useState("all");
  const [stateProv, setStateProv] = useState("All States");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempGender, setTempGender] = useState("all");
  const [tempCountry, setTempCountry] = useState("all");
  const [tempStateProv, setTempStateProv] = useState("All States");
  const [tempAge, setTempAge] = useState("all");
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currency, setCurrency] = useState("INR");
  const [paymentStep, setPaymentStep] = useState("methods"); // 'methods', 'processing', 'success'
  // const [nsfwModel, setNsfwModel] = useState(null); // REMOVED duplicate
  const [showCoinPopup, setShowCoinPopup] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState([]);

  const fetchHistory = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get("https://meetzone-backend.onrender.com/api/user/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistoryList(res.data.history || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  // --- QUIZ DUEL / BRAIN CLASH STATE ---
  // --- QUIZ DUEL / BRAIN CLASH STATE ---
  const [quizState, setQuizState] = useState("idle"); // 'idle', 'queued', 'countdown', 'active', 'finished'
  const [showQuizRoomsModal, setShowQuizRoomsModal] = useState(false);
  const [quizCategoryStats, setQuizCategoryStats] = useState({});
  const [quizCountdown, setQuizCountdown] = useState(3);
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [quizScores, setQuizScores] = useState({});
  const [quizSelectedOption, setQuizSelectedOption] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [quizPartnerInfo, setQuizPartnerInfo] = useState(null);
  const [quizFinalResult, setQuizFinalResult] = useState(null);
  const [quizError, setQuizError] = useState(null);
  const [quizTimeLeft, setQuizTimeLeft] = useState(15);
  const [quizTimeoutState, setQuizTimeoutState] = useState(null);
  const [quizForfeitState, setQuizForfeitState] = useState(false);
  const [quizLockedOut, setQuizLockedOut] = useState(false);
  const [dareChoiceStep, setDareChoiceStep] = useState("none"); // 'none', 'loser-deciding', 'winner-deciding', 'waiting-loser', 'waiting-winner'
  const [partnerMicOn, setPartnerMicOn] = useState(true);
  const [partnerCameraOn, setPartnerCameraOn] = useState(true);

  // MediaPipe Filters
  const [activeMediaPipeFilter, setActiveMediaPipeFilter] = useState("None");
  const [selectedTempFilter, setSelectedTempFilter] = useState("None");
  const [selectedTempAvatar, setSelectedTempAvatar] = useState("None");
  const [selectedTempVoice, setSelectedTempVoice] = useState("Normal");
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
    { id: "Devil", name: "Devil Horns", icon: "😈", cost: 90, category: "Funny" },
    { id: "Glasses", name: "Thug Glasses", icon: "🕶️", cost: 80, category: "Funny" },
    // Premium
    { id: "Anime", name: "Anime", icon: "🎎", cost: 200, category: "Premium" },
    { id: "Neon", name: "Neon Mask", icon: "⚡", cost: 180, category: "Premium" },
    { id: "Crown", name: "Gold Crown", icon: "👑", cost: 100, category: "Premium" },
    { id: "Sharp", name: "Sharper Webcam", icon: "📷", cost: 150, category: "Premium" },
    { id: "LowLight", name: "AI Night Enhance", icon: "🌙", cost: 150, category: "Premium" },
    // Couple
    { id: "Angel", name: "Angel Halo", icon: "😇", cost: 80, category: "Couple" },
    { id: "Ghost", name: "Ghost Overlay", icon: "👻", cost: 80, category: "Couple" }
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

    // ROBUST MANUAL FACE TRACKING WITH MEDIA-PIPE FACEMESH DIRECTLY
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

      const initMediaPipe = async () => {
        if (!window.FaceMesh) {
          setTimeout(initMediaPipe, 500);
          return;
        }

        try {
          const FaceMeshConstructor = window.FaceMesh.FaceMesh || window.FaceMesh;
          faceMesh = new FaceMeshConstructor({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
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

      // Try initializing MediaPipe FaceMesh directly for stable performance
      setTimeout(initMediaPipe, 1000);

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
      const isDetected = !!(results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0 && activeFilterRef.current !== "None");
      isFaceDetectedRef.current = isDetected;

      if (isDetected !== isTrackingFaceRef.current) {
        isTrackingFaceRef.current = isDetected;
        setIsTrackingFace(isDetected);
      }

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
          case "Devil": drawDevilMask(ctx, landmarks, w, h, centerX, centerY, faceWidth, angle); break;
          case "Glasses": drawGlassesFilter(ctx, landmarks, w, h); break;
          case "Neon": drawNeonMask(ctx, landmarks, w, h, centerX, centerY, faceWidth); break;
          case "Crown": drawCrownMask(ctx, landmarks, w, h, centerX, centerY, faceWidth, angle); break;
          case "Angel": drawAngelMask(ctx, landmarks, w, h, centerX, centerY, faceWidth, angle); break;
          case "Ghost": drawGhostMask(ctx, landmarks, w, h, centerX, centerY, faceWidth, angle); break;
          case "Glow": applyGlowEffect(ctx, w, h); break;
          case "Whitening": applyWhiteningEffect(ctx, w, h); break;
          case "Smooth": applySmoothingEffect(ctx, w, h); break;
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

    if (catEarsImg && catEarsImg.complete) {
      drawImage(ctx, catEarsImg, centerX, forehead.y * h - faceWidth * 0.7, faceWidth * 2, faceWidth * 1.5, angle);
    }

    // Draw whiskers with translation and rotation!
    ctx.save();
    ctx.translate(centerX, centerY + faceWidth * 0.1);
    ctx.rotate(angle);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;

    for (let i = 0; i < 3; i++) {
      // Left whiskers
      ctx.beginPath();
      ctx.moveTo(-faceWidth * 0.15, i * 8);
      ctx.lineTo(-faceWidth * 0.65, -8 + i * 8);
      ctx.stroke();

      // Right whiskers
      ctx.beginPath();
      ctx.moveTo(faceWidth * 0.15, i * 8);
      ctx.lineTo(faceWidth * 0.65, -8 + i * 8);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawDevilMask = (ctx, landmarks, w, h, centerX, centerY, faceWidth, angle) => {
    const forehead = landmarks[10];
    ctx.save();
    ctx.translate(forehead.x * w, forehead.y * h - faceWidth * 0.4);
    ctx.rotate(angle);
    ctx.font = `${faceWidth * 1.2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(239, 68, 68, 0.9)";
    ctx.shadowBlur = 15;
    ctx.fillText("😈", 0, 0);
    ctx.restore();
  };

  const drawNeonMask = (ctx, landmarks, w, h, centerX, centerY, faceWidth) => {
    glowCircle(ctx, centerX, centerY, faceWidth * 2);

    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.arc(centerX, centerY, faceWidth * 1.5, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawCrownMask = (ctx, landmarks, w, h, centerX, centerY, faceWidth, angle) => {
    const forehead = landmarks[10];
    ctx.save();
    ctx.translate(forehead.x * w, forehead.y * h - faceWidth * 0.7);
    ctx.rotate(angle);
    ctx.font = `${faceWidth * 1.2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(255, 215, 0, 0.85)";
    ctx.shadowBlur = 15;
    ctx.fillText("👑", 0, 0);
    ctx.restore();
  };

  const drawAngelMask = (ctx, landmarks, w, h, centerX, centerY, faceWidth, angle) => {
    const forehead = landmarks[10];
    ctx.save();
    ctx.translate(forehead.x * w, forehead.y * h - faceWidth * 1.0);
    ctx.rotate(angle);
    ctx.font = `${faceWidth * 1.3}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(6, 182, 212, 0.9)";
    ctx.shadowBlur = 20;
    ctx.fillText("😇", 0, 0);
    ctx.restore();
  };

  const drawGhostMask = (ctx, landmarks, w, h, centerX, centerY, faceWidth, angle) => {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.translate(centerX + faceWidth * 0.8, centerY - faceWidth * 1.2);
    ctx.rotate(angle + 0.1);
    ctx.font = `${faceWidth * 1.4}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(168, 85, 247, 0.8)";
    ctx.shadowBlur = 20;
    ctx.fillText("👻", 0, 0);
    ctx.restore();
  };

  const applyGlowEffect = (ctx, w, h) => {
    ctx.save();
    ctx.globalAlpha = 0.3;
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };

  const applyWhiteningEffect = (ctx, w, h) => {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };

  const applySmoothingEffect = (ctx, w, h) => {
    if (localVideo.current) {
      ctx.save();
      ctx.filter = "blur(1px) brightness(1.02) contrast(1.02)";
      ctx.drawImage(localVideo.current, 0, 0, w, h);
      ctx.restore();
    }
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





  // SCREENSHOT PREVENTION & RIGHT CLICK BLOCK
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p') || (e.ctrlKey && e.shiftKey && e.key === 'S')) {
        e.preventDefault();
        showToast("📸 Screenshots and Screen Recording are restricted for privacy safety.", "warning");
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
      showToast("No partner to report yet!", "warning");
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
      showToast("Please select a reason for reporting.", "warning");
      return;
    }

    const targetId = partnerInfo?.id || partnerId;
    if (!targetId) {
      showToast("Partner connection lost. Cannot submit report.", "error");
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

      const token = sessionStorage.getItem("token");
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
      showToast("Failed to submit report. Please try again.", "error");
    } finally {
      setIsReporting(false);
    }
  };

  const handleSendGift = async (sticker) => {
    if (!partnerId || !partnerInfo) {
      showToast("Connect with someone first!", "info");
      return;
    }

    const freeCount = user.stickers ? user.stickers.filter(id => id === sticker.id).length : 0;
    const isFree = freeCount > 0;

    if (!isFree && user.coins < sticker.price && user.email !== "ds9376314@gmail.com") {
      showToast("Insufficient coins! Go to Home to buy more.", "warning");
      return;
    }

    try {
      const token = sessionStorage.getItem("token");
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
        sessionStorage.setItem("user", JSON.stringify(updatedUser));

        // Show gift animation on SENDER's screen too
        setReceivedGift({ icon: sticker.icon, from: 'You', amount: sticker.price, isSender: true });
        setTimeout(() => setReceivedGift(null), 4000);

        // Emit socket gift to partner for real-time display
        socket.emit("send-gift-to-partner", {
          to: partnerId,
          stickerIcon: sticker.icon,
          senderName: user.name,
          amount: sticker.price
        });

        // Chat message
        setMessages(prev => [...prev, { sender: 'system', text: `You sent a ${sticker.icon} gift to ${partnerInfo.name}!` }]);
        setShowGiftPanel(false);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to send gift.", "error");
    }
  };


  const addFriend = async () => {
    if (!partnerInfo?.id) {
      showToast("Partner ID not found. Try again.", "error");
      return;
    }

    setFriendReqStatus(true);
    try {
      const token = sessionStorage.getItem("token");
      await axios.post("https://meetzone-backend.onrender.com/api/friends/request", { targetId: partnerInfo.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Also notify via socket for immediate UI feedback
      socket.emit("friend-request", { to: partnerId });

      setFriendNotification({ type: 'success', message: `Request sent to ${partnerInfo.name}` });
      setTimeout(() => setFriendNotification(null), 3000);
    } catch (err) {
      setFriendReqStatus(false);
      if (err.response?.data?.requiresPremium) {
        setShowPricingModal(true);
      } else {
        showToast(err.response?.data?.message || "Failed to send friend request.", "error");
      }
    }
  };

  // Media Controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // Chat
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const chatEndRef = useRef(null);

  // --- SECRET IDENTITY STATES ---
  const [isSecretIdentityPanelOpen, setIsSecretIdentityPanelOpen] = useState(false);
  const [activeVoice, setActiveVoice] = useState("Normal");
  const [activeMask, setActiveMask] = useState("None");
  const [activeAvatar, setActiveAvatar] = useState("None");
  const [isFaceBlurred, setIsFaceBlurred] = useState(false);
  const [isTrackingFace, setIsTrackingFace] = useState(false);
  const isTrackingFaceRef = useRef(false);
  const [activeIdentityMenu, setActiveIdentityMenu] = useState(null); // 'filters', 'avatars', 'voice', 'privacy'
  const [partnerIsBlurred, setPartnerIsBlurred] = useState(false);
  const [partnerAvatar, setPartnerAvatar] = useState("None");
  const [partnerMask, setPartnerMask] = useState("None");
  const [partnerFilter, setPartnerFilter] = useState("None");
  const [partnerVoice, setPartnerVoice] = useState("Normal");

  // Keep latest effects values tracked in refs to prevent stale closure bugs in socket listeners
  const activeAvatarRef = useRef("None");
  const isFaceBlurredRef = useRef(false);
  const activeMaskRef = useRef("None");
  const activeVoiceRef = useRef("Normal");

  useEffect(() => { activeAvatarRef.current = activeAvatar; }, [activeAvatar]);
  useEffect(() => { isFaceBlurredRef.current = isFaceBlurred; }, [isFaceBlurred]);
  useEffect(() => { activeMaskRef.current = activeMask; }, [activeMask]);
  useEffect(() => { activeVoiceRef.current = activeVoice; }, [activeVoice]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on("partner-effect", ({ type, value }) => {
      if (type === 'blur') setPartnerIsBlurred(value);
      if (type === 'avatar') setPartnerAvatar(value);
      if (type === 'mask') setPartnerMask(value);
      if (type === 'filter') setPartnerFilter(value);
      if (type === 'voice') setPartnerVoice(value);
    });

    return () => socket.off("partner-effect");
  }, [socket]);

  useEffect(() => {
    if (socket && partnerId) {
      socket.emit("partner-effect", { type: 'blur', value: isFaceBlurred });
      socket.emit("partner-effect", { type: 'avatar', value: activeAvatar });
      socket.emit("partner-effect", { type: 'mask', value: activeMask });
      socket.emit("partner-effect", { type: 'filter', value: activeMediaPipeFilter });
      socket.emit("partner-effect", { type: 'voice', value: activeVoice });
    }
  }, [isFaceBlurred, activeAvatar, activeMask, activeMediaPipeFilter, activeVoice, partnerId, socket]);


  // Effects apply directly on click now

  const getCssFilterString = () => {
    let filters = [];
    if (isFaceBlurred) {
      filters.push('blur(25px)');
    } else {
      if (activeMediaPipeFilter === "Smooth") {
        filters.push('contrast(1.03) saturate(1.02) brightness(1.02) blur(0.3px)');
      } else if (activeMediaPipeFilter === "Glow") {
        filters.push('brightness(1.15) contrast(1.05) saturate(1.1)');
      } else if (activeMediaPipeFilter === "Whitening") {
        filters.push('brightness(1.22) contrast(0.95)');
      } else if (activeMediaPipeFilter === "Beauty") {
        filters.push('brightness(1.12) contrast(1.08) saturate(1.15)');
      } else if (activeMediaPipeFilter === "Makeup") {
        filters.push('hue-rotate(348deg) saturate(1.2) brightness(1.06)');
      } else if (activeMediaPipeFilter === "Sharp") {
        filters.push('contrast(1.15) brightness(1.02) saturate(1.04)');
      } else if (activeMediaPipeFilter === "LowLight") {
        filters.push('brightness(1.28) contrast(0.92) saturate(1.12)');
      }
    }
    return filters.length > 0 ? filters.join(' ') : 'none';
  };

  const getPartnerCssFilterString = () => {
    let filters = [];
    if (partnerIsBlurred) {
      filters.push('blur(25px)');
    } else {
      if (partnerFilter === "Smooth") {
        filters.push('contrast(1.03) saturate(1.02) brightness(1.02) blur(0.3px)');
      } else if (partnerFilter === "Glow") {
        filters.push('brightness(1.15) contrast(1.05) saturate(1.1)');
      } else if (partnerFilter === "Whitening") {
        filters.push('brightness(1.22) contrast(0.95)');
      } else if (partnerFilter === "Beauty") {
        filters.push('brightness(1.12) contrast(1.08) saturate(1.15)');
      } else if (partnerFilter === "Makeup") {
        filters.push('hue-rotate(348deg) saturate(1.2) brightness(1.06)');
      } else if (partnerFilter === "Sharp") {
        filters.push('contrast(1.15) brightness(1.02) saturate(1.04)');
      } else if (partnerFilter === "LowLight") {
        filters.push('brightness(1.28) contrast(0.92) saturate(1.12)');
      }
    }
    return filters.length > 0 ? filters.join(' ') : 'none';
  };

  const applyFilterAndMask = (filterId) => {
    // Premium Gating: If not premium, block and open pricing modal
    if (filterId !== "None") {
      const selectedFilterObj = FILTERS_DATA.find(f => f.id === filterId);
      const isPremiumFilter = selectedFilterObj && (
        selectedFilterObj.category === "Premium" ||
        selectedFilterObj.category === "Beauty" ||
        selectedFilterObj.category === "Couple" ||
        ["Devil", "Cat"].includes(filterId)
      );

      if (isPremiumFilter && !user?.premium) {
        setShowPricingModal(true);
        showToast("This premium effect requires a Premium Subscription! Upgrade now to unlock HD quality, better masks, and AI beautify.", "warning", 5000);
        return;
      }
    }

    setActiveMediaPipeFilter(filterId);
    
    // Map MediaPipe filter IDs to CSS fallback mask IDs
    if (filterId === "None") {
      setActiveMask("None");
    } else if (filterId === "Dog") {
      setActiveMask("Doggy");
    } else if (filterId === "Cat") {
      setActiveMask("Cat");
    } else if (filterId === "Devil") {
      setActiveMask("Devil");
    } else if (filterId === "Crown") {
      setActiveMask("Crown");
    } else if (filterId === "Angel") {
      setActiveMask("Angel");
    } else if (filterId === "Ghost") {
      setActiveMask("Ghost");
    } else if (filterId === "Glasses") {
      setActiveMask("Glass");
    } else if (filterId === "Neon") {
      setActiveMask("Neon");
    } else {
      setActiveMask("None");
    }
  };

  // Sync temporary selection states with active values when menu opens
  useEffect(() => {
    if (activeIdentityMenu === 'filters') {
      setSelectedTempFilter(activeMediaPipeFilter);
    } else if (activeIdentityMenu === 'avatars') {
      setSelectedTempAvatar(activeAvatar);
    } else if (activeIdentityMenu === 'voice') {
      setSelectedTempVoice(activeVoice);
    }
  }, [activeIdentityMenu, activeMediaPipeFilter, activeAvatar, activeVoice]);

  // Handle two-stage Apply click
  const handleApplyIdentityChanges = () => {
    if (activeIdentityMenu === 'filters') {
      applyFilterAndMask(selectedTempFilter);
    } else if (activeIdentityMenu === 'avatars') {
      setActiveAvatar(selectedTempAvatar);
    } else if (activeIdentityMenu === 'voice') {
      applyVoiceFilter(selectedTempVoice);
    }
    setActiveIdentityMenu(null); // Close the popup bubble after applying
  };

  // Audio processing refs
  const audioCtx = useRef(null);
  const sourceNode = useRef(null);
  const pitchNode = useRef(null);
  const destinationNode = useRef(null);
  const processedAudioTrackRef = useRef(null);

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
      let isPremiumUser = false;

      // 0. QUICK PROFILE LOAD FROM CACHE
      const savedUser = sessionStorage.getItem("user");
      if (savedUser) {
        try {
          const u = JSON.parse(savedUser);
          if (u.email?.toLowerCase() === "ds9376314@gmail.com") {
            u.premium = true;
            u.planName = "VIP Elite";
          }
          if (u.premium) isPremiumUser = true;
          setUser(u);
          if (u.unlockedFilters) setUnlockedFilters(u.unlockedFilters);
          setAuthLoading(false); // Stop loading immediately if we have a profile
          console.log("Profile loaded from cache instantly, premium status:", isPremiumUser);
        } catch(e) {}
      }

      const token = sessionStorage.getItem("token");

      // 1. Auth Logic
      if (session) {
        if (!token || token === "undefined") {
          try {
            const referralCode = localStorage.getItem("referral") || undefined;
            const res = await axios.post("https://meetzone-backend.onrender.com/api/auth/session-login", {
              email: session.user.email,
              name: session.user.name,
              referralCode
            });
            if (res.data.token) {
              sessionStorage.setItem("token", res.data.token);
              sessionStorage.setItem("user", JSON.stringify(res.data.user));
              localStorage.removeItem("referral");
              let userData = res.data.user;
              if (userData.email?.toLowerCase() === "ds9376314@gmail.com") {
                userData.premium = true;
                userData.planName = "VIP Elite";
              }
              if (userData.premium) isPremiumUser = true;
              setUser(userData);
              if (userData.unlockedFilters) setUnlockedFilters(userData.unlockedFilters);

              if (!userData.gender || userData.gender === "All" || !userData.country || userData.country === "All" || userData.gender === "Other" || userData.country === "Unknown") {
                router.push("/");
                return;
              }
            }
          } catch (e) {
            console.error("Sync Error", e);
          }
        } else {
          try {
            const res = await axios.get("https://meetzone-backend.onrender.com/api/auth/verify", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.valid) {
              let userData = res.data.user;
              if (userData.email?.toLowerCase() === "ds9376314@gmail.com") {
                userData.premium = true;
                userData.planName = "VIP Elite";
              }
              if (userData.premium) isPremiumUser = true;
              setUser(userData);
              if (userData.unlockedFilters) setUnlockedFilters(userData.unlockedFilters);
              sessionStorage.setItem("user", JSON.stringify(userData));

              if (!userData.gender || userData.gender === "All" || !userData.country || userData.country === "All" || userData.gender === "Other" || userData.country === "Unknown") {
                router.push("/");
                return;
              }
            }
          } catch (e) {
            console.error("Verify Error", e);
          }
        }
        setAuthLoading(false);
      } else if (token && token !== "undefined") {
        try {
          const res = await axios.get("https://meetzone-backend.onrender.com/api/auth/verify", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data.valid) {
            let userData = res.data.user;
            if (userData.email?.toLowerCase() === "ds9376314@gmail.com") {
              userData.premium = true;
              userData.planName = "VIP Elite";
            }
            if (userData.premium) isPremiumUser = true;
            setUser(userData);
            if (userData.unlockedFilters) {
              setUnlockedFilters(userData.unlockedFilters);
            }
            sessionStorage.setItem("user", JSON.stringify(userData));

            // Check for incomplete profile
            if (!userData.gender || userData.gender === "All" || !userData.country || userData.country === "All" || userData.gender === "Other" || userData.country === "Unknown") {
              router.push("/");
              return;
            }
          } else {
            setAuthError("Session invalid. Please login again.");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
            router.push("/login");
          }
        } catch (err) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
          setUser(null);
          router.push("/login");
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
        const videoConstraints = isPremiumUser ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        } : {
          width: { ideal: 640, max: 960 },
          height: { ideal: 480, max: 540 },
          frameRate: { ideal: 20, max: 20 }
        };

        console.log("Negotiated camera constraints loaded based on plan:", isPremiumUser, videoConstraints);
        streamInstance = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: true,
        });
        if (localVideo.current) {
          localVideo.current.srcObject = streamInstance;
        }
      } catch (err) {
        console.warn("Error accessing media devices with ideal constraints, trying standard fallback.", err);
        try {
          streamInstance = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          if (localVideo.current) {
            localVideo.current.srcObject = streamInstance;
          }
        } catch (fbErr) {
          console.error("Camera access failed completely.", fbErr);
          setStatus("Please allow camera/mic access");
        }
      }

      // 4. AI Guard: Multi-Layer Hybrid NSFW Detection (NSFWJS Client-Side + Hive AI Backend-Side Verification)
      const initNSFW = async () => {
        try {
          await tf.ready();
          nsfwModel.current = await nsfwjs.load();
          console.log("NSFW Guardian active.");
          
          const checkVideo = async () => {
            if (localVideo.current && localVideo.current.readyState === 4 && socket && socket.connected) {
              try {
                // 1. LIGHTWEIGHT MOTION DETECTION (Save user CPU by skipping scans if stream is static/idle)
                let hasMotion = true;
                try {
                  const mCanvas = document.createElement("canvas");
                  mCanvas.width = 32;
                  mCanvas.height = 24;
                  const mCtx = mCanvas.getContext("2d");
                  mCtx.drawImage(localVideo.current, 0, 0, 32, 24);
                  const imgData = mCtx.getImageData(0, 0, 32, 24).data;

                  if (!prevFramePixelsRef.current) {
                    prevFramePixelsRef.current = imgData;
                  } else {
                    let totalDiff = 0;
                    const len = imgData.length;
                    for (let i = 0; i < len; i += 4) {
                      const currentIntensity = (imgData[i] + imgData[i+1] + imgData[i+2]) / 3;
                      const prevIntensity = (prevFramePixelsRef.current[i] + prevFramePixelsRef.current[i+1] + prevFramePixelsRef.current[i+2]) / 3;
                      totalDiff += Math.abs(currentIntensity - prevIntensity);
                    }
                    prevFramePixelsRef.current = imgData;
                    const avgDiff = totalDiff / (32 * 24);
                    // If average shift is less than 3 units, video is static/idle (no motion)
                    hasMotion = avgDiff > 3;
                  }
                } catch (e) {
                  // Fallback to active motion on error
                }

                if (!hasMotion) {
                  // Video is frozen or static, skip heavy model execution to conserve CPU
                  setTimeout(checkVideo, 3000);
                  return;
                }

                // 2. FACE DETECTION STATUS
                const faceDetected = isFaceDetectedRef.current;

                // 3. HEAVY NSFWJS LOCAL CLASSIFICATION (only triggered if motion exists)
                const predictions = await nsfwModel.current.classify(localVideo.current);
                
                const porn = predictions.find(p => p.className === "Porn");
                const hentai = predictions.find(p => p.className === "Hentai");
                const sexy = predictions.find(p => p.className === "Sexy");
                
                const pornProb = porn ? porn.probability : 0;
                const hentaiProb = hentai ? hentai.probability : 0;
                const sexyProb = sexy ? sexy.probability : 0;

                // Soft trigger threshold of 0.65 for any suspicious visual category
                const isSuspicious = pornProb > 0.65 || hentaiProb > 0.65 || sexyProb > 0.65;

                if (isSuspicious) {
                  console.warn(`[NSFWJS SOFT TRIG] Suspicious frame (Porn: ${pornProb.toFixed(2)}, Hentai: ${hentaiProb.toFixed(2)}, Sexy: ${sexyProb.toFixed(2)}, FacePresent: ${faceDetected}). Requesting backend Hive AI verification...`);
                  
                  // 1. Show notification
                  showToast("⚠️ Inappropriate content detected! If you repeat this, your account will be banned for 1 day. Auto-skipping...", "error", 6000);

                  // 2. Auto-blur local stream instantly on the frontend as a soft precaution while verifying
                  setIsFaceBlurred(true);
                  if (socket) {
                    socket.emit("partner-effect", { type: "blur", value: true });
                  }

                  // 3. Auto-skip the partner (only if actively connected to someone)
                  if (socket && partnerIdRef.current) {
                    socket.emit("next");
                  }

                  // 4. Unblur after 5 seconds
                  setTimeout(() => {
                    setIsFaceBlurred(false);
                    if (socket) {
                      socket.emit("partner-effect", { type: "blur", value: false });
                    }
                  }, 5000);

                  // Capture the exact video frame as base64 JPEG
                  let screenshot = null;
                  try {
                    const canvas = document.createElement("canvas");
                    canvas.width = localVideo.current.videoWidth || 320;
                    canvas.height = localVideo.current.videoHeight || 240;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(localVideo.current, 0, 0, canvas.width, canvas.height);
                    screenshot = canvas.toDataURL("image/jpeg", 0.65);
                  } catch (e) {
                    console.error("Failed to capture screenshot for Hive AI verification:", e);
                  }

                  if (screenshot) {
                    socket.emit("nsfw-suspicious-verify", { screenshot });
                  }
                }
              } catch (e) {
                console.error("Error running client classification:", e);
              }
            }
            // Repeat every 3 seconds to protect CPU and bandwidth
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
        const storedUser = sessionStorage.getItem("user");
        if (storedUser) {
          const profile = JSON.parse(storedUser);

          // Register online status so friends see this user as ONLINE from any page
          if (profile.id) {
            socket.emit("register-user", profile.id);
          }

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
        showToast(msg, "warning", 5000);
      });

      socket.on("nsfw-strike-alert", ({ strikes, maxStrikes, reason }) => {
        // 1. Show notification
        showToast("⚠️ Inappropriate content detected! If you repeat this, your account will be banned for 1 day. Auto-skipping...", "error", 6000);

        // 2. Blur screen
        setIsFaceBlurred(true);
        if (socket) {
          socket.emit("partner-effect", { type: "blur", value: true });
        }
        
        // 3. System message
        setMessages(prev => [...prev, { sender: "system", text: `⚠️ [Safety Alert]: AI detected safety violation (${reason}). Strike ${strikes}/${maxStrikes} registered.` }]);

        // 4. Auto-skip partner
        socket.emit("next");

        // 5. Unblur after 5 seconds
        setTimeout(() => {
          setIsFaceBlurred(false);
          if (socket) {
            socket.emit("partner-effect", { type: "blur", value: false });
          }
        }, 5000);
      });

      socket.on("banned-alert", (data) => {
        // Support both old string format and new { reason, screenshot } object format
        const reason = typeof data === "object" ? (data.reason || "Your account has been banned for violating our safety terms.") : data;
        const screenshot = typeof data === "object" ? (data.screenshot || null) : null;

        // Clear session data
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        // Show the beautiful ban screen
        setBanInfo({ reason, screenshot });
      });

      socket.on("receive-sticker", ({ stickerIcon, senderName, amount, newTotalCoins }) => {
        setReceivedGift({ icon: stickerIcon, from: senderName, amount, isSender: false });
        setMessages(prev => [...prev, { sender: 'system', text: `${senderName} sent you a ${stickerIcon} gift (+${amount} coins!)` }]);

        // INSTANT 1-SECOND COIN BALANCE SYNC FOR RECIPIENT
        if (newTotalCoins !== undefined) {
          setUser(prev => {
            const updated = { ...prev, coins: newTotalCoins };
            sessionStorage.setItem("user", JSON.stringify(updated));
            return updated;
          });
        }

        // Auto clear after 4 seconds
        setTimeout(() => setReceivedGift(null), 4000);
      });

      // Real-time socket gift display (complement to receive-sticker from backend)
      socket.on("receive-gift-from-partner", ({ stickerIcon, senderName, amount }) => {
        setReceivedGift(prev => prev ? prev : { icon: stickerIcon, from: senderName, amount, isSender: false });
        setTimeout(() => setReceivedGift(null), 4000);
      });

      socket.on("incoming-direct-call", (callInfo) => {
        setIncomingCall(callInfo);
      });

      socket.on("direct-call-accepted", ({ roomId }) => {
        router.push(`/chat?room=${roomId}`);
      });

      socket.on("direct-call-rejected", () => {
        showToast("Call was declined.", "info");
      });


      socket.on("matched", async ({ partnerId, initiator, partnerInfo }) => {
        setPartnerId(partnerId);
        setPartnerInfo(partnerInfo);
        setShowPartnerPreview(true);
        setStatus("Partner Found!");
        setMessages([]);
        iceCandidatesQueue.current = [];
        createPeer(partnerId);

        // BULLETPROOF EFFECT SYNCING (using refs to avoid stale closure values)
        setTimeout(() => {
          if (socket) {
            console.log("[Matched] Force syncing current local effects with partner...", activeAvatarRef.current, isFaceBlurredRef.current);
            socket.emit("partner-effect", { type: 'blur', value: isFaceBlurredRef.current });
            socket.emit("partner-effect", { type: 'avatar', value: activeAvatarRef.current });
            socket.emit("partner-effect", { type: 'mask', value: activeMaskRef.current });
            socket.emit("partner-effect", { type: 'filter', value: activeFilterRef.current });
            socket.emit("partner-effect", { type: 'voice', value: activeVoiceRef.current });
          }
        }, 1000);

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

      socket.on("partner-reconnecting", () => {
        setStatus("Partner connection unstable. Reconnecting...");
      });

      socket.on("partner-disconnected", () => {
        // Instantly clear the partner's video feed so frozen frame doesn't linger
        if (remoteVideo.current && remoteVideo.current.srcObject) {
          remoteVideo.current.srcObject.getTracks().forEach(track => track.stop());
          remoteVideo.current.srcObject = null;
        }
        setPartnerId(null);
        setPartnerInfo(null);
        setPartnerAvatar("None");
        setPartnerIsBlurred(false);
        setPartnerMask("None");
        setPartnerFilter("None");
        setPartnerVoice("Normal");
        setFriendReqStatus(false);
        setShowPartnerPreview(false);
        setPartnerMicOn(true);
        setPartnerCameraOn(true);
        setStatus("Partner disconnected. Searching...");
        socket.emit("next");
      });

      socket.on("partner-stopped", () => {
        // Instantly clear the partner's video feed
        if (remoteVideo.current && remoteVideo.current.srcObject) {
          remoteVideo.current.srcObject.getTracks().forEach(track => track.stop());
          remoteVideo.current.srcObject = null;
        }
        setPartnerId(null);
        setPartnerInfo(null);
        setPartnerAvatar("None");
        setPartnerIsBlurred(false);
        setPartnerMask("None");
        setPartnerFilter("None");
        setPartnerVoice("Normal");
        setFriendReqStatus(false);
        setShowPartnerPreview(false);
        setPartnerMicOn(true);
        setPartnerCameraOn(true);
        setStatus("Partner stopped. Searching...");
        socket.emit("next");
      });

      // --- QUIZ DUEL / BRAIN CLASH EVENTS ---
      socket.on("quiz-queue-joined", () => {
        setQuizState("queued");
        setQuizError(null);
      });

      socket.on("quiz-queue-left", () => {
        setQuizState("idle");
        setQuizError(null);
      });

      socket.on("quiz-matched", async ({ partnerId, partnerInfo, roomId, initiator }) => {
        setQuizPartnerInfo(partnerInfo);
        setQuizState("countdown");
        setQuizCountdown(3);
        setQuizScores({});
        setQuizSelectedOption(null);
        setQuizResult(null);
        setQuizFinalResult(null);
        setQuizForfeitState(false);
        setQuizLockedOut(false);
        
        // Match standard partner states so WebRTC works out of the box!
        setPartnerId(partnerId);
        setPartnerInfo({ id: partnerInfo.id, name: partnerInfo.name, country: partnerInfo.country || "IN", gender: "all" });

        // BULLETPROOF EFFECT SYNCING (using refs to avoid stale closure values)
        setTimeout(() => {
          if (socket) {
            console.log("[Quiz Matched] Force syncing current local effects with partner...", activeAvatarRef.current, isFaceBlurredRef.current);
            socket.emit("partner-effect", { type: 'blur', value: isFaceBlurredRef.current });
            socket.emit("partner-effect", { type: 'avatar', value: activeAvatarRef.current });
            socket.emit("partner-effect", { type: 'mask', value: activeMaskRef.current });
            socket.emit("partner-effect", { type: 'filter', value: activeFilterRef.current });
            socket.emit("partner-effect", { type: 'voice', value: activeVoiceRef.current });
          }
        }, 1000);

        // Join WebRTC peer connection immediately!
        if (initiator) {
          setTimeout(() => {
            createPeer(partnerId);
          }, 500);
        }
      });

      socket.on("quiz-countdown", (num) => {
        setQuizCountdown(num);
        if (num === 0) {
          setQuizState("active");
        }
      });

      socket.on("quiz-question", (q) => {
        setQuizState("active");
        setQuizQuestion(q);
        setQuizSelectedOption(null);
        setQuizResult(null);
        setQuizLockedOut(false);
        setQuizTimeLeft(15);
      });

      socket.on("quiz-answer-result", ({ playerId, selectedOption, correct, scoreGained, speedBonus, totalScores, correctAnswer, lockout, endedForBoth }) => {
        setQuizScores(totalScores);
        
        if (lockout) {
          if (playerId === socket.id) {
            setQuizLockedOut(true);
            setQuizResult({ text: "❌ Wrong answer! You are locked out for this question.", type: "wrong" });
          } else {
            setQuizResult({ text: "💡 Opponent got it wrong! Now's your chance!", type: "opportunity" });
          }
        } else {
          if (correct) {
            const isSelf = playerId === socket.id;
            setQuizResult({
              text: isSelf 
                ? `✅ Correct! +${scoreGained} points! ${speedBonus ? "⚡ Speed Bonus!" : ""}`
                : `💥 Opponent got it correct! +${scoreGained} points!`,
              type: isSelf ? "correct" : "opponent-correct"
            });
          } else if (endedForBoth) {
            setQuizResult({ text: `❌ Both got it wrong! Correct: ${correctAnswer}`, type: "wrong" });
          }
        }
      });

      socket.on("quiz-question-timeout", ({ correctAnswer }) => {
        setQuizResult({ text: `⏰ Time's up! Correct answer: ${correctAnswer}`, type: "timeout" });
      });

      socket.on("quiz-finished", (result) => {
        setQuizState("finished");
        setQuizFinalResult(result);
        
        // Sync local coins balance
        const myUserId = user?.id || (typeof window !== "undefined" && sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user")).id : "");
        const isDraw = result.draw;
        const isWinner = result.winnerId === myUserId;
        
        if (isDraw) {
          setDareChoiceStep("none");
          setUser(prev => {
            const updated = { ...prev, coins: (prev.coins || 0) + 50 };
            sessionStorage.setItem("user", JSON.stringify(updated));
            return updated;
          });
        } else if (isWinner) {
          setDareChoiceStep("waiting-loser");
          setUser(prev => {
            const updated = { ...prev, coins: (prev.coins || 0) + 100 };
            sessionStorage.setItem("user", JSON.stringify(updated));
            return updated;
          });
        } else {
          setDareChoiceStep("loser-deciding");
        }
      });

      socket.on("quiz-partner-disconnected", () => {
        setQuizForfeitState(true);
        setQuizState("finished");
        setQuizFinalResult({
          draw: false,
          winnerId: (user?.id || (typeof window !== "undefined" && sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user")).id : "")),
          forfeit: true,
          message: "Opponent disconnected! You win 100 coins by forfeit!"
        });
        
        setUser(prev => {
          const updated = { ...prev, coins: (prev.coins || 0) + 100 };
          sessionStorage.setItem("user", JSON.stringify(updated));
          return updated;
        });
      });

      socket.on("quiz-error", ({ message }) => {
        setQuizError(message);
        setQuizState("idle");
        showToast(message, "error");
      });

      socket.on("coins-updated", (newCoins) => {
        setUser(prev => {
          if (!prev) return prev;
          const updated = { ...prev, coins: newCoins };
          sessionStorage.setItem("user", JSON.stringify(updated));
          return updated;
        });
      });

      socket.on("quiz-dare-accepted-by-opponent", () => {
        setDareChoiceStep("winner-deciding");
      });

      socket.on("quiz-stay-connected-success", () => {
        setQuizState("idle");
        setQuizFinalResult(null);
        setDareChoiceStep("none");
      });

      socket.on("quiz-connection-closed", () => {
        setQuizState("idle");
        setQuizFinalResult(null);
        setDareChoiceStep("none");
        nextPartner();
      });

      socket.on("partner-mic-state", ({ enabled }) => {
        setPartnerMicOn(enabled);
      });

      socket.on("partner-camera-state", ({ enabled }) => {
        setPartnerCameraOn(enabled);
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

  useEffect(() => {
    let timer = null;
    if (quizState === "active" && quizTimeLeft > 0 && !quizResult) {
      timer = setInterval(() => {
        setQuizTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizState, quizTimeLeft, quizResult]);

  const createPeer = (partner) => {
    peerConnection.current = new RTCPeerConnection(servers);
    const stream = localVideo.current.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => {
        if (track.kind === 'audio' && processedAudioTrackRef.current) {
          peerConnection.current.addTrack(processedAudioTrackRef.current, stream);
          console.log("[createPeer] Added voice-filtered audio track to peerConnection:", activeVoice);
        } else {
          peerConnection.current.addTrack(track, stream);
        }
      });
    }

    peerConnection.current.ontrack = (event) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
        // Short delay to ensure video is ready
        setTimeout(() => {
          setShowPartnerPreview(false);
          setStatus("Connected");
        }, 200);
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

    // Dynamic Bitrate Adjustment (Smart Bitrate Negotiation)
    const localPremium = user?.premium || false;
    const partnerPremium = partnerInfo?.premium || false;
    // Both Premium = 2 Mbps (high quality). Either is Free = 600 kbps (mixed/conserved)
    const targetBitrateBps = (localPremium && partnerPremium) ? 2000000 : 600000;

    setTimeout(() => {
      if (peerConnection.current) {
        const senders = peerConnection.current.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === "video");
        if (videoSender) {
          try {
            const parameters = videoSender.getParameters();
            if (!parameters.encodings) {
              parameters.encodings = [{}];
            }
            if (parameters.encodings.length > 0) {
              parameters.encodings[0].maxBitrate = targetBitrateBps;
              videoSender.setParameters(parameters)
                .then(() => {
                  console.log(`[Smart Bitrate] Configured outbound video encoding bitrate to ${targetBitrateBps / 1000} kbps. (Local premium: ${localPremium}, Partner premium: ${partnerPremium})`);
                })
                .catch(err => {
                  console.error("[Smart Bitrate] Failed to set RTCRtpSender parameters:", err);
                });
            }
          } catch (e) {
            console.error("[Smart Bitrate] Failed to get RTCRtpSender parameters:", e);
          }
        }
      }
    }, 1500);
  };

  const closeConnection = () => {
    // Instantly stop & clear remote video to prevent frozen frame
    if (remoteVideo.current && remoteVideo.current.srcObject) {
      remoteVideo.current.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.current.srcObject = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setPartnerId(null);
    setPartnerInfo(null);
    setPartnerMicOn(true);
    setPartnerCameraOn(true);
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
      showToast("⚠️ Your message contains restricted words. Please maintain a respectful environment.", "warning", 5000);
      return;
    }

    if (message.trim() && partnerId) {
      // DEDUCT 5 COINS ONLY IF NOT FRIENDS
      if (!partnerInfo?.isFriend && user?.email?.toLowerCase() !== "ds9376314@gmail.com") {
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
      const token = sessionStorage.getItem("token");
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
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Not enough coins to send message!", "warning");
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

  const handleBrainClashClick = () => {
    if (quizState === "queued") {
      socket?.emit("leave-quiz-queue");
    } else {
      setShowQuizRoomsModal(true);
    }
  };

  const joinQuizRoom = (category) => {
    if (partnerId) {
      stopMatching();
    }
    socket?.emit("join-quiz-queue", { category });
    setShowQuizRoomsModal(false);
  };

  const purchaseFilter = async (filter) => {
    if (unlockedFilters.includes(filter.id)) {
      applyFilterAndMask(filter.id);
      return;
    }

    if (user.coins < filter.cost) {
      showToast("Not enough coins to unlock this filter!", "warning");
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
          applyFilterAndMask(filter.id);
          const updatedUser = { ...user, coins: res.data.coins, unlockedFilters: updatedFilters };
          setUser(updatedUser);
          sessionStorage.setItem("user", JSON.stringify(updatedUser));
          showToast(`${filter.name} unlocked!`, "success");
        }
      } catch (err) {
        showToast("Failed to purchase filter.", "error");
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
        if (socket) {
          socket.emit("mic-state-change", { enabled: audioTrack.enabled });
        }
      }
    }
  };

  const applyVoiceFilter = async (voice) => {
    setActiveVoice(voice);
    if (!localVideo.current.srcObject) return;

    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.current.state === 'suspended') {
      await audioCtx.current.resume();
    }

    if (voice === "Normal") {
      processedAudioTrackRef.current = null;
      // Revert to original raw mic track for the remote peer
      if (peerConnection.current && localVideo.current?.srcObject) {
        const senders = peerConnection.current.getSenders();
        const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
        if (audioSender) {
          audioSender.replaceTrack(localVideo.current.srcObject.getAudioTracks()[0]);
        }
      }
      return;
    }

    // Basic Pitch Shifting Logic Simulation / Web Audio Effect Node Setup
    if (sourceNode.current) sourceNode.current.disconnect();

    sourceNode.current = audioCtx.current.createMediaStreamSource(localVideo.current.srcObject);
    const dest = audioCtx.current.createMediaStreamDestination();

    if (voice === "Echo") {
      // High-quality dry/wet echo filter loop
      const delayNode = audioCtx.current.createDelay(1.0);
      delayNode.delayTime.value = 0.3; // 300ms delay time

      const feedbackNode = audioCtx.current.createGain();
      feedbackNode.gain.value = 0.4; // feedback volume

      const dryGain = audioCtx.current.createGain();
      dryGain.gain.value = 1.0;

      const wetGain = audioCtx.current.createGain();
      wetGain.gain.value = 0.6;

      // Dry path (original voice)
      sourceNode.current.connect(dryGain);
      dryGain.connect(dest);

      // Wet path (echo delay loop)
      sourceNode.current.connect(delayNode);
      delayNode.connect(feedbackNode);
      feedbackNode.connect(delayNode); // feedback loop
      
      feedbackNode.connect(wetGain);
      wetGain.connect(dest);
    } else {
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
      filter.connect(dest);
    }
    
    // Save processed track ref
    processedAudioTrackRef.current = dest.stream.getAudioTracks()[0];

    // Replace the audio track in the peerConnection so the partner HEARS it
    if (peerConnection.current) {
      const senders = peerConnection.current.getSenders();
      const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
      if (audioSender) {
        audioSender.replaceTrack(dest.stream.getAudioTracks()[0]);
      }
    }
  };

  const toggleCamera = () => {
    const stream = localVideo.current.srcObject;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
        if (socket) {
          socket.emit("camera-state-change", { enabled: videoTrack.enabled });
        }
      }
    }
  };

  const handleFilterChange = (type, value) => {
    const isOwner = user?.email?.toLowerCase() === "ds9376314@gmail.com";
    if (!user?.premium && !isOwner) {
      setShowPricingModal(true);
      return;
    }
    // Feature Gating: Only VIP Elite (or ds9376314@gmail.com) can use age and state filters
    const isElite = (user?.premium && (user?.planName?.toLowerCase().includes("elite") || user?.planName?.toLowerCase().includes("vip"))) || isOwner;
    if ((type === "age" || type === "state" || type === "stateProv") && !isElite) {
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
      showToast("⚠️ Payment Error: Payment gateway is not connected. Please contact support or try again later.", "error", 6000);
    }
  };

  const handleRazorpayPayment = async (plan) => {
    handleTestPayment();
  };

  const selectedCountry = country === "all" ? { name: "Worldwide", flag: "🌎" } : Country.getCountryByCode(country);
  const selectedGender = GENDERS.find(g => g.id === gender);

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
        {/* Animated background particles */}
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
              animation: `float ${Math.random() * 6 + 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`
            }} />
          ))}
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
          @keyframes float {
            0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
            50% { transform: translateY(-30px) scale(1.2); opacity: 0.8; }
          }
          @keyframes pulse-red {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
            50% { box-shadow: 0 0 0 20px rgba(239,68,68,0); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .ban-card { animation: fadeInUp 0.6s ease-out; }
          .ban-icon { animation: pulse-red 2s ease-in-out infinite; }
          .ban-header-text { animation: shake 0.6s ease-in-out 0.3s; }
        `}</style>

        <div className="ban-card" style={{
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
          {/* Ban Icon */}
          <div className="ban-icon" style={{
            width: "96px", height: "96px",
            background: "linear-gradient(135deg, #ef4444, #b91c1c)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "48px"
          }}>
            🚫
          </div>

          {/* Header */}
          <div className="ban-header-text">
            <h1 style={{
              color: "#ef4444",
              fontSize: "28px",
              fontWeight: 800,
              margin: "0 0 8px",
              letterSpacing: "-0.5px"
            }}>Account Banned</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 28px" }}>
              Your ZoneMeet account has been suspended
            </p>
          </div>

          {/* Reason Box */}
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
                <p style={{ color: "#fca5a5", fontSize: "15px", lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                  {banInfo.reason}
                </p>
              </div>
            </div>
          </div>

          {/* Screenshot Evidence (if NSFW ban) */}
          {banInfo.screenshot && (
            <div style={{ marginBottom: "24px" }}>
              <p style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "12px"
              }}>📸 Detected Content Screenshot</p>
              <div style={{
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
                border: "2px solid rgba(239,68,68,0.4)"
              }}>
                <img
                  src={banInfo.screenshot}
                  alt="Violation evidence"
                  style={{
                    width: "100%",
                    height: "180px",
                    objectFit: "cover",
                    display: "block",
                    filter: "blur(8px) brightness(0.5)"
                  }}
                />
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexDirection: "column", gap: "8px"
                }}>
                  <span style={{ fontSize: "32px" }}>🔞</span>
                  <p style={{ color: "#fca5a5", fontSize: "12px", fontWeight: 600, margin: 0 }}>Inappropriate Content Detected</p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", margin: 0 }}>This evidence has been recorded by AI Guardian</p>
                </div>
              </div>
            </div>
          )}

          {/* Appeal Info */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "28px",
            textAlign: "left"
          }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", lineHeight: 1.7, margin: 0 }}>
              🛡️ Our AI Guardian system detected a violation of ZoneMeet's safety guidelines.
              If you believe this is a mistake, please contact us at <span style={{ color: "#818cf8" }}>support@zonemeet.chat</span>
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              setBanInfo(null);
              if (typeof window !== "undefined") {
                window.location.href = "/login";
              }
            }}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #ef4444, #b91c1c)",
              border: "none",
              borderRadius: "12px",
              color: "white",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.3px",
              transition: "opacity 0.2s"
            }}
            onMouseOver={e => e.target.style.opacity = "0.85"}
            onMouseOut={e => e.target.style.opacity = "1"}
          >
            Return to Login Page
          </button>
        </div>
      </div>
    );
  }
  // ====================================================

  return (
    <>
      <div className="container chat-page-v2">
        <Head>
          <title>Live Video Chat | ZoneMeet</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js" crossorigin="anonymous"></script>
          <script src="https://cdn.jsdelivr.net/npm/jeelizfacefilter/dist/jeelizFaceFilter.js" crossorigin="anonymous"></script>
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
          <div className="brand" onClick={() => router.push("/")} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div className="logo-icon-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 32 32" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="5" width="20" height="20" rx="6" fill="url(#brand-grad)" />
              <path d="M22 11L28 7V23L22 19V11Z" fill="url(#brand-grad)" />
              <path d="M9 11H15L9 19H15" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="brand-grad" x1="2" y1="5" x2="28" y2="25" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2563eb" />
                    <stop offset="0.5" stopColor="#a855f7" />
                    <stop offset="1" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="logo-text" style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', letterSpacing: '-0.02em' }}>
              <span style={{ color: '#ffffff' }}>Zone</span>
              <span style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Meet</span>
            </h1>
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '50px',
              padding: '4px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: '900',
              color: '#f87171',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)'
            }}>
              <span>🔞</span>
              <span style={{ letterSpacing: '0.05em' }}>18+ ONLY</span>
            </div>
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

            <button className="btn-home" onClick={() => { fetchHistory(); setShowHistoryModal(true); }} style={{ marginRight: '6px' }}>
              <span className="icon">🕒</span>
              <span className="text">History</span>
            </button>

            <button className="btn-home" onClick={() => router.push("/")}>
              <span className="icon">🏠</span>
              <span className="text">Home</span>
            </button>
          </div>
        </div>

        <div className="main-layout">
          <div className="video-column">
            <div className="filters-row-v2" style={{ justifyContent: 'space-between', padding: '2px 0', alignItems: 'center' }}>
              <button 
                className="filter-settings-trigger-btn" 
                onClick={() => {
                  setTempGender(gender);
                  setTempCountry(country);
                  setTempStateProv(stateProv);
                  setTempAge(age);
                  setShowFilterModal(true);
                }}
              >
                <span className="icon">⚙️</span>
                <span className="text">Preferences</span>
                <div className="active-filters-preview-badge">
                  {gender !== 'all' || country !== 'all' || age !== 'all' || stateProv !== 'All States' ? 'Active 🎯' : 'All 🌎'}
                </div>
              </button>

              {!user?.premium && (
                <div className="paywall-badge-v2" onClick={() => setShowPricingModal(true)} style={{ margin: 0 }}>
                  <span>✨ Unlock</span>
                </div>
              )}
            </div>

            {/* PREMIUM FILTER SETTINGS MODAL */}
            {showFilterModal && (
              <div className="filter-modal-overlay">
                <div className="filter-modal-card">
                  <div className="filter-modal-header">
                    <h2>🎯 Matchmaking Preferences</h2>
                    <button className="close-btn" onClick={() => setShowFilterModal(false)}>×</button>
                  </div>
                  
                  <div className="filter-modal-body">
                    {/* 1. GENDER SELECTION */}
                    <div className="filter-section-group">
                      <label className="section-label">Preferred Gender</label>
                      <div className="gender-options-grid">
                        {GENDERS.map(g => (
                          <div
                            key={g.id}
                            className={`gender-option-card ${tempGender === g.id ? 'active' : ''}`}
                            onClick={() => {
                              const storedUser = typeof window !== "undefined" && sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user")) : null;
                              const currentUser = user || storedUser;
                              const isOwner = currentUser?.email?.toLowerCase() === "ds9376314@gmail.com";
                              if (g.id !== "all" && !currentUser?.premium && !isOwner) {
                                setShowPricingModal(true);
                                return;
                              }
                              setTempGender(g.id);
                            }}
                          >
                            <span className="emoji">{g.icon}</span>
                            <span className="name">{g.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2. COUNTRY SELECTION */}
                    <div className="filter-section-group">
                      <label className="section-label">Preferred Country (Premium Feature)</label>
                      <div className="select-dropdown-trigger" onClick={(e) => {
                        const storedUser = typeof window !== "undefined" && sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user")) : null;
                        const currentUser = user || storedUser;
                        const isOwner = currentUser?.email?.toLowerCase() === "ds9376314@gmail.com";
                        if (!currentUser?.premium && !isOwner) {
                          setShowPricingModal(true);
                          return;
                        }
                        const nextState = !showCountryDrop;
                        setShowCountryDrop(nextState);
                        if (nextState) {
                          setTimeout(() => {
                            e.currentTarget.closest('.filter-section-group')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 120);
                        }
                      }}>
                        <span className="val-icon">
                          {tempCountry === "all" ? "🌎" : Country.getCountryByCode(tempCountry)?.flag}
                        </span>
                        <span className="val-text">
                          {tempCountry === "all" ? "Worldwide" : Country.getCountryByCode(tempCountry)?.name}
                        </span>
                        <span className="arrow">▼</span>
                      </div>
                      {showCountryDrop && (
                        <div className="filter-dropdown-menu">
                          <div className="search-box">
                            <input
                              placeholder="Search country..."
                              autoFocus
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                            />
                          </div>
                          <div className="items-list">
                            <div className={`dropdown-item ${tempCountry === "all" ? "active" : ""}`} onClick={() => {
                              setTempCountry("all");
                              setTempStateProv("All States");
                              setShowCountryDrop(false);
                            }}>
                              <span className="icon">🌎</span> Worldwide
                            </div>
                            {Country.getAllCountries().filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map(c => (
                              <div key={c.isoCode} className={`dropdown-item ${tempCountry === c.isoCode ? "active" : ""}`} onClick={() => {
                                setTempCountry(c.isoCode);
                                setTempStateProv("All States");
                                setShowCountryDrop(false);
                              }}>
                                <span className="icon">{c.flag}</span> {c.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. STATE / PROVINCE SELECTION */}
                    <div className="filter-section-group">
                      <label className="section-label">State / Province (VIP Elite Premium Feature)</label>
                      <div className="select-dropdown-trigger" onClick={(e) => {
                        const storedUser = typeof window !== "undefined" && sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user")) : null;
                        const currentUser = user || storedUser;
                        const isOwner = currentUser?.email?.toLowerCase() === "ds9376314@gmail.com";
                        const isElite = (currentUser?.premium && (currentUser?.planName?.toLowerCase().includes("elite") || currentUser?.planName?.toLowerCase().includes("vip"))) || isOwner;
                        if (!isElite) { setShowPricingModal(true); return; }
                        if (tempCountry === "all") { showToast("Please select a country first", "info"); return; }
                        const nextState = !showStateDrop;
                        setShowStateDrop(nextState);
                        if (nextState) {
                          setTimeout(() => {
                            e.currentTarget.closest('.filter-section-group')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 120);
                        }
                      }}>
                        <span className="val-icon">📍</span>
                        <span className="val-text">{tempStateProv}</span>
                        <span className="arrow">▼</span>
                      </div>
                      {showStateDrop && (
                        <div className="filter-dropdown-menu">
                          <div className="items-list">
                            <div className={`dropdown-item ${tempStateProv === "All States" ? "active" : ""}`} onClick={() => {
                              setTempStateProv("All States");
                              setShowStateDrop(false);
                            }}>
                              All States
                            </div>
                            {State.getStatesOfCountry(tempCountry).map(s => (
                              <div key={s.isoCode || s.name} className={`dropdown-item ${tempStateProv === s.name ? "active" : ""}`} onClick={() => {
                                setTempStateProv(s.name);
                                setShowStateDrop(false);
                              }}>
                                {s.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. AGE SELECTION */}
                    <div className="filter-section-group">
                      <label className="section-label">Age Group (VIP Elite Premium Feature)</label>
                      <div className="select-dropdown-trigger" onClick={(e) => {
                        const storedUser = typeof window !== "undefined" && sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user")) : null;
                        const currentUser = user || storedUser;
                        const isOwner = currentUser?.email?.toLowerCase() === "ds9376314@gmail.com";
                        const isElite = (currentUser?.premium && (currentUser?.planName?.toLowerCase().includes("elite") || currentUser?.planName?.toLowerCase().includes("vip"))) || isOwner;
                        if (!isElite) { setShowPricingModal(true); return; }
                        const nextState = !showAgeDrop;
                        setShowAgeDrop(nextState);
                        if (nextState) {
                          setTimeout(() => {
                            e.currentTarget.closest('.filter-section-group')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 120);
                        }
                      }}>
                        <span className="val-icon">🎯</span>
                        <span className="val-text">{tempAge === "all" ? "All Ages" : tempAge}</span>
                        <span className="arrow">▼</span>
                      </div>
                      {showAgeDrop && (
                        <div className="filter-dropdown-menu">
                          <div className="items-list">
                            <div className={`dropdown-item ${tempAge === "all" ? "active" : ""}`} onClick={() => {
                              setTempAge("all");
                              setShowAgeDrop(false);
                            }}>
                              All Ages
                            </div>
                            {AGES.filter(a => a !== "All Ages").map(a => (
                              <div key={a} className={`dropdown-item ${tempAge === a ? "active" : ""}`} onClick={() => {
                                setTempAge(a);
                                setShowAgeDrop(false);
                              }}>
                                {a}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="filter-modal-footer">
                    <button className="apply-btn" onClick={() => {
                      const storedUser = typeof window !== "undefined" && sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user")) : null;
                      const currentUser = user || storedUser;
                      const isOwner = currentUser?.email?.toLowerCase() === "ds9376314@gmail.com";
                      const isElite = (currentUser?.premium && (currentUser?.planName?.toLowerCase().includes("elite") || currentUser?.planName?.toLowerCase().includes("vip"))) || isOwner;

                      // 1. Gender Selection Gating (must be premium for Male or Female)
                      if (tempGender !== "all" && !currentUser?.premium && !isOwner) {
                        setShowPricingModal(true);
                        return;
                      }
                      // 2. Country Selection Gating (must be premium for non-Worldwide)
                      if (tempCountry !== "all" && !currentUser?.premium && !isOwner) {
                        setShowPricingModal(true);
                        return;
                      }
                      // 3. State Selection Gating (must be VIP Elite)
                      if (tempStateProv !== "All States" && !isElite) {
                        setShowPricingModal(true);
                        return;
                      }
                      // 4. Age Group Selection Gating (must be VIP Elite)
                      if (tempAge !== "all" && !isElite) {
                        setShowPricingModal(true);
                        return;
                      }

                      setGender(tempGender);
                      setCountry(tempCountry);
                      setStateProv(tempStateProv);
                      setAge(tempAge);
                      
                      socket?.emit("update-filters", {
                        gender: tempGender,
                        country: tempCountry,
                        age: tempAge,
                        state: tempStateProv
                      });

                      setShowFilterModal(false);
                    }}>
                      🎯 Apply Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* QUIZ ROOMS MODAL */}
            {showQuizRoomsModal && (
              <div className="filter-modal-overlay" onClick={() => setShowQuizRoomsModal(false)}>
                <div className="filter-modal-card quiz-modal-v2" onClick={(e) => e.stopPropagation()}>
                  <div className="filter-modal-header">
                    <h2>🧠 Choose a Quiz Arena</h2>
                    <button className="close-btn" onClick={() => setShowQuizRoomsModal(false)}>×</button>
                  </div>
                  <div className="filter-modal-body">
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.2rem', textAlign: 'center' }}>
                      Entry Fee: 50 Coins. Winner Takes: 100 Coins. 10 Questions, 15 seconds each!
                    </p>
                    
                    <div className="quiz-grid-v2">
                      {[
                        { id: "GK", title: "General Knowledge", icon: "🌍", color: "#6366f1" },
                        { id: "Tech", title: "Tech & Coding", icon: "💻", color: "#10b981" },
                        { id: "Gaming", title: "Gaming", icon: "🎮", color: "#f59e0b" },
                        { id: "Anime", title: "Anime & Manga", icon: "⚔️", color: "#ef4444" },
                        { id: "Movies", title: "Movies & Cinema", icon: "🎬", color: "#8b5cf6" },
                        { id: "Memes", title: "Memes & Culture", icon: "🐸", color: "#14b8a6" },
                        { id: "Football", title: "Football", icon: "⚽", color: "#3b82f6" },
                        { id: "Science", title: "Science", icon: "🔬", color: "#ec4899" }
                      ].map(cat => {
                        const count = quizCategoryStats[cat.id] || 0;
                        return (
                          <button 
                            key={cat.id} 
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: `1px solid ${cat.color}`,
                              padding: '1.2rem',
                              borderRadius: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '10px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              color: '#fff',
                              fontWeight: '700',
                              position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = `rgba(${parseInt(cat.color.slice(1,3),16)},${parseInt(cat.color.slice(3,5),16)},${parseInt(cat.color.slice(5,7),16)},0.15)`;
                              e.currentTarget.style.transform = 'translateY(-3px)';
                              e.currentTarget.style.boxShadow = `0 10px 20px rgba(${parseInt(cat.color.slice(1,3),16)},${parseInt(cat.color.slice(3,5),16)},${parseInt(cat.color.slice(5,7),16)},0.2)`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            onClick={() => joinQuizRoom(cat.id)}
                          >
                            <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', color: '#10b981' }}>
                              <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px #10b981' }}></div>
                              {count} Online
                            </div>
                            <span style={{ fontSize: '2.5rem', marginTop: '10px' }}>{cat.icon}</span>
                            <span style={{ textAlign: 'center' }}>{cat.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={`video-grid-v2 ${quizState === 'active' ? 'quiz-pip-mode' : ''} ${partnerId ? 'partner-connected' : 'searching-mode'}`}>
              <div className={`video-card ${isFaceBlurred ? 'blurred-face' : ''}`}>
                <video
                  ref={localVideo}
                  autoPlay
                  muted
                  playsInline
                  className="mirrored"
                  style={{
                    filter: getCssFilterString(),
                    display: activeAvatar !== "None" ? 'none' : 'block'
                  }}
                />
                <canvas
                  ref={canvasRef}
                  width="640"
                  height="480"
                  className="mirrored"
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

                {!isTrackingFace && activeMask !== "None" && activeAvatar === "None" && (
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
                    {activeVoice && activeVoice !== "Normal" && (
                      <span style={{
                        background: 'rgba(99, 102, 241, 0.2)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        color: '#a5b4fc',
                        padding: '0.15rem 0.6rem',
                        borderRadius: '10px',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        🎙️ {activeVoice}
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
                    <div className="sticker-glow" style={{ background: receivedGift.isSender ? 'rgba(99,102,241,0.6)' : 'rgba(236,72,153,0.6)' }}></div>
                    <div className="sticker-emoji">{receivedGift.icon}</div>
                    <div className="sticker-info">
                      {receivedGift.isSender ? (
                        <>
                          <div className="sticker-sender" style={{ color: '#a5b4fc' }}>🎁 Sent to {partnerInfo?.name || 'Partner'}!</div>
                          <div className="sticker-amount" style={{ color: '#c4b5fd' }}>-{receivedGift.amount} Coins</div>
                        </>
                      ) : (
                        <>
                          <div className="sticker-sender">From {receivedGift.from}</div>
                          <div className="sticker-amount">+{receivedGift.amount} Coins</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}



            <div className="video-card">
              <video
                ref={remoteVideo}
                autoPlay
                playsInline
                className={`natural-view ${partnerIsBlurred ? 'blurred-face' : ''}`}
                style={{
                  filter: getPartnerCssFilterString(),
                  display: partnerAvatar !== "None" ? 'none' : 'block'
                }}
              />
              
              {partnerMask && partnerMask !== "None" && partnerAvatar === "None" && (
                <div className="video-mask-overlay">
                  <div className={`mask-${partnerMask.toLowerCase()}`}></div>
                </div>
              )}

              {/* PARTNER CAMERA OFF PLACEHOLDER */}
              {partnerId && !partnerCameraOn && (
                <div className="partner-camera-off-overlay" style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: '#0f172a',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  gap: '15px',
                  borderRadius: '12px'
                }}>
                  <div className="camera-off-icon" style={{ fontSize: '3rem', animation: 'pulse 2s infinite' }}>🚫</div>
                  <h3 style={{ margin: 0, color: '#f8fafc', fontWeight: 600, fontSize: '1.1rem' }}>Partner's Camera is Off</h3>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>They have temporarily paused their video feed</p>
                </div>
              )}

              {/* SEARCHING OVERLAY */}
              {!partnerId && !showPartnerPreview && (
                <div className="searching-overlay-v2">
                  <div className="searching-ripple"></div>
                  <div className="searching-ripple" style={{ animationDelay: '1s' }}></div>
                  <div className="searching-ripple" style={{ animationDelay: '2s' }}></div>
                  <div className="searching-content">
                    <div className="searching-icon">🔍</div>
                    <h3>Searching for Partner...</h3>
                    <p>Connecting you with someone amazing</p>
                  </div>
                </div>
              )}

              {/* SHARED PARTNER AVATAR */}
              {partnerAvatar && partnerAvatar !== "None" && (
                <div className="avatar-video-replacement partner-avatar-view">
                  <img src={`https://robohash.org/${partnerAvatar}?set=set${partnerAvatar === 'Robot' ? '1' : partnerAvatar === 'Anime' ? '5' : '4'}&key=${partnerAvatar}`} alt="Partner Avatar" />
                </div>
              )}

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
                    {!partnerMicOn && (
                      <span className="mute-highlight" style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        padding: '0.15rem 0.6rem',
                        borderRadius: '10px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        🔇 MUTED
                      </span>
                    )}
                    {partnerVoice && partnerVoice !== "Normal" && (
                      <span style={{
                        background: 'rgba(236, 72, 153, 0.2)',
                        border: '1px solid rgba(236, 72, 153, 0.4)',
                        color: '#f9a8d4',
                        padding: '0.15rem 0.6rem',
                        borderRadius: '10px',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        🎙️ {partnerVoice}
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

            {/* QUIZ DUEL / BRAIN CLASH OVERLAY */}
            {quizState !== "idle" && (
              <div className="quiz-duel-overlay">
                {quizState === "queued" && (
                  <div className="quiz-queued-view">
                    <div className="radar-circle">
                      <div className="radar-sweep"></div>
                      <span className="radar-icon">🧠</span>
                    </div>
                    <h2>Brain Clash Matchmaking</h2>
                    <p>Searching for an intellectual opponent...</p>
                    <div className="entry-badge">💰 Entry Fee: 50 Coins</div>
                    <div className="pool-badge">🏆 Winner Prize: 100 Coins</div>
                    <button className="quiz-cancel-btn" onClick={() => socket?.emit("leave-quiz-queue")}>
                      ❌ Cancel Challenge
                    </button>
                  </div>
                )}

                {quizState === "countdown" && (
                  <div className="quiz-countdown-view">
                    <div className="clash-players">
                      <div className="clash-player-card">
                        <div className="clash-player-avatar">{user?.name?.charAt(0) || "Y"}</div>
                        <h3>{user?.name || "You"}</h3>
                        <span>💰 {user?.coins || 0} Coins</span>
                      </div>
                      <div className="clash-vs">VS</div>
                      <div className="clash-player-card">
                        <div className="clash-player-avatar">{quizPartnerInfo?.name?.charAt(0) || "O"}</div>
                        <h3>{quizPartnerInfo?.name || "Opponent"}</h3>
                        <span>💰 {quizPartnerInfo?.coins || 0} Coins</span>
                        {partnerId && (
                          <button 
                            className={`quiz-add-friend-btn ${friendReqStatus ? 'active' : ''}`} 
                            onClick={addFriend} 
                            disabled={friendReqStatus}
                            style={{
                              marginTop: '8px',
                              padding: '5px 12px',
                              borderRadius: '15px',
                              background: friendReqStatus ? '#22c55e' : '#6366f1',
                              color: 'white',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                            }}
                          >
                            {friendReqStatus ? "✅ Requested" : "👤+ Add Friend"}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="countdown-number-wrapper">
                      <span className="countdown-number">{quizCountdown === 0 ? "CLASH!" : quizCountdown}</span>
                    </div>
                    <p className="countdown-sub">Get ready! 10 random questions. 100 Coins prize pool.</p>
                  </div>
                )}

                {quizState === "active" && quizQuestion && (
                  <div className="quiz-active-view">
                    <div className="quiz-header">
                      <div className="quiz-player-score you">
                        <span className="lbl">YOU</span>
                        <span className="score">{quizScores[socket?.id] || 0} pts</span>
                      </div>
                      
                      <div className="quiz-timer-ring">
                        <svg className="timer-svg" viewBox="0 0 36 36">
                          <path
                            className="timer-bg"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="timer-fill"
                            strokeDasharray={`${(quizTimeLeft / 15) * 100}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="timer-text">{quizTimeLeft}s</span>
                      </div>

                      <div className="quiz-player-score opponent">
                        <span className="lbl">{quizPartnerInfo?.name || "OPPONENT"}</span>
                        <span className="score">{quizScores[Object.keys(quizScores).find(id => id !== socket?.id)] || 0} pts</span>
                      </div>
                    </div>

                    <div className="quiz-progress-bar-container">
                      <div className="quiz-progress-fill" style={{ width: `${((quizQuestion.index + 1) / 10) * 100}%` }}></div>
                    </div>

                    <div className="quiz-card-main">
                      <span className="quiz-category-badge">{quizQuestion.category}</span>
                      <div className="quiz-question-index">Question {quizQuestion.index + 1} of 10</div>
                      <h2 className="quiz-question-text">{quizQuestion.question}</h2>
                    </div>

                    {quizResult && (
                      <div className={`quiz-result-banner ${quizResult.type}`}>
                        {quizResult.text}
                      </div>
                    )}

                    <div className="quiz-options-grid">
                      {quizQuestion.options.map((opt, i) => {
                        const isSelected = quizSelectedOption === opt;
                        return (
                          <button
                            key={i}
                            className={`quiz-opt-btn ${isSelected ? "selected" : ""} ${quizLockedOut ? "locked" : ""}`}
                            onClick={() => {
                              const isQuestionResolved = quizResult && quizResult.type !== "opportunity";
                              if (quizSelectedOption || quizLockedOut || isQuestionResolved) return;
                              setQuizSelectedOption(opt);
                              socket?.emit("quiz-submit-answer", { selectedOption: opt });
                            }}
                            disabled={quizSelectedOption !== null || quizLockedOut || (quizResult && quizResult.type !== "opportunity")}
                          >
                            <span className="opt-letter">{["A", "B", "C", "D"][i]}</span>
                            <span className="opt-text">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {quizState === "finished" && quizFinalResult && (
                  <div className="quiz-finished-view" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                    <span className="finished-trophy">🏆</span>

                    {/* FRIEND REQUEST OPTION WHILE IN QUESTIONS ROOM (FINISHED SCREEN) */}
                    {partnerId && (
                      <button 
                        className={`quiz-add-friend-btn ${friendReqStatus ? 'active' : ''}`} 
                        onClick={addFriend} 
                        disabled={friendReqStatus}
                        style={{
                          marginBottom: '10px',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          background: friendReqStatus ? '#22c55e' : 'linear-gradient(135deg, #6366f1, #a855f7)',
                          color: 'white',
                          border: 'none',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        {friendReqStatus ? "✅ Friend Request Sent" : "👤 Add Opponent as Friend"}
                      </button>
                    )}

                    {quizFinalResult.draw ? (
                      <>
                        <h2>It's a DRAW! 🤝</h2>
                        <p>A legendary clash of minds! You scored {quizFinalResult.totalScores[socket?.id] || 0} points.</p>
                        <div className="prize-credited refund">💰 50 Coins Refunded</div>
                        <button className="quiz-done-btn" onClick={() => {
                          setQuizState("idle");
                          setQuizFinalResult(null);
                          setDareChoiceStep("none");
                          nextPartner();
                        }}>
                          Finish Battle
                        </button>
                      </>
                    ) : (
                      <>
                        {/* NON-DRAW FLOW */}
                        {quizFinalResult.winnerId === (user?.id || (typeof window !== "undefined" && sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user")).id : "")) ? (
                          /* WINNER SCREEN */
                          <>
                            <h2 className="victory-text">VICTORY! 🎉</h2>
                            <p>You absolutely dominated the brain duel!</p>
                            <div className="final-stats">
                              <span>Your Score: {quizFinalResult.totalScores[socket?.id] || 0} pts</span>
                              <span>Opponent: {quizFinalResult.totalScores[Object.keys(quizFinalResult.totalScores).find(id => id !== socket?.id)] || 0} pts</span>
                            </div>
                            <div className="prize-credited" style={{ marginBottom: '15px' }}>💰 +100 Coins Credited!</div>

                            {dareChoiceStep === "waiting-loser" && (
                              <div className="dare-box" style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '15px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.2)', textAlign: 'center', width: '100%' }}>
                                <h3 style={{ color: '#fbbf24' }}>⏳ Opponent got a Dare!</h3>
                                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Waiting for opponent to accept or decline the dare...</p>
                                <div className="pulse-loader" style={{ width: '10px', height: '10px', background: '#fbbf24', borderRadius: '50%', margin: '15px auto', animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
                              </div>
                            )}

                            {dareChoiceStep === "winner-deciding" && (
                              <div className="dare-box" style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid #22c55e', textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <h3 style={{ color: '#22c55e' }}>✨ Opponent Accepted the Dare! ✨</h3>
                                <p style={{ fontSize: '0.9rem' }}>Opponent accepted the dare! Do you want to stay connected and chat?</p>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '5px' }}>
                                  <button 
                                    className="dare-done-btn" 
                                    onClick={() => socket?.emit("quiz-winner-decision", { stay: true })}
                                    style={{ background: '#22c55e', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Yes, stay connected 🤝
                                  </button>
                                  <button 
                                    className="quiz-cancel-btn" 
                                    onClick={() => {
                                      socket?.emit("quiz-winner-decision", { stay: false });
                                      nextPartner();
                                    }}
                                    style={{ background: '#ef4444', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    No, disconnect ❌
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          /* LOSER SCREEN */
                          <>
                            <h2 className="defeat-text">DEFEAT 💀</h2>
                            <p>Opponent outsmarted you this time!</p>
                            <div className="final-stats">
                              <span>Your Score: {quizFinalResult.totalScores[socket?.id] || 0} pts</span>
                              <span>Opponent: {quizFinalResult.totalScores[Object.keys(quizFinalResult.totalScores).find(id => id !== socket?.id)] || 0} pts</span>
                            </div>

                            {dareChoiceStep === "loser-deciding" && quizFinalResult.dare && (
                              <div className="dare-box" style={{ width: '100%' }}>
                                <h3>⚠️ AI Dare for the Loser! ⚠️</h3>
                                <p className="dare-desc">You lost! You MUST perform this dare live on camera:</p>
                                <div className="dare-text" style={{ fontSize: '1.1rem', margin: '15px 0', padding: '12px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px', borderLeft: '4px solid #ef4444', fontWeight: 600 }}>
                                  "{quizFinalResult.dare}"
                                </div>
                                <p style={{ fontSize: '0.9rem', marginBottom: '12px', fontWeight: 600 }}>Will you perform this dare?</p>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                  <button 
                                    className="dare-done-btn" 
                                    onClick={() => {
                                      socket?.emit("quiz-dare-response", { accepted: true });
                                      setDareChoiceStep("waiting-winner");
                                    }}
                                    style={{ background: '#22c55e', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Yes, I will do it! 👍
                                  </button>
                                  <button 
                                    className="quiz-cancel-btn" 
                                    onClick={() => {
                                      socket?.emit("quiz-dare-response", { accepted: false });
                                      nextPartner();
                                    }}
                                    style={{ background: '#ef4444', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    No, decline & leave ❌
                                  </button>
                                </div>
                              </div>
                            )}

                            {dareChoiceStep === "waiting-winner" && (
                              <div className="dare-box" style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '15px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.2)', textAlign: 'center', width: '100%' }}>
                                <h3 style={{ color: '#fbbf24' }}>⏳ Waiting for Winner...</h3>
                                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>You accepted the dare! Waiting for the opponent (winner) to decide if they want to stay connected...</p>
                                <div className="pulse-loader" style={{ width: '10px', height: '10px', background: '#fbbf24', borderRadius: '50%', margin: '15px auto', animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

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
                    {/* Filters category section removed */}

                    {activeIdentityMenu === 'avatars' && ['None', 'Robot', 'Anime', 'Girl', 'Ninja', 'Hero', 'Cat', 'Cyber'].map(a => (
                      <div
                        key={a}
                        className={`mini-option ${selectedTempAvatar === a ? 'selected' : ''}`}
                        onClick={() => setSelectedTempAvatar(a)}
                      >
                        <span className="filter-icon">{a === 'None' ? '🚫' : '👤'}</span>
                        <div className="filter-info">
                          <span className="filter-name">{a}</span>
                        </div>
                      </div>
                    ))}

                    {activeIdentityMenu === 'voice' && ['Normal', 'Robot', 'Deep', 'Chipmunk', 'Alien', 'Echo'].map(v => (
                      <div
                        key={v}
                        className={`mini-option ${selectedTempVoice === v ? 'selected' : ''}`}
                        onClick={() => setSelectedTempVoice(v)}
                      >
                        <span className="filter-icon">{v === 'Normal' ? '⏺️' : '🎙️'}</span>
                        <div className="filter-info">
                          <span className="filter-name">{v}</span>
                        </div>
                      </div>
                    ))}

                    {activeIdentityMenu === 'privacy' && (
                      <div
                        className={`mini-option ${isFaceBlurred ? 'selected' : ''}`}
                        onClick={() => setIsFaceBlurred(!isFaceBlurred)}
                        style={{ width: '100%', flex: '1 1 100%' }}
                      >
                        <span className="filter-icon">🌫️</span>
                        <div className="filter-info">
                          <span className="filter-name">{isFaceBlurred ? '✅ Blur Enabled' : '🌫️ Blur Disabled'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {activeIdentityMenu !== 'privacy' && (
                    <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', width: '100%' }}>
                      <button className="apply-effect-btn" onClick={handleApplyIdentityChanges}>
                        Apply Selection
                      </button>
                    </div>
                  )}
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
                    {/* Filters button removed */}
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
              <button 
                className={`quiz-trigger-btn ${quizState === "queued" ? "cancel" : ""}`} 
                onClick={handleBrainClashClick}
                disabled={quizState !== "idle" && quizState !== "queued"}
              >
                {quizState === "queued" ? "❌ Cancel Duel" : "🚪 Quiz Rooms"}
              </button>
              <button className="stop-btn" onClick={stopMatching} disabled={quizState !== "idle"}>
                🛑 Stop
              </button>
              <button className="report-trigger-btn" onClick={openReport}>
                🚨 Report
              </button>
              <button className="next-btn" onClick={nextPartner} disabled={quizState !== "idle"}>
                Skip & Next
                <span className="icon">→</span>
              </button>
            </div>
          </div>
        </div>

        {partnerId && (
          <button
            type="button"
            className={`mobile-chat-toggle-btn ${isMobileChatOpen ? 'active' : ''}`}
            onClick={() => setIsMobileChatOpen(!isMobileChatOpen)}
          >
            {isMobileChatOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {messages.filter(m => m.sender === 'partner').length > 0 && (
                  <span className="mobile-chat-unread-badge">
                    {messages.filter(m => m.sender === 'partner').length}
                  </span>
                )}
              </>
            )}
          </button>
        )}

        <div className={`chat-column ${isMobileChatOpen ? 'mobile-chat-open' : 'mobile-chat-closed'}`}>
          <div className="chat-box-v2">
            <div className="chat-box-header">
              <h3>Live Chat</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="msg-count">{messages.length} msgs</span>
                <button type="button" className="mobile-chat-close-btn-header" onClick={() => setIsMobileChatOpen(false)}>×</button>
              </div>
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
                        <button className="pay-method-item paypal" onClick={() => showToast("PayPal integration coming soon!", "info")}>
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
                    sessionStorage.setItem("user", JSON.stringify(updatedUser));
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
                  <div key={idx} className="history-item">
                    <div className="history-item-left">
                      <div className="history-avatar">
                        {s.name ? s.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="history-details">
                        <div className="history-name">{s.name}</div>
                        <div className="history-info">
                          {s.country} • {new Date(s.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <button
                      className="history-reconnect-btn"
                      onClick={async () => {
                        const confirmed = window.confirm(`Reconnect with ${s.name}? (10 Coins)`);
                        if (confirmed) {
                          try {
                            const token = sessionStorage.getItem('token');
                            const res = await axios.post('https://meetzone-backend.onrender.com/api/user/spend-coins', { email: user.email, amount: 10, feature: 'reconnect' });
                            if (res.data.success) {
                              setUser({ ...user, coins: res.data.coins });
                              await axios.post('https://meetzone-backend.onrender.com/api/friends/request', { targetId: s.id, type: 'reconnect' }, { headers: { Authorization: `Bearer ${token}` } });
                              showToast(`Request sent to ${s.name}!`, "success");
                            }
                          } catch (err) {
                            showToast(err.response?.data?.message || 'Failed to reconnect', "error");
                          }
                        }
                      }}
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
                  <div className="card-price">{currency === "INR" ? "₹149" : "$1.75"}</div>
                  <div className="card-dur">7 Days</div>
                </div>

                {/* PRIME */}
                <div className="premium-card-mini featured" onClick={() => router.push("/#pricing-section")}>
                  <div className="popular-ribbon-mini">Best Choice</div>
                  <div className="card-top">
                    <span className="icon">🚀</span>
                    <span className="name">Prime</span>
                  </div>
                  <div className="card-price">{currency === "INR" ? "₹599" : "$6.99"}</div>
                  <div className="card-dur">30 Days</div>
                </div>

                {/* SILVER */}
                <div className="premium-card-mini" onClick={() => router.push("/#pricing-section")}>
                  <div className="card-top">
                    <span className="icon">💎</span>
                    <span className="name">Silver</span>
                  </div>
                  <div className="card-price">{currency === "INR" ? "₹1599" : "$18.99"}</div>
                  <div className="card-dur">90 Days</div>
                </div>

                {/* ELITE */}
                <div className="premium-card-mini elite-gold" onClick={() => router.push("/#pricing-section")}>
                  <div className="elite-badge-mini">👑 VIP</div>
                  <div className="card-top">
                    <span className="icon">🤴</span>
                    <span className="name">Elite</span>
                  </div>
                  <div className="card-price">{currency === "INR" ? "₹999" : "$11.99"}</div>
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

      {/* PREMIUM TOAST NOTIFICATION STACK */}
      {toastQueue.length > 0 && (
        <div className="toast-stack-container">
          {toastQueue.map((toast, idx) => (
            <div key={toast.id} className={`premium-toast toast-${toast.type}`} style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="toast-icon-wrapper">
                {toast.type === 'success' && <span className="toast-icon">✅</span>}
                {toast.type === 'error' && <span className="toast-icon">❌</span>}
                {toast.type === 'warning' && <span className="toast-icon">⚠️</span>}
                {toast.type === 'info' && <span className="toast-icon">ℹ️</span>}
              </div>
              <span className="toast-message">{toast.message}</span>
              <button className="toast-close" onClick={() => setToastQueue(prev => prev.filter(t => t.id !== toast.id))}>×</button>
              <div className="toast-progress-bar" style={{ animationDuration: '4s' }}></div>
            </div>
          ))}
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
          margin-bottom: 0px; 
        }


        .video-card {
          background: #000;
          border-radius: 24px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          height: 100%;
        }

        .video-card video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-card video.mirrored,
        .video-card canvas.mirrored {
          transform: scaleX(-1);
        }

        .natural-view {
          transform: scaleX(-1) !important;
        }

        .searching-overlay-v2 {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
          overflow: hidden;
        }

        .searching-ripple {
          position: absolute;
          width: 200px;
          height: 200px;
          border: 2px solid rgba(99, 102, 241, 0.3);
          border-radius: 50%;
          animation: ripple 3s linear infinite;
        }

        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(4); opacity: 0; }
        }

        .searching-content {
          position: relative;
          z-index: 6;
          text-align: center;
          animation: pulse 2s ease-in-out infinite;
        }

        .searching-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .searching-content h3 {
          color: white;
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .searching-content p {
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .partner-avatar-view {
          background: #0f172a;
          z-index: 4;
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
          top: 0.5rem;
          left: 0.5rem;
          background: rgba(0, 0, 0, 0.6);
          padding: 0.2rem 0.5rem;
          border-radius: 8px;
          font-size: 0.65rem;
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

        /* ═══════════════════════════════════════════════════ */
        /*           PREMIUM TOAST NOTIFICATION SYSTEM          */
        /* ═══════════════════════════════════════════════════ */
        .toast-stack-container {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 999999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
          max-width: 480px;
          width: 92vw;
        }

        .premium-toast {
          pointer-events: all;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 16px;
          backdrop-filter: blur(20px) saturate(1.8);
          -webkit-backdrop-filter: blur(20px) saturate(1.8);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.06) inset;
          animation: toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }

        @keyframes toastSlideIn {
          0% { opacity: 0; transform: translateY(-20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Type-specific premium themes */
        .toast-info {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.22), rgba(129, 140, 248, 0.15));
          border: 1px solid rgba(99, 102, 241, 0.35);
        }
        .toast-success {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(52, 211, 153, 0.15));
          border: 1px solid rgba(16, 185, 129, 0.35);
        }
        .toast-warning {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(251, 191, 36, 0.15));
          border: 1px solid rgba(245, 158, 11, 0.35);
        }
        .toast-error {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.22), rgba(248, 113, 113, 0.15));
          border: 1px solid rgba(239, 68, 68, 0.35);
        }

        .toast-icon-wrapper {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }
        .toast-info .toast-icon-wrapper { background: rgba(99, 102, 241, 0.2); }
        .toast-success .toast-icon-wrapper { background: rgba(16, 185, 129, 0.2); }
        .toast-warning .toast-icon-wrapper { background: rgba(245, 158, 11, 0.2); }
        .toast-error .toast-icon-wrapper { background: rgba(239, 68, 68, 0.2); }

        .toast-icon {
          font-size: 0.95rem;
          line-height: 1;
        }

        .toast-message {
          flex: 1;
          font-size: 0.82rem;
          font-weight: 600;
          color: #f1f5f9;
          line-height: 1.4;
          letter-spacing: 0.01em;
        }

        .toast-close {
          flex-shrink: 0;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8;
          width: 26px;
          height: 26px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 700;
          transition: all 0.2s ease;
          line-height: 1;
        }
        .toast-close:hover {
          background: rgba(255,255,255,0.15);
          color: #f1f5f9;
          transform: scale(1.1);
        }

        .toast-progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          border-radius: 0 0 16px 16px;
          animation: toastProgress linear forwards;
        }
        .toast-info .toast-progress-bar { background: linear-gradient(90deg, #6366f1, #818cf8); }
        .toast-success .toast-progress-bar { background: linear-gradient(90deg, #10b981, #34d399); }
        .toast-warning .toast-progress-bar { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
        .toast-error .toast-progress-bar { background: linear-gradient(90deg, #ef4444, #f87171); }

        @keyframes toastProgress {
          0% { width: 100%; }
          100% { width: 0%; }
        }

        @media (max-width: 600px) {
          .toast-stack-container {
            top: 10px;
            width: 96vw;
          }
          .premium-toast {
            padding: 12px 14px;
            gap: 10px;
            border-radius: 14px;
          }
          .toast-message {
            font-size: 0.75rem;
          }
          .toast-icon-wrapper {
            width: 28px;
            height: 28px;
          }
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
            padding: 2px;
          }
          .bottom-mini-bar {
            padding: 4px !important;
            gap: 5px !important;
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
            height: 42vh !important;
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
          margin-top: -20px;
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
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(12px);
          padding: 10px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          z-index: 1000;
          width: 260px;
          max-width: 90vw;
          left: 50%;
          transform: translateX(-50%);
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
          border-top: 8px solid rgba(15, 23, 42, 0.95);
        }
        @keyframes popIn { from { opacity: 0; transform: scale(0.9) translateY(10px) translateX(-50%); } to { opacity: 1; transform: scale(1) translateY(0) translateX(-50%); } }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .popup-header span { font-size: 0.6rem; font-weight: 900; color: #ec4899; letter-spacing: 1.2px; }
        .popup-header button { background: none; border: none; color: #64748b; font-size: 0.95rem; cursor: pointer; line-height: 1; }

        .filters-by-category {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          padding: 0.15rem;
          max-height: 220px;
          overflow-y: auto;
        }
        .category-section { display: flex; flex-direction: column; gap: 0.35rem; }
        .cat-title { font-size: 0.62rem; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 0.12em; border-bottom: 1px solid rgba(99, 102, 241, 0.2); padding-bottom: 0.2rem; margin: 0 0 0.2rem 0; text-align: left; }
        .popup-options-row { display: flex; flex-wrap: wrap; gap: 0.3rem; justify-content: flex-start; width: 100%; }
        .mini-option { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 4px 6px; border-radius: 8px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 0.15rem; min-width: 55px; flex: 1 1 55px; position: relative; }
        .mini-option:hover { background: rgba(99, 102, 241, 0.1); border-color: #6366f1; transform: translateY(-2px); }
        .mini-option.selected { background: #6366f1; border-color: #818cf8; color: white; box-shadow: 0 0 15px rgba(99, 102, 241, 0.4); }
        .mini-option.locked-filter { opacity: 0.8; filter: grayscale(0.5); }
        .mini-option.locked-filter::after { content: "🔒"; position: absolute; top: 3px; right: 3px; font-size: 0.5rem; }
        .filter-icon { font-size: 1rem; }
        .filter-info { display: flex; flex-direction: column; align-items: center; }
        .filter-name { font-size: 0.58rem; font-weight: 700; text-align: center; color: #fff; }
        .filter-cost { font-size: 0.55rem; color: #fbbf24; font-weight: 800; margin-top: 1px; }
        .mini-option:hover { background: #334155; transform: scale(1.05); }
        .mini-option.selected {
          background: #6366f1;
          border-color: #818cf8;
          color: white;
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
        }

        .apply-effect-btn {
          width: 100%;
          background: linear-gradient(135deg, #ec4899 0%, #6366f1 100%);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          animation: pulseGrow 1.5s infinite alternate;
        }
        .apply-effect-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(236, 72, 153, 0.5);
          filter: brightness(1.1);
        }
        @keyframes pulseGrow {
          from { transform: scale(1); }
          to { transform: scale(1.02); }
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
          font-size: 8rem; 
          position: absolute; 
          top: 50%; 
          left: 50%;
          transform: translate(-50%, -50%);
          filter: drop-shadow(0 0 15px rgba(0,0,0,0.5));
          animation: faceMove 4s infinite ease-in-out;
        }
        .mask-cat::before { 
          content: '🐱'; 
          font-size: 8rem; 
          position: absolute; 
          top: 50%; 
          left: 50%;
          transform: translate(-50%, -50%);
          filter: drop-shadow(0 0 15px rgba(255,255,255,0.6));
          animation: faceMove 4.5s infinite ease-in-out;
        }
        .mask-devil::before { 
          content: '😈'; 
          font-size: 8rem; 
          position: absolute; 
          top: 45%; 
          left: 50%;
          transform: translate(-50%, -50%);
          filter: drop-shadow(0 0 20px rgba(239, 68, 68, 0.85));
          animation: devilFloat 3s infinite ease-in-out;
        }
        .mask-crown::before { 
          content: '👑'; 
          font-size: 7rem; 
          position: absolute; 
          top: 18%; 
          left: 50%;
          transform: translateX(-50%);
          animation: crownFloat 3s infinite ease-in-out;
          filter: drop-shadow(0 0 20px rgba(245, 158, 11, 0.9));
        }
        .mask-angel::before { 
          content: '😇'; 
          font-size: 8rem; 
          position: absolute; 
          top: 42%; 
          left: 50%;
          transform: translate(-50%, -50%);
          filter: drop-shadow(0 0 20px rgba(6, 182, 212, 0.9));
          animation: angelFloat 3.5s infinite ease-in-out;
        }
        .mask-ghost::before { 
          content: '👻'; 
          font-size: 8rem; 
          position: absolute; 
          top: 50%; 
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.65;
          filter: drop-shadow(0 0 25px rgba(168, 85, 247, 0.8));
          animation: ghostFloat 4s infinite ease-in-out;
        }
        .mask-glass::before {
          content: '👓';
          position: absolute;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 7rem;
          filter: drop-shadow(0 0 12px #00f2ff);
          animation: faceMove 5s infinite ease-in-out;
        }
        .mask-neon::before {
          content: '⚡';
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 8rem;
          filter: drop-shadow(0 0 25px #eab308);
          animation: faceMove 3s infinite ease-in-out;
        }

        @keyframes faceMove {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -53%) scale(1.05); }
        }
        @keyframes crownFloat {
          0%, 100% { transform: translateX(-50%) translateY(0) rotate(-2deg); }
          50% { transform: translateX(-50%) translateY(-12px) rotate(2deg); }
        }
        @keyframes devilFloat {
          0%, 100% { transform: translate(-50%, -50%) rotate(-3deg); }
          50% { transform: translate(-50%, -55%) rotate(3deg); }
        }
        @keyframes angelFloat {
          0%, 100% { transform: translate(-50%, -47%) scale(0.98); }
          50% { transform: translate(-50%, -53%) scale(1.02); }
        }
        @keyframes ghostFloat {
          0%, 100% { transform: translate(-46%, -52%) rotate(-5deg); opacity: 0.5; }
          50% { transform: translate(-54%, -48%) rotate(5deg); opacity: 0.75; }
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

        /* --- MULTI-FILTER PREFERENCES BUTTON & MODAL --- */
        .filter-settings-trigger-btn {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.35);
          border-radius: 12px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: white;
          font-weight: 700;
          font-size: 0.9rem;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.05);
        }
        .filter-settings-trigger-btn:hover {
          background: rgba(99, 102, 241, 0.2);
          border-color: #6366f1;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.15);
        }
        .filter-settings-trigger-btn .icon {
          font-size: 1.1rem;
          animation: spin-gear 6s linear infinite;
        }
        @keyframes spin-gear {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .active-filters-preview-badge {
          background: #6366f1;
          color: white;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 20px;
          letter-spacing: 0.3px;
        }

        /* Modal Overlay */
        .filter-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(7, 10, 19, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: modalFadeIn 0.3s ease-out;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Modal Card */
        .filter-modal-card {
          width: 90%;
          max-width: 480px;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: modalScaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes modalScaleUp {
          from { transform: scale(0.9) translateY(20px); }
          to { transform: scale(1) translateY(0); }
        }

        .filter-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 15px;
        }
        .filter-modal-header h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: white;
          margin: 0;
        }
        .filter-modal-header .close-btn {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 1.75rem;
          cursor: pointer;
          line-height: 1;
          transition: color 0.2s;
        }
        .filter-modal-header .close-btn:hover {
          color: #ef4444;
        }

        .filter-modal-body {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-height: 60vh;
          overflow-y: auto;
          padding-right: 4px;
        }
        .filter-modal-body::-webkit-scrollbar {
          width: 6px;
        }
        .filter-modal-body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        .filter-section-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
        }
        .section-label {
          font-size: 0.8rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Gender Options Grid */
        .gender-options-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .gender-option-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .gender-option-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(99, 102, 241, 0.4);
        }
        .gender-option-card.active {
          background: rgba(99, 102, 241, 0.12);
          border-color: #6366f1;
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.25);
        }
        .gender-option-card .emoji {
          font-size: 1.5rem;
        }
        .gender-option-card .name {
          font-size: 0.75rem;
          font-weight: 700;
          color: #e2e8f0;
        }

        /* Select Dropdowns */
        .select-dropdown-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .select-dropdown-trigger:hover {
          border-color: rgba(99, 102, 241, 0.4);
          background: rgba(15, 23, 42, 0.85);
        }
        .select-dropdown-trigger .val-icon {
          font-size: 1.1rem;
          margin-right: 10px;
        }
        .select-dropdown-trigger .val-text {
          flex: 1;
          font-size: 0.9rem;
          color: white;
          font-weight: 600;
        }
        .select-dropdown-trigger .arrow {
          font-size: 0.7rem;
          color: #64748b;
        }

        .filter-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          margin-top: 6px;
          z-index: 100;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          animation: slideDown 0.2s ease;
        }
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .filter-dropdown-menu .search-box {
          padding: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .filter-dropdown-menu .search-box input {
          width: 100%;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 8px 12px;
          color: white;
          font-size: 0.85rem;
        }
        .filter-dropdown-menu .items-list {
          max-height: 200px;
          overflow-y: auto;
        }
        .filter-dropdown-menu .dropdown-item {
          padding: 10px 15px;
          cursor: pointer;
          font-size: 0.85rem;
          color: #cbd5e1;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
        }
        .filter-dropdown-menu .dropdown-item:hover {
          background: rgba(99, 102, 241, 0.15);
          color: white;
        }
        .filter-dropdown-menu .dropdown-item.active {
          background: #6366f1;
          color: white;
          font-weight: 700;
        }

        /* Footer apply button */
        .filter-modal-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 15px;
          display: flex;
          justify-content: flex-end;
        }
        .filter-modal-footer .apply-btn {
          width: 100%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          border: none;
          color: white;
          font-weight: 800;
          font-size: 1rem;
          padding: 12px 24px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }
        .filter-modal-footer .apply-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
        }

        /* Quiz Modal styling */
        .quiz-modal-v2 {
          max-width: 600px !important;
        }
        .quiz-grid-v2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          padding: 10px;
        }

        /* History Modal base classes */
        .history-modal-v2 {
          max-width: 440px !important;
          padding: 0 !important;
          text-align: left;
        }
        .history-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .history-title {
          font-weight: 800;
          font-size: 1rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
          white-space: nowrap;
        }
        .history-close-btn {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 1.5rem;
          cursor: pointer;
          line-height: 1;
        }
        .history-body {
          max-height: 65vh;
          overflow-y: auto;
          padding: 1rem;
          scrollbar-width: none;
        }
        .history-item {
          padding: 12px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 12px;
          transition: background 0.2s;
        }
        .history-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .history-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 800;
          color: white;
          flex-shrink: 0;
        }
        .history-details {
          min-width: 0;
        }
        .history-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .history-info {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .history-reconnect-btn {
          background: linear-gradient(135deg, #6366f1, #a855f7);
          border: none;
          color: white;
          padding: 7px 14px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* --- MOBILE RESPONSIVENESS FIXES --- */
        @media (max-width: 768px) {
          .chat-page-v2 {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            height: 100dvh !important;
            overflow: hidden !important;
            background: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            z-index: 999999 !important;
          }
          .main-layout {
            display: block !important;
            width: 100vw !important;
            height: 100vh !important;
            height: 100dvh !important;
            margin: 0 !important;
            padding: 0 !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
          }
          .video-column {
            width: 100% !important;
            height: 100% !important;
            flex: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .bg-gradient {
            display: none !important;
          }
          .header-v2 {
            position: absolute !important;
            top: env(safe-area-inset-top, 6px) !important;
            left: 0 !important;
            width: 100% !important;
            z-index: 1000 !important;
            background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent) !important;
            border: none !important;
            padding: 8px 12px !important;
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            box-sizing: border-box !important;
          }
          .header-v2 .brand {
            transform: scale(0.8) !important;
            transform-origin: left center !important;
          }
          .header-v2 .user-profile-tag {
            display: none !important;
          }
          .header-v2 .btn-home {
            padding: 4px 8px !important;
            font-size: 0.72rem !important;
            background: rgba(255, 255, 255, 0.1) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
          }
          .video-grid-v2 {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
            background: #000000 !important;
            z-index: 1 !important;
          }
          /* Searching mode: user video is full screen, searching overlay is transparent */
          .video-grid-v2.searching-mode > .video-card:first-child {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 2 !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .video-grid-v2.searching-mode > .video-card:first-child video,
          .video-grid-v2.searching-mode > .video-card:first-child canvas {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }
          .video-grid-v2.searching-mode > .video-card:first-child .card-label {
            display: flex !important;
            position: absolute !important;
            bottom: 120px !important;
            left: 12px !important;
            z-index: 10 !important;
          }
          .video-grid-v2.searching-mode > .video-card:first-child .card-controls {
            display: flex !important;
            position: absolute !important;
            bottom: 120px !important;
            right: 12px !important;
            z-index: 10 !important;
            transform: none !important;
            left: auto !important;
          }

          .video-grid-v2.searching-mode > .video-card:nth-child(2) {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 3 !important;
            background: transparent !important;
            border: none !important;
          }
          .video-grid-v2.searching-mode .searching-overlay-v2 {
            background: rgba(15, 23, 42, 0.45) !important;
            backdrop-filter: blur(4px) !important;
            -webkit-backdrop-filter: blur(4px) !important;
          }

          /* Partner connected mode: local video is floating bubble, stranger is full screen */
          .video-grid-v2.partner-connected > .video-card:first-child {
            position: absolute !important;
            width: 75px !important;
            height: 110px !important;
            top: 130px !important;
            right: 12px !important;
            z-index: 100 !important;
            border-radius: 12px !important;
            border: 1.5px solid #ffffff !important;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6) !important;
            overflow: hidden !important;
            background: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            transition: all 0.3s ease !important;
          }
          .video-grid-v2.partner-connected > .video-card:first-child video,
          .video-grid-v2.partner-connected > .video-card:first-child canvas {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }
          .video-grid-v2.partner-connected > .video-card:first-child .card-label {
            display: none !important;
          }
          .video-grid-v2.partner-connected > .video-card:first-child .card-controls {
            display: flex !important;
            position: absolute !important;
            bottom: 4px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            background: rgba(0, 0, 0, 0.75) !important;
            border-radius: 15px !important;
            padding: 3px 6px !important;
            gap: 4px !important;
            z-index: 110 !important;
            width: auto !important;
          }
          .video-grid-v2.partner-connected > .video-card:first-child .ctrl-btn {
            width: 18px !important;
            height: 18px !important;
            border-radius: 50% !important;
            font-size: 8px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: rgba(255, 255, 255, 0.15) !important;
            border: none !important;
            color: #fff !important;
            padding: 0 !important;
          }
          .video-grid-v2.partner-connected > .video-card:nth-child(2) {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 2 !important;
            border-radius: 0 !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .video-grid-v2.partner-connected > .video-card:nth-child(2) video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            border-radius: 0 !important;
          }

          /* Stranger Top Floating Label */
          .video-grid-v2 > .video-card:nth-child(2) .card-label {
            position: absolute !important;
            top: 55px !important;
            left: 12px !important;
            background: rgba(15, 23, 42, 0.6) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
            padding: 4px 8px !important;
            border-radius: 14px !important;
            font-size: 0.68rem !important;
            font-weight: 700 !important;
            color: #fff !important;
            z-index: 10 !important;
            width: auto !important;
            display: flex !important;
            align-items: center !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          /* Stranger Top Floating Controls (Add Friend) */
          .video-grid-v2 > .video-card:nth-child(2) .card-controls {
            display: flex !important;
            position: absolute !important;
            top: 55px !important;
            right: 12px !important;
            background: rgba(15, 23, 42, 0.6) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
            border-radius: 20px !important;
            padding: 4px 8px !important;
            z-index: 10 !important;
            width: auto !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
             /* Preferences Button Floating Row - Super Small! */
          .filters-row-v2 {
            position: absolute !important;
            top: 90px !important;
            left: 12px !important;
            right: 12px !important;
            transform: none !important;
            width: auto !important;
            z-index: 50 !important;
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 6px !important;
            background: transparent !important;
            padding: 0 !important;
          }
          .filter-settings-trigger-btn {
            background: rgba(15, 23, 42, 0.7) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            color: #fff !important;
            border-radius: 12px !important;
            padding: 4px 8px !important;
            font-size: 0.65rem !important;
            font-weight: 700 !important;
            height: 24px !important;
            display: flex !important;
            align-items: center !important;
            width: auto !important;
          }
          .active-filters-preview-badge {
            font-size: 0.55rem !important;
            padding: 1px 4px !important;
            margin-left: 4px !important;
          }
          .paywall-badge-v2 {
            background: rgba(245, 158, 11, 0.9) !important;
            color: #000 !important;
            border-radius: 12px !important;
            padding: 4px 8px !important;
            font-size: 0.65rem !important;
            font-weight: 800 !important;
            height: 24px !important;
            display: flex !important;
            align-items: center !important;
            width: auto !important;
          }
          /* Filter Modal Responsiveness */
          .filter-modal-card {
            width: 95% !important;
            max-width: 330px !important;
            padding: 15px !important;
            border-radius: 20px !important;
            gap: 10px !important;
          }
          .filter-modal-header h2 {
            font-size: 1.1rem !important;
          }
          .filter-modal-header .close-btn {
            font-size: 1.5rem !important;
          }
          .filter-modal-body {
            gap: 12px !important;
          }
          .filter-section-group {
            margin-bottom: 8px !important;
          }
          .section-label {
            font-size: 0.7rem !important;
            margin-bottom: 4px !important;
          }
          .gender-options-grid {
            gap: 6px !important;
          }
          .gender-option-card {
            padding: 8px !important;
            border-radius: 10px !important;
            flex: 1 !important;
            width: auto !important;
          }
          .gender-option-card .emoji {
            font-size: 1.1rem !important;
          }
          .gender-option-card .name {
            font-size: 0.65rem !important;
          }
          .select-dropdown-trigger {
            padding: 8px 12px !important;
            border-radius: 10px !important;
            height: auto !important;
            width: 100% !important;
          }
          /* Mobile Chat Toggle Button styling */
          .mobile-chat-toggle-btn {
            display: none !important;
          }
          @media (max-width: 768px) {
            .mobile-chat-toggle-btn {
              display: flex !important;
              align-items: center;
              justify-content: center;
              position: fixed !important;
              bottom: 80px !important;
              left: 16px !important;
              width: 44px !important;
              height: 44px !important;
              border-radius: 50% !important;
              background: rgba(99, 102, 241, 0.9) !important;
              backdrop-filter: blur(8px) !important;
              border: 1.5px solid rgba(255, 255, 255, 0.25) !important;
              color: white !important;
              z-index: 9999 !important;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3) !important;
              cursor: pointer !important;
              transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
              padding: 0 !important;
            }
            .mobile-chat-toggle-btn:active {
              transform: scale(0.9) !important;
            }
            .mobile-chat-toggle-btn.active {
              background: rgba(239, 68, 68, 0.9) !important;
            }
            .mobile-chat-unread-badge {
              position: absolute !important;
              top: -4px !important;
              right: -4px !important;
              background: #ef4444 !important;
              color: white !important;
              font-size: 0.65rem !important;
              font-weight: 700 !important;
              padding: 2px 6px !important;
              border-radius: 10px !important;
              border: 1.5px solid #ffffff !important;
              box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4) !important;
            }
          }

          @media (max-width: 768px) {
            .chat-column {
              display: none !important;
            }
            .chat-column.mobile-chat-open {
              display: flex !important;
              position: fixed !important;
              bottom: 0 !important;
              left: 0 !important;
              width: 100vw !important;
              height: 38vh !important; /* Made compact to avoid blocking the remote video */
              height: 38dvh !important;
              background: rgba(15, 23, 42, 0.82) !important; /* Sleek glassmorphism */
              backdrop-filter: blur(16px) !important;
              -webkit-backdrop-filter: blur(16px) !important;
              z-index: 10001 !important;
              border-top-left-radius: 24px !important;
              border-top-right-radius: 24px !important;
              border-top: 1px solid rgba(255, 255, 255, 0.12) !important;
              box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.6) !important;
              padding: 12px 16px 16px 16px !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              animation: chatSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
            }
            @keyframes chatSlideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
            .chat-column.mobile-chat-open .chat-box-v2 {
              display: flex !important;
              flex-direction: column !important;
              height: 100% !important;
              background: transparent !important;
              border: none !important;
            }
            .chat-column.mobile-chat-open .chat-box-header {
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              padding: 0 0 12px 0 !important;
              border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
            }
            .chat-column.mobile-chat-open .chat-box-header h3 {
              margin: 0 !important;
              font-size: 0.95rem !important;
              font-weight: 700 !important;
              color: #a5b4fc !important;
            }
            .chat-column.mobile-chat-open .chat-box-header .msg-count {
              font-size: 0.65rem !important;
              color: #94a3b8 !important;
            }
            .mobile-chat-close-btn-header {
              background: rgba(255, 255, 255, 0.08) !important;
              border: none !important;
              color: #fff !important;
              width: 24px !important;
              height: 24px !important;
              border-radius: 50% !important;
              font-size: 1rem !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              cursor: pointer !important;
              padding: 0 !important;
              line-height: 1 !important;
            }
            .chat-column.mobile-chat-open .chat-box-messages {
              flex: 1 !important;
              overflow-y: auto !important;
              padding: 12px 0 !important;
              display: flex !important;
              flex-direction: column !important;
              gap: 8px !important;
              mask-image: none !important;
              -webkit-mask-image: none !important;
            }
            .chat-column.mobile-chat-open .msg-row {
              background: rgba(255, 255, 255, 0.04) !important;
              border-radius: 12px !important;
              padding: 6px 12px !important;
              font-size: 0.78rem !important;
              width: max-content !important;
              max-width: 85% !important;
              margin: 0 !important;
              border: 1px solid rgba(255, 255, 255, 0.04) !important;
            }
            .chat-column.mobile-chat-open .msg-row.me {
              align-self: flex-end !important;
              background: #6366f1 !important;
              color: #fff !important;
              justify-content: flex-end !important;
            }
            .chat-column.mobile-chat-open .msg-row.partner {
              align-self: flex-start !important;
              background: rgba(255, 255, 255, 0.08) !important;
              color: #fff !important;
              justify-content: flex-start !important;
            }
            .chat-column.mobile-chat-open .chat-box-input {
              background: rgba(255, 255, 255, 0.04) !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
              border-radius: 50px !important;
              padding: 4px 6px 4px 16px !important;
              margin-top: 8px !important;
              display: flex !important;
              align-items: center !important;
              gap: 8px !important;
            }
            .chat-column.mobile-chat-open .chat-box-input input {
              flex: 1 !important;
              background: transparent !important;
              border: none !important;
              color: #fff !important;
              font-size: 0.8rem !important;
              outline: none !important;
              padding: 6px 0 !important;
            }
            .chat-column.mobile-chat-open .chat-box-input button {
              width: 32px !important;
              height: 32px !important;
              border-radius: 50% !important;
              background: #6366f1 !important;
              color: #fff !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              border: none !important;
              cursor: pointer !important;
              padding: 0 !important;
            }

          /* Micro Identity Tools container floating just above bottom controls */
          .identity-container {
            position: absolute !important;
            bottom: 110px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 95% !important;
            z-index: 200 !important;
            background: transparent !important;
          }
          .bottom-mini-bar {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 4px !important;
            background: rgba(0, 0, 0, 0.45) !important;
            backdrop-filter: blur(6px) !important;
            -webkit-backdrop-filter: blur(6px) !important;
            padding: 3px 6px !important;
            border-radius: 20px !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            margin: 0 auto !important;
            width: max-content !important;
            max-width: 100% !important;
          }
          .bottom-mini-bar .tool-btn {
            padding: 3px 6px !important;
            font-size: 0.62rem !important;
            border-radius: 12px !important;
            background: rgba(255, 255, 255, 0.04) !important;
            color: #fff !important;
            border: none !important;
            height: 22px !important;
          }
          .bottom-mini-bar .tool-btn.active {
            background: #6366f1 !important;
          }
          .identity-popup-bubble {
            position: absolute !important;
            bottom: 35px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 250px !important;
            max-width: calc(100vw - 20px) !important;
            z-index: 300 !important;
            background: rgba(15, 23, 42, 0.95) !important;
            backdrop-filter: blur(12px) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-radius: 16px !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6) !important;
            padding: 10px !important;
            box-sizing: border-box !important;
          }
          .gift-bubble {
            width: 270px !important;
          }
          /* Micro-sized rounded bottom actions (Extremely Small and Focused!) */
          .bottom-actions {
            position: absolute !important;
            bottom: env(safe-area-inset-bottom, 8px) !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 94% !important;
            z-index: 1000 !important;
            background: rgba(0, 0, 0, 0.45) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            padding: 8px 12px !important;
            border-radius: 20px !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 6px !important;
            box-sizing: border-box !important;
          }
          .bottom-actions > div:first-child,
          .bottom-actions > div:nth-child(2) {
            display: none !important;
          }
          .bottom-actions > div:nth-child(3) {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            width: 100% !important;
            gap: 6px !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .bottom-actions > div:nth-child(3) button {
            flex: none !important;
            width: 100% !important;
            height: 34px !important;
            border-radius: 12px !important;
            font-size: 0.72rem !important;
            font-weight: 700 !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 2px !important;
            margin: 0 !important;
            border: none !important;
            transition: all 0.2s ease !important;
          }
          .bottom-actions .quiz-trigger-btn {
            background: linear-gradient(135deg, #a855f7, #6366f1) !important;
            color: white !important;
          }
          .bottom-actions .stop-btn {
            background: rgba(239, 68, 68, 0.15) !important;
            color: #ef4444 !important;
            border: 1px solid rgba(239, 68, 68, 0.3) !important;
          }
          .bottom-actions .report-trigger-btn {
            background: rgba(255, 255, 255, 0.05) !important;
            color: #fff !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
          }
          .bottom-actions .next-btn {
            background: #6366f1 !important;
            color: white !important;
          }
          .bottom-actions button:active {
            transform: scale(0.93) !important;
          }

          /* Payment Modal and Pricing Responsiveness */
          .payment-overlay {
            padding: 1rem 0.5rem !important;
          }
          .premium-modal {
            width: 95% !important;
            max-width: 330px !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
            padding: 20px 15px !important;
            margin: auto !important;
            border-radius: 24px !important;
          }
          .premium-modal.pricing-wide {
            max-width: 330px !important;
          }
          .modal-header-premium {
            padding: 2rem 1rem 1rem !important;
          }
          .total-amount {
            font-size: 2.2rem !important;
          }
          .modal-body-premium {
            padding: 0 1rem 1.5rem !important;
          }
          .pricing-grid-premium {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            margin: 1rem 0 !important;
          }
          .premium-card-mini {
            padding: 12px !important;
            border-radius: 16px !important;
          }
          .card-price {
            font-size: 1.25rem !important;
          }
          .methods-list-premium {
            gap: 8px !important;
          }
          .pay-method-item {
            padding: 10px !important;
            border-radius: 16px !important;
            gap: 10px !important;
          }
          .pay-icon-box {
            width: 44px !important;
            height: 44px !important;
            border-radius: 12px !important;
            font-size: 1.25rem !important;
          }
          .pay-details strong {
            font-size: 0.9rem !important;
          }
          .pay-details span {
            font-size: 0.75rem !important;
          }
          .pay-arrow {
            font-size: 1.1rem !important;
          }
          .status-container {
            padding: 1rem 0 !important;
          }

          /* History modal item responsiveness */
          .history-modal-v2 {
            max-width: 330px !important;
            padding: 0 !important;
          }
          .history-header {
            padding: 1rem !important;
          }
          .history-title {
            font-size: 0.85rem !important;
          }
          .history-body {
            padding: 0.75rem !important;
            max-height: 50vh !important;
          }
          .history-item {
            padding: 10px 6px !important;
            gap: 8px !important;
            border-bottom: 1px solid rgba(255,255,255,0.05) !important;
          }
          .history-item-left {
            gap: 8px !important;
            min-width: 0 !important;
          }
          .history-avatar {
            width: 32px !important;
            height: 32px !important;
            font-size: 0.85rem !important;
          }
          .history-details {
            min-width: 0 !important;
          }
          .history-name {
            font-size: 0.85rem !important;
            max-width: 110px !important;
          }
          .history-info {
            font-size: 0.7rem !important;
            max-width: 110px !important;
          }
          .history-reconnect-btn {
            padding: 6px 10px !important;
            font-size: 0.7rem !important;
            border-radius: 8px !important;
          }

          /* Quiz Modal responsiveness */
          .quiz-modal-v2 {
            max-width: 330px !important;
          }
          .quiz-grid-v2 {
            display: grid;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
            padding: 5px !important;
          }
          .quiz-grid-v2 button {
            padding: 0.8rem !important;
            border-radius: 12px !important;
            gap: 6px !important;
          }
          .quiz-grid-v2 button span {
            font-size: 1.8rem !important;
          }

          /* Report modal responsiveness */
          .report-modal-content {
            width: 95% !important;
            max-width: 330px !important;
            padding: 20px 15px !important;
            border-radius: 20px !important;
          }
          .reasons-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            margin-bottom: 15px !important;
          }
          .reason-btn {
            padding: 8px !important;
            font-size: 0.75rem !important;
            border-radius: 10px !important;
          }
          .report-details-box {
            height: 80px !important;
            padding: 10px !important;
            font-size: 0.8rem !important;
          }

          /* Toast / Notification responsiveness */
          .toast-stack-container {
            top: 10px !important;
          }
          .premium-toast {
            padding: 10px 14px !important;
            border-radius: 12px !important;
            gap: 8px !important;
          }
          .toast-icon-wrapper {
            width: 26px !important;
            height: 26px !important;
            border-radius: 8px !important;
          }
          .toast-icon {
            font-size: 0.8rem !important;
          }
          .toast-message {
            font-size: 0.75rem !important;
          }
          .toast-close {
            font-size: 1.1rem !important;
          }
          .friend-toast {
            top: 10px !important;
            right: 4% !important;
            left: 4% !important;
            width: 92vw !important;
            padding: 10px 14px !important;
            border-radius: 12px !important;
            font-size: 0.75rem !important;
            box-sizing: border-box !important;
          }
          .report-success-toast {
            padding: 10px 20px !important;
            font-size: 0.8rem !important;
            bottom: -80px !important;
          }
          .report-success-toast.show {
            bottom: 20px !important;
          }
        }
      `}</style>
      </div>
    </>
  );
}
