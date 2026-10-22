import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import { auth, googleProvider } from "../firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import ReCAPTCHA from "react-google-recaptcha";

export default function Signup() {
  const router = useRouter();

  const [form, setForm] = useState({ name: "", email: "", password: "", otp: "", gender: "Male", country: "India" });
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [captcha, setCaptcha] = useState(null);
  const recaptchaRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && token !== "undefined" && token !== "null") {
      router.push("/");
    }
  }, [router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
    if (successMsg) setSuccessMsg("");
  };

  const handleSendOTP = async () => {
    if (!form.email) {
      setError("Please enter your email first.");
      return;
    }
    setOtpLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await axios.post("https://api.zonemeet.chat/api/auth/send-email-otp", { email: form.email });
      if (res.data.success) {
        setOtpSent(true);
        setSuccessMsg("Verification code sent to your email!");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError("Please accept Terms & Privacy Policy.");
      return;
    }
    if (!otpSent) {
      setError("Please verify your email with OTP first.");
      return;
    }
    if (!captcha) {
      setError("Please complete the captcha verification.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post("https://api.zonemeet.chat/api/auth/register", {
        ...form,
        captchaToken: captcha
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/");
    } catch (err) {
      if (recaptchaRef.current) recaptchaRef.current.reset();
      setCaptcha(null);
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");
    let firebaseUser = null;

    try {
      const result = await signInWithPopup(auth, googleProvider);
      firebaseUser = result.user;
    } catch (err) {
      console.error("Firebase Popup Error:", err);
      setError("Google Login window closed or blocked.");
      setLoading(false);
      return;
    }

    try {
      const referralCode = localStorage.getItem("referral") || undefined;
      const res = await axios.post("https://api.zonemeet.chat/api/auth/session-login", {
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        referralCode
      });

      if (res.data.token) {
        localStorage.removeItem("referral");
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        router.push("/");
      }
    } catch (err) {
      console.error("Backend Auth Error:", err);
      const msg = err.response?.data?.message || err.message || "Server connection failed.";
      setError("Backend Error: " + msg);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Head>
        <title>Sign Up | ZoneMeet</title>
      </Head>

      {/* Cyber Tunnel Background */}
      <div className="cyber-tunnel-bg" />
      <div className="bg-overlay" />

      {/* Main Signup Card - Exact Match with Cyan Neon Glowing Border */}
      <div className="login-card">
        <div className="login-header">
          <div className="card-brand-logo">
            <svg width="56" height="52" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 54C16 28 22 8 32 8C42 8 48 28 52 54" stroke="#00f2fe" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M20 54C24 34 28 18 32 8C36 18 40 34 44 54" stroke="#00f2fe" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M14 40C22 46 42 46 50 40" stroke="#00f2fe" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M18 28C24 32 40 32 46 28" stroke="#00f2fe" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M22 54C27 42 37 42 42 54" stroke="#00f2fe" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
            </svg>
          </div>
          <h1>Create Account</h1>
          <p className="sub-title">Join ZoneMeet and start matching today!</p>
        </div>


        <form onSubmit={handleSubmit} className="modern-form">
          <div className="input-item">
            <label>Full Name</label>
            <input name="name" type="text" placeholder="John Doe" value={form.name} onChange={handleChange} required />
          </div>

          <div className="input-item">
            <label>Email Address</label>
            <div className="email-input-group">
              <input name="email" type="email" placeholder="your@email.com" value={form.email} onChange={handleChange} required disabled={otpSent} />
              {!otpSent ? (
                <button type="button" className="otp-btn" onClick={handleSendOTP} disabled={otpLoading}>
                  {otpLoading ? "..." : "Send OTP"}
                </button>
              ) : (
                <span className="verified-badge">✅ Verified</span>
              )}
            </div>
          </div>

          {otpSent && (
            <div className="input-item animate-in">
              <label>Enter 6-Digit OTP</label>
              <input name="otp" type="text" placeholder="123456" maxLength="6" value={form.otp} onChange={handleChange} required />
            </div>
          )}

          <div className="input-item">
            <label>Password</label>
            <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
          </div>

          <div className="terms-container">
            <label className="checkbox-label">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
              <span className="custom-check">{termsAccepted ? "✓" : ""}</span>
              <span className="label-text">
                I agree to the <a href="/terms" target="_blank">Terms & Conditions</a>
              </span>
            </label>
          </div>

          <div className="input-item" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6LcgIfEsAAAAAEc88PHbR5c4Cop_YvXAoO9I3paD"
              onChange={(token) => setCaptcha(token)}
              theme="dark"
            />
          </div>

          {error && <div className="error-box">{error}</div>}
          {successMsg && <div className="success-box">{successMsg}</div>}

          <button type="submit" className={`submit-btn ${(!termsAccepted || !otpSent || !captcha) ? 'btn-locked' : ''}`} disabled={loading || !termsAccepted || !otpSent || !captcha}>
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="google-auth-section">
          <div className="divider">
            <span>or continue with</span>
          </div>
          <button type="button" className="google-btn" onClick={handleGoogleAuth} disabled={loading}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            {loading ? "Connecting..." : "Continue with Google"}
          </button>
        </div>

        <div className="login-footer">
          Already have an account? <span className="highlight" onClick={() => router.push("/login")}>Login</span>
        </div>
      </div>

      {/* Sparkle Star Diamond on Bottom Right */}
      <div className="sparkle-star">✦</div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: #020611;
          padding: 1.5rem 1rem;
          font-family: inherit;
        }

        /* 3D Cyber Tunnel Background */
        .cyber-tunnel-bg {
          position: absolute;
          inset: 0;
          background: url('/cyber-tunnel-bg.jpg') center center / cover no-repeat;
          z-index: 0;
          filter: brightness(0.92) contrast(1.08);
        }

        .bg-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(2, 6, 17, 0.25) 0%, rgba(2, 6, 17, 0.75) 100%);
          z-index: 0;
        }

        /* Sparkle Diamond */
        .sparkle-star {
          position: absolute;
          bottom: 30px;
          right: 40px;
          color: #00f2fe;
          font-size: 26px;
          filter: drop-shadow(0 0 10px #00f2fe);
          opacity: 0.85;
          pointer-events: none;
          z-index: 1;
          animation: sparkleGlow 4s ease-in-out infinite alternate;
        }
        @keyframes sparkleGlow {
          0% { transform: scale(0.9) rotate(0deg); opacity: 0.6; }
          100% { transform: scale(1.15) rotate(15deg); opacity: 1; }
        }

        /* Main Signup Card - Glowing Cyan Neon Border */
        .login-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 410px;
          background: rgba(4, 12, 26, 0.5);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          border: 1.5px solid #00f2fe;
          border-radius: 28px;
          padding: 1.6rem 1.8rem;
          box-shadow: 0 0 24px rgba(0, 242, 254, 0.45), 0 0 60px rgba(0, 242, 254, 0.18), 0 25px 50px rgba(0, 0, 0, 0.85), inset 0 0 15px rgba(0, 242, 254, 0.08);
          text-align: center;
          box-sizing: border-box;
        }

        .login-header {
          margin-bottom: 0.9rem;
        }
        .card-brand-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.4rem;
          filter: drop-shadow(0 0 10px rgba(0, 242, 254, 0.7));
          animation: logoFloat 4s ease-in-out infinite alternate;
        }
        @keyframes logoFloat {
          0% { transform: translateY(0); filter: drop-shadow(0 0 8px rgba(0, 242, 254, 0.6)); }
          100% { transform: translateY(-3px); filter: drop-shadow(0 0 14px rgba(0, 242, 254, 0.9)); }
        }

        h1 {
          font-size: 1.45rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.2rem 0;
          letter-spacing: -0.01em;
        }
        .sub-title {
          color: #94a3b8;
          font-size: 0.82rem;
          margin: 0;
          letter-spacing: 0.01em;
        }

        .modern-form {
          text-align: left;
        }
        .input-item {
          margin-bottom: 0.75rem;
          text-align: left;
        }
        .animate-in {
          animation: slideUp 0.35s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .input-item label {
          display: block;
          font-size: 0.78rem;
          font-weight: 500;
          color: #cbd5e1;
          letter-spacing: 0.01em;
          margin-bottom: 0.25rem;
        }
        .input-item input {
          width: 100%;
          background: rgba(3, 10, 24, 0.8);
          border: 1px solid rgba(56, 189, 248, 0.35);
          border-radius: 12px;
          padding: 0.58rem 0.95rem;
          color: #ffffff;
          font-size: 0.88rem;
          transition: all 0.2s ease;
          box-sizing: border-box;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
        }
        .input-item input:focus {
          outline: none;
          border-color: #00f2fe;
          background: rgba(5, 14, 32, 0.92);
          box-shadow: 0 0 14px rgba(0, 242, 254, 0.45);
        }
        .input-item input::placeholder {
          color: #64748b;
          font-size: 0.82rem;
        }

        .email-input-group {
          display: flex;
          gap: 8px;
        }
        .otp-btn {
          background: linear-gradient(135deg, #0284c7, #0ea5e9);
          border: 1px solid #38bdf8;
          color: #ffffff;
          border-radius: 12px;
          padding: 0 0.9rem;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
          box-shadow: 0 0 10px rgba(14, 165, 233, 0.4);
        }
        .otp-btn:hover:not(:disabled) {
          filter: brightness(1.15);
          box-shadow: 0 0 16px rgba(14, 165, 233, 0.7);
        }
        .otp-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .verified-badge {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
          padding: 0.5rem 0.8rem;
          border-radius: 12px;
          font-size: 0.78rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          border: 1px solid rgba(34, 197, 94, 0.4);
          white-space: nowrap;
        }

        .terms-container {
          margin: 0.7rem 0;
          padding: 0.65rem 0.85rem;
          background: rgba(4, 12, 26, 0.6);
          border: 1px solid rgba(56, 189, 248, 0.25);
          border-radius: 14px;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 0.78rem;
          color: #cbd5e1;
          user-select: none;
        }
        .checkbox-label input[type="checkbox"] {
          display: none;
        }
        .custom-check {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          border: 1.5px solid rgba(56, 189, 248, 0.45);
          background: rgba(3, 10, 24, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          font-weight: 800;
          color: #020617;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .checkbox-label input:checked + .custom-check {
          background: #00f2fe;
          border-color: #00f2fe;
          box-shadow: 0 0 10px rgba(0, 242, 254, 0.5);
        }
        .label-text a {
          color: #38bdf8;
          text-decoration: none;
          font-weight: 600;
        }
        .label-text a:hover {
          color: #00f2fe;
          text-decoration: underline;
        }

        /* Signature Cyan Glowing Button */
        .submit-btn {
          width: 100%;
          background: linear-gradient(90deg, #1e1b4b 0%, #1e3a8a 50%, #0c4a6e 100%);
          color: #ffffff;
          border: 1.5px solid #00f2fe;
          padding: 0.68rem 1rem;
          border-radius: 13px;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 0.35rem;
          transition: all 0.25s ease;
          box-shadow: 0 0 16px rgba(0, 242, 254, 0.5), inset 0 0 8px rgba(0, 242, 254, 0.2);
          letter-spacing: 0.03em;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 0 25px rgba(0, 242, 254, 0.8), inset 0 0 12px rgba(0, 242, 254, 0.35);
          filter: brightness(1.15);
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .btn-locked {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none !important;
          filter: grayscale(0.4);
        }

        .error-box {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
          padding: 0.5rem 0.8rem;
          border-radius: 10px;
          margin-bottom: 0.6rem;
          font-size: 0.78rem;
        }
        .success-box {
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.35);
          color: #86efac;
          padding: 0.5rem 0.8rem;
          border-radius: 10px;
          margin-bottom: 0.6rem;
          font-size: 0.78rem;
        }

        .google-auth-section {
          margin-top: 0.5rem;
        }
        .divider {
          position: relative;
          margin: 0.7rem 0;
          text-align: center;
        }
        .divider::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(255, 255, 255, 0.12);
        }
        .divider span {
          position: relative;
          background: rgba(4, 12, 26, 0.6);
          padding: 0 12px;
          color: #94a3b8;
          font-size: 0.76rem;
          letter-spacing: 0.02em;
        }

        .google-btn {
          width: 100%;
          background: #ffffff;
          color: #0f172a;
          border: none;
          padding: 0.62rem 1rem;
          border-radius: 12px;
          font-size: 0.86rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        }
        .google-btn:hover:not(:disabled) {
          background: #f8fafc;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
        }
        .google-btn img {
          width: 17px;
          height: 17px;
        }

        .login-footer {
          margin-top: 0.85rem;
          color: #94a3b8;
          font-size: 0.8rem;
        }
        .highlight {
          color: #00f2fe;
          font-weight: 600;
          cursor: pointer;
          margin-left: 4px;
          transition: all 0.2s;
        }
        .highlight:hover {
          color: #38bdf8;
          text-decoration: underline;
          text-shadow: 0 0 8px rgba(0, 242, 254, 0.5);
        }

        @media (max-width: 768px) {
          .login-container {
            padding: 1rem 0.75rem;
          }
          .login-card {
            width: 100%;
            max-width: 350px;
            padding: 1.3rem 1.2rem;
            border-radius: 22px;
          }
          .sparkle-star {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}