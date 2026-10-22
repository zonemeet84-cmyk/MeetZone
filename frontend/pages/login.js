import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import { auth, googleProvider } from "../firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import ReCAPTCHA from "react-google-recaptcha";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [captcha, setCaptcha] = useState(null);
  const recaptchaRef = useRef();

  // 2FA State
  const [show2FA, setShow2FA] = useState(false);
  const [twoFAType, setTwoFAType] = useState(""); // "google" or "email"
  const [twoFAEmail, setTwoFAEmail] = useState("");
  const [twoFAToken, setTwoFAToken] = useState("");
  const [backupCooldown, setBackupCooldown] = useState(0);

  // Forgot Password State
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  useEffect(() => {
    let timer;
    if (backupCooldown > 0) {
      timer = setInterval(() => {
        setBackupCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [backupCooldown]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && token !== "undefined" && token !== "null") {
      router.push("/");
    }
  }, [router]);

  const handleSendBackupOTP = async () => {
    if (backupCooldown > 0) return;
    setLoading(true);
    setError("");
    try {
      await axios.post("https://api.zonemeet.chat/api/auth/2fa/send-backup-otp", { email: twoFAEmail });
      setTwoFAType("email");
      setBackupCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send backup code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captcha) {
      setError("Please complete the captcha verification.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("https://api.zonemeet.chat/api/auth/login", {
        identifier,
        password,
        captchaToken: captcha,
        rememberMe
      }, { withCredentials: true });

      if (res.data.requires2FA) {
        setTwoFAType(res.data.type);
        setTwoFAEmail(res.data.email);
        setShow2FA(true);
        setLoading(false);
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/");
    } catch (err) {
      if (recaptchaRef.current) recaptchaRef.current.reset();
      setCaptcha(null);
      if (err.response?.status === 400 && err.response?.data?.message === "User not found") {
        setError("Account not found. Please Sign Up first to create your account.");
      } else {
        setError(err.response?.data?.message || "Login failed. Please check your credentials.");
      }
    } finally {
      if (!show2FA) setLoading(false);
    }
  };

  const handle2FASubmit = async () => {
    if (!twoFAToken) return setError("Please enter the verification code");
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("https://api.zonemeet.chat/api/auth/2fa/login-verify", {
        email: twoFAEmail,
        token: twoFAToken,
        type: twoFAType,
        rememberMe
      }, { withCredentials: true });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code");
      setLoading(false);
    }
  };

  const handleSendResetOTP = async () => {
    if (!forgotEmail) return setForgotError("Please enter your email");
    setForgotLoading(true);
    setForgotError("");
    try {
      await axios.post("https://api.zonemeet.chat/api/auth/forgot-password", { email: forgotEmail });
      setForgotStep(2);
      setForgotSuccess("Reset code sent to your email!");
    } catch (err) {
      setForgotError(err.response?.data?.message || "Failed to send reset code");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotOtp || !newPassword) return setForgotError("All fields are required");
    setForgotLoading(true);
    setForgotError("");
    try {
      await axios.post("https://api.zonemeet.chat/api/auth/reset-password", { 
        email: forgotEmail, 
        otp: forgotOtp, 
        newPassword 
      });
      setForgotSuccess("Password reset successful! You can now login.");
      setTimeout(() => setShowForgot(false), 2000);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Reset failed");
    } finally {
      setForgotLoading(false);
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
        referralCode,
        rememberMe
      }, { withCredentials: true });

      if (res.data.requires2FA) {
        setTwoFAType(res.data.type);
        setTwoFAEmail(res.data.email);
        setShow2FA(true);
        setLoading(false);
        return;
      }

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
        <title>Login | ZoneMeet</title>
      </Head>

      {/* Cyber Tunnel Background */}
      <div className="cyber-tunnel-bg" />
      <div className="bg-overlay" />

      {/* Main Login Card - Exact Match with Cyan Neon Glowing Border */}
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
          <h1>Welcome Back</h1>
          <p className="sub-title">Secure access for your team</p>
        </div>

        {show2FA ? (
          <div className="forgot-flow">
            <h3>Two-Factor Authentication</h3>
            <p className="two-fa-info">
              {twoFAType === "google" 
                ? "Enter the 6-digit code from your Google Authenticator app." 
                : "Enter the 6-digit verification code sent to your email."}
            </p>
            <div className="input-item animate-in">
              <label>Authentication Code</label>
              <input 
                type="text" 
                placeholder="123456" 
                maxLength="6" 
                value={twoFAToken} 
                onChange={(e) => setTwoFAToken(e.target.value)} 
                autoFocus
              />
              {error && <div className="error-box mt-2">{error}</div>}
              <button onClick={handle2FASubmit} className="submit-btn" disabled={loading}>
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </div>
            
            {twoFAType === "google" && (
              <div className="backup-row">
                <button 
                  onClick={handleSendBackupOTP} 
                  disabled={backupCooldown > 0 || loading}
                  className="link-btn"
                >
                  {backupCooldown > 0 
                    ? `Resend available in ${backupCooldown}s` 
                    : "Can't access authenticator? Use email backup code"}
                </button>
              </div>
            )}
            {twoFAType === "email" && (
              <div className="backup-row">
                <button 
                  onClick={handleSendBackupOTP} 
                  disabled={backupCooldown > 0 || loading}
                  className="link-btn"
                >
                  {backupCooldown > 0 
                    ? `Resend email in ${backupCooldown}s` 
                    : "Resend email code"}
                </button>
              </div>
            )}

            <button className="back-btn" onClick={() => { setShow2FA(false); setTwoFAToken(""); setBackupCooldown(0); }}>Cancel</button>
          </div>
        ) : !showForgot ? (
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="input-item">
              <label>Email or Phone</label>
              <input type="text" placeholder="your@email.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            </div>

            <div className="input-item">
              <div className="input-header">
                <label>Password</label>
                <span className="forgot-link" onClick={() => setShowForgot(true)}>Forgot Password</span>
              </div>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="remember-me">
              <input 
                type="checkbox" 
                id="rememberMe" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
              />
              <label htmlFor="rememberMe">Remember me (keep me logged in)</label>
            </div>

            <div className="recaptcha-wrapper">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey="6LcgIfEsAAAAAEc88PHbR5c4Cop_YvXAoO9I3paD"
                onChange={(token) => setCaptcha(token)}
                theme="dark"
              />
            </div>

            {error && <div className="error-box">{error}</div>}

            <button type="submit" className={`submit-btn ${!captcha ? 'btn-locked' : ''}`} disabled={loading || !captcha}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        ) : (
          <div className="forgot-flow">
            <h3>Reset Password</h3>
            {forgotStep === 1 ? (
              <div className="input-item animate-in">
                <label>Email Address</label>
                <input type="email" placeholder="Enter your email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
                <button onClick={handleSendResetOTP} className="submit-btn" disabled={forgotLoading}>
                  {forgotLoading ? "..." : "Send Reset Code"}
                </button>
              </div>
            ) : (
              <div className="animate-in">
                <div className="input-item">
                  <label>Verification Code</label>
                  <input type="text" placeholder="123456" maxLength="6" value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value)} />
                </div>
                <div className="input-item">
                  <label>New Password</label>
                  <input type="password" placeholder="Min 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <button onClick={handleResetPassword} className="submit-btn" disabled={forgotLoading}>
                  {forgotLoading ? "..." : "Reset Password"}
                </button>
              </div>
            )}
            {forgotError && <div className="error-box mt-2">{forgotError}</div>}
            {forgotSuccess && <div className="success-box mt-2">{forgotSuccess}</div>}
            <button className="back-btn" onClick={() => setShowForgot(false)}>Back to Login</button>
          </div>
        )}

        <div className="google-auth-section">
          <div className="divider">
            <span>or continue with</span>
          </div>
          <button type="button" className="google-btn" onClick={handleGoogleAuth} disabled={loading}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            <span>{loading ? "Connecting..." : "Continue with Google"}</span>
          </button>
        </div>

        <div className="login-footer">
          Don't have an account? <span className="highlight" onClick={() => router.push("/signup")}>Sign Up</span>
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

        /* 3D Cyber Tunnel Background from Image */
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

        /* Main Login Card - Glowing Cyan Neon Border */
        .login-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 385px;
          background: rgba(4, 12, 26, 0.45);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          border: 1.5px solid #00f2fe;
          border-radius: 28px;
          padding: 1.6rem 1.7rem;
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
        h3 {
          font-size: 1.15rem;
          color: #ffffff;
          margin: 0 0 0.35rem 0;
        }
        .sub-title {
          color: #94a3b8;
          font-size: 0.82rem;
          margin: 0;
          letter-spacing: 0.01em;
        }
        .two-fa-info {
          color: #cbd5e1;
          font-size: 0.82rem;
          margin-bottom: 1rem;
        }

        .modern-form {
          text-align: left;
        }
        .input-item {
          margin-bottom: 0.75rem;
          text-align: left;
        }
        .input-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.3rem;
        }
        .input-item label {
          display: block;
          font-size: 0.78rem;
          font-weight: 500;
          color: #cbd5e1;
          letter-spacing: 0.01em;
          margin-bottom: 0.25rem;
        }
        .input-header label {
          margin-bottom: 0;
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

        .forgot-link {
          font-size: 0.76rem;
          color: #38bdf8;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }
        .forgot-link:hover {
          color: #00f2fe;
          text-decoration: underline;
          text-shadow: 0 0 8px rgba(0, 242, 254, 0.5);
        }

        .remember-me {
          display: flex;
          align-items: center;
          margin-bottom: 0.7rem;
          gap: 8px;
          user-select: none;
        }
        .remember-me input {
          width: 15px;
          height: 15px;
          accent-color: #00f2fe;
          cursor: pointer;
          border-radius: 4px;
        }
        .remember-me label {
          color: #e2e8f0;
          font-size: 0.8rem;
          cursor: pointer;
          margin: 0;
        }

        .recaptcha-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 78px;
          margin-bottom: 0.65rem;
        }

        /* Exact Signature Login Button with Neon Cyan Border */
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
          padding: 0 10px;
          color: #64748b;
          font-size: 0.75rem;
        }

        .google-auth-section {
          margin-top: 0.3rem;
        }
        .google-btn {
          width: 100%;
          background: rgba(10, 20, 38, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #ffffff;
          padding: 0.62rem 1rem;
          border-radius: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.25s ease;
          font-size: 0.86rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .google-btn:hover:not(:disabled) {
          background: rgba(18, 32, 60, 0.85);
          border-color: rgba(0, 242, 254, 0.45);
          box-shadow: 0 0 14px rgba(0, 242, 254, 0.25);
          transform: translateY(-1px);
        }
        .google-btn img {
          width: 16px;
          height: 16px;
        }

        .login-footer {
          margin-top: 0.8rem;
          color: #94a3b8;
          font-size: 0.8rem;
        }
        .highlight {
          color: #00f2fe;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }
        .highlight:hover {
          color: #38bdf8;
          text-shadow: 0 0 8px rgba(0, 242, 254, 0.6);
        }

        .back-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          margin-top: 0.5rem;
          cursor: pointer;
          font-size: 0.8rem;
          transition: 0.2s;
        }
        .back-btn:hover {
          color: #ffffff;
        }
        .link-btn {
          background: none;
          border: none;
          color: #38bdf8;
          font-size: 0.78rem;
          cursor: pointer;
          text-decoration: underline;
        }
        .backup-row {
          margin-top: 0.75rem;
          text-align: center;
        }

        .error-box {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 0.45rem 0.75rem;
          border-radius: 10px;
          margin-bottom: 0.5rem;
          font-size: 0.78rem;
        }
        .success-box {
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #86efac;
          padding: 0.45rem 0.75rem;
          border-radius: 10px;
          margin-bottom: 0.5rem;
          font-size: 0.78rem;
        }
        .mt-2 { margin-top: 0.5rem; }
        .animate-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

        /* ULTRA COMPACT MOBILE RESPONSIVENESS */
        @media (max-width: 480px) {
          .login-container {
            padding: 12px 14px;
            align-items: center;
            justify-content: center;
          }
          .login-card {
            padding: 1.15rem 1.1rem;
            width: 90%;
            max-width: 320px;
            border-radius: 22px;
            margin: auto;
          }
          .login-header {
            margin-bottom: 0.6rem;
          }
          .card-brand-logo svg {
            width: 44px;
            height: 40px;
          }
          h1 {
            font-size: 1.2rem;
            margin-bottom: 2px;
          }
          .sub-title {
            font-size: 0.74rem;
          }
          .input-item {
            margin-bottom: 0.52rem;
          }
          .input-item label {
            font-size: 0.72rem;
            margin-bottom: 2px;
          }
          .input-item input {
            padding: 0.48rem 0.78rem;
            font-size: 0.82rem;
            height: 35px;
            border-radius: 9px;
          }
          .forgot-link {
            font-size: 0.72rem;
          }
          .remember-me {
            margin-bottom: 0.55rem;
            gap: 6px;
          }
          .remember-me label {
            font-size: 0.74rem;
          }
          .remember-me input {
            width: 14px;
            height: 14px;
          }
          .recaptcha-wrapper {
            transform: scale(0.77);
            transform-origin: center center;
            height: 60px;
            margin-bottom: 0.35rem;
          }
          .submit-btn {
            padding: 0.55rem 0.85rem;
            font-size: 0.84rem;
            height: 36px;
            border-radius: 10px;
            margin-top: 0.15rem;
          }
          .divider {
            margin: 0.45rem 0;
          }
          .divider span {
            font-size: 0.7rem;
            padding: 0 8px;
          }
          .google-btn {
            padding: 0.5rem 0.85rem;
            font-size: 0.82rem;
            height: 35px;
            border-radius: 10px;
            gap: 8px;
          }
          .google-btn img {
            width: 14px;
            height: 14px;
          }
          .login-footer {
            margin-top: 0.6rem;
            font-size: 0.74rem;
          }
          .error-box, .success-box {
            padding: 0.35rem 0.55rem;
            font-size: 0.72rem;
            margin-bottom: 0.4rem;
            border-radius: 8px;
          }
        }
      `}</style>
    </div>
  );
}
