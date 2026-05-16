import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import { Country, State } from "country-state-city";
import Script from "next/script";

let socket;

const GENDERS = [
  { id: "all", name: "All Genders", icon: "🚻" },
  { id: "male", name: "Male Only", icon: "👨" },
  { id: "female", name: "Female Only", icon: "👩" },
];

const AGES = ["All Ages", "18-24", "25-34", "35-44", "45-54", "55+"];

// Preload Anime Filter Image
let animeImg;
if (typeof window !== "undefined") {
  animeImg = new Image();
  animeImg.src = "/anime.png";
}

const STICKERS = [
  { id: 'heart', icon: '💖', price: 10, label: 'Love' },
  { id: 'rose', icon: '🌹', price: 50, label: 'Rose' },
  { id: 'crown', icon: '👑', price: 100, label: 'Crown' },
  { id: 'diamond', icon: '💎', price: 500, label: 'Diamond' },
  { id: 'car', icon: '🏎️', price: 1000, label: 'Super Car' },
  { id: 'ring', icon: '💍', price: 2000, label: 'Engagement' },
  { id: 'castle', icon: '🏰', price: 5000, label: 'Castle' },
  { id: 'rocket', icon: '🚀', price: 10000, label: 'Rocket' },
];

const FILTERS_DATA = [
  { id: "None", name: "No Filter", icon: "🔄", cost: 0, category: "None" },
  { id: "Smooth", name: "Skin Smooth", icon: "✨", cost: 80, category: "Beauty" },
  { id: "Glow", name: "Glow", icon: "🌟", cost: 50, category: "Beauty" },
  { id: "Whitening", name: "Whitening", icon: "🥛", cost: 100, category: "Beauty" },
  { id: "Dog", name: "Dog Ears", icon: "🐶", cost: 50, category: "Funny" },
  { id: "Cat", name: "Cat Face", icon: "🐱", cost: 60, category: "Funny" },
  { id: "Beard", name: "Beard", icon: "🧔", cost: 90, category: "Funny" },
  { id: "Glasses", name: "Thug Glasses", icon: "🕶️", cost: 80, category: "Funny" },
  { id: "Anime", name: "Anime", icon: "🌸", cost: 200, category: "Premium" },
  { id: "Cyber", name: "Cyberpunk", icon: "🦾", cost: 150, category: "Premium" },
  { id: "Neon", name: "Neon Mask", icon: "👺", cost: 180, category: "Premium" },
  { id: "Hearts", name: "Hearts", icon: "💕", cost: 70, category: "Couple" },
  { id: "Fire", name: "Fire", icon: "🔥", cost: 90, category: "Couple" },
  { id: "Love", name: "Love Frame", icon: "💖", cost: 110, category: "Couple" }
];

export default function ChatV2() {
  const { data: session } = useSession();
  const router = useRouter();

  // Authentication & Profile
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Matchmaking State
  const [isMatching, setIsMatching] = useState(false);
  const [status, setStatus] = useState("Ready to match...");
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [partnerId, setPartnerId] = useState(null);
  const [matchStartTime, setMatchStartTime] = useState(null);

  // WebRTC Refs
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerConnection = useRef(null);
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  const activeFilterRef = useRef("None");
  const onResultsRef = useRef(null);

  // State for Identity/Tools
  const [activeMediaPipeFilter, setActiveMediaPipeFilter] = useState("None");
  const [activeVoice, setActiveVoice] = useState("Normal");
  const [activeMask, setActiveMask] = useState("None");
  const [activeAvatar, setActiveAvatar] = useState("None");
  const [activeIdentityMenu, setActiveIdentityMenu] = useState(null); 
  const [isFaceBlurred, setIsFaceBlurred] = useState(false);

  // UI State
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [gender, setGender] = useState("all");
  const [country, setCountry] = useState("all");
  const [stateProv, setStateProv] = useState("All States");
  const [age, setAge] = useState("All Ages");
  const [showGenderDrop, setShowGenderDrop] = useState(false);
  const [showCountryDrop, setShowCountryDrop] = useState(false);
  const [showStateDrop, setShowStateDrop] = useState(false);
  const [showAgeDrop, setShowAgeDrop] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  // NSFW & Safety
  const nsfwModel = useRef(null);
  const [showNSFWWarning, setShowNSFWWarning] = useState(false);

  // Reporting
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [showReportSuccess, setShowReportSuccess] = useState(false);

  // Gifts
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [receivedGift, setReceivedGift] = useState(null);

  // Unlocked items
  const [unlockedFilters, setUnlockedFilters] = useState(["None"]);

  // Sync Video Mirroring
  useEffect(() => {
    if (localVideo.current) localVideo.current.className = "mirrored";
    if (canvasRef.current) canvasRef.current.className = "mirrored";
  }, []);

  useEffect(() => {
    activeFilterRef.current = activeMediaPipeFilter;
  }, [activeMediaPipeFilter]);

  // --- FILTER DRAWING FUNCTIONS ---

  const drawAnimeFilter = (ctx, landmarks, w, h) => {
    if (!animeImg || !animeImg.complete) {
      const forehead = landmarks[10];
      ctx.font = `${w * 0.3}px serif`;
      ctx.fillText("🌸", forehead.x * w - (w * 0.15), forehead.y * h - (h * 0.1));
      return;
    }
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const top = landmarks[10];
    const bottom = landmarks[152];
    const eyeX = leftEye.x * w;
    const eyeY = leftEye.y * h;
    const rightX = rightEye.x * w;
    const faceWidth = Math.abs(rightX - eyeX) * 2;
    const faceHeight = Math.abs(bottom.y - top.y) * h;
    ctx.drawImage(animeImg, eyeX - faceWidth * 0.25, eyeY - faceHeight * 0.6, faceWidth * 1.5, faceHeight * 1.5);
  };

  const onResults = (results) => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const w = cvs.width;
    const h = cvs.height;
    if (!w || !h) return;

    ctx.clearRect(0, 0, w, h);

    const filter = activeFilterRef.current;
    if (filter === "None") return;

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      switch (filter) {
        case "Anime": drawAnimeFilter(ctx, landmarks, w, h); break;
        // Other filters can be restored similarly
      }
    }
  };

  useEffect(() => {
    onResultsRef.current = onResults;
  }, []);

  // ROBUST MANUAL FACE TRACKING
  useEffect(() => {
    let faceMesh = null;
    let animationFrameId = null;

    const detectFace = async () => {
      if (localVideo.current && faceMeshRef.current) {
        if (localVideo.current.readyState >= 2) {
          try {
            await faceMeshRef.current.send({ image: localVideo.current });
          } catch (e) {}
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
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.8,
        });
        faceMesh.onResults((res) => {
          if (onResultsRef.current) onResultsRef.current(res);
        });
        faceMeshRef.current = faceMesh;
        detectFace();
      } catch (err) {
        console.error("Init error", err);
      }
    };

    init();
    return () => {
      if (faceMesh) faceMesh.close();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // ... Rest of component ...
  // To avoid breaking the file, I will use a multi_replace_file_content instead 
  // of write_to_file for the whole thing.

  return null; // This was just a template thought
}
