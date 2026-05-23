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

      <div className="bg-gradient" />

      <div className="login-card">
        <div className="login-header">
          <div className="zonemeet-logo">✨</div>
          <h1>Welcome Back</h1>
          <p>Login to your account to continue</p>
        </div>


        {show2FA ? (
          <div className="forgot-flow">
            <h3>Two-Factor Authentication</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
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
              {error && <div className="error-box mt-4">{error}</div>}
              <button onClick={handle2FASubmit} className="submit-btn" disabled={loading}>
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </div>
            
            {twoFAType === "google" && (
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button 
                  onClick={handleSendBackupOTP} 
                  disabled={backupCooldown > 0 || loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: backupCooldown > 0 ? '#64748b' : '#6366f1',
                    fontSize: '0.9rem',
                    cursor: backupCooldown > 0 ? 'not-allowed' : 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {backupCooldown > 0 
                    ? `Resend available in ${backupCooldown}s` 
                    : "Can't access authenticator? Use email backup code"}
                </button>
              </div>
            )}
            {twoFAType === "email" && (
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button 
                  onClick={handleSendBackupOTP} 
                  disabled={backupCooldown > 0 || loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: backupCooldown > 0 ? '#64748b' : '#6366f1',
                    fontSize: '0.9rem',
                    cursor: backupCooldown > 0 ? 'not-allowed' : 'pointer',
                    textDecoration: 'underline'
                  }}
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
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label>Password</label>
                <span className="forgot-link" onClick={() => setShowForgot(true)}>Forgot?</span>
              </div>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="remember-me" style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem', gap: '8px' }}>
              <input 
                type="checkbox" 
                id="rememberMe" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                style={{ width: '16px', height: '16px', cursor: 'pointer' }} 
              />
              <label htmlFor="rememberMe" style={{ color: '#cbd5e1', fontSize: '0.9rem', cursor: 'pointer', margin: 0 }}>Remember me (keep me logged in)</label>
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
            {forgotError && <div className="error-box mt-4">{forgotError}</div>}
            {forgotSuccess && <div className="success-box mt-4">{forgotSuccess}</div>}
            <button className="back-btn" onClick={() => setShowForgot(false)}>Back to Login</button>
          </div>
        )}

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
          Don't have an account? <span className="highlight" onClick={() => router.push("/signup")}>Sign Up</span>
        </div>
      </div>

      <style jsx>{`
        .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; padding: 20px; position: relative; overflow: hidden; }
        .bg-gradient { position: absolute; width: 200%; height: 200%; background: radial-gradient(circle at center, rgba(99, 102, 241, 0.1) 0%, transparent 50%); animation: rotate 30s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .login-card { width: 100%; max-width: 420px; background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 32px; padding: 2rem; z-index: 1; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); text-align: center; }
        .zonemeet-logo { font-size: 2rem; margin-bottom: 0.5rem; }
        h1 { font-size: 1.5rem; color: white; margin-bottom: 0.2rem; }
        h3 { color: white; margin-bottom: 0.5rem; }
        p { color: #94a3b8; margin-bottom: 1rem; font-size: 0.85rem; }
        .modern-form { text-align: left; }
        .input-item { margin-bottom: 0.8rem; text-align: left; }
        .input-item label { display: block; font-size: 0.8rem; color: #cbd5e1; margin-bottom: 0.3rem; }
        .input-item input { width: 100%; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 0.6rem 1rem; color: white; font-size: 0.9rem; }
        .forgot-link { font-size: 0.8rem; color: #818cf8; cursor: pointer; }
        .submit-btn { width: 100%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; border: none; padding: 0.8rem; border-radius: 16px; font-size: 0.9rem; font-weight: 700; cursor: pointer; margin-top: 0.5rem; transition: all 0.3s; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3); }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(99, 102, 241, 0.4); }
        .back-btn { background: transparent; border: none; color: #94a3b8; margin-top: 0.5rem; cursor: pointer; font-size: 0.85rem; }
        .error-box { background: rgba(239, 68, 68, 0.1); color: #f87171; padding: 0.5rem; border-radius: 12px; margin-bottom: 0.5rem; font-size: 0.8rem; }
        .success-box { background: rgba(34, 197, 94, 0.1); color: #4ade80; padding: 0.5rem; border-radius: 12px; margin-bottom: 0.5rem; font-size: 0.8rem; }
        .login-footer { margin-top: 1rem; color: #64748b; font-size: 0.85rem; }
        .highlight { color: #6366f1; font-weight: 700; cursor: pointer; }
        .google-auth-section { margin-top: 0.5rem; }
        .divider { position: relative; margin: 0.8rem 0; text-align: center; }
        .divider::before { content: ""; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: rgba(255,255,255,0.1); }
        .divider span { position: relative; background: transparent; padding: 0 10px; color: #64748b; font-size: 0.8rem; }
        .google-btn { width: 100%; background: white; color: #1e293b; border: none; padding: 0.6rem; border-radius: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: 0.3s; font-size: 0.9rem; }
        .google-btn:hover:not(:disabled) { background: #f1f5f9; transform: translateY(-1px); }
        .google-btn img { width: 16px; height: 16px; }
        .animate-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .mt-4 { margin-top: 1rem; }
        
        @media (max-width: 768px) {
          .login-container {
            padding: 10px;
          }
          .login-card {
            padding: 2rem 1.5rem;
            width: 100%;
            border-radius: 24px;
          }
          h1 { font-size: 1.5rem; }
          .zonemeet-logo { font-size: 2rem; margin-bottom: 0.5rem; }
          .submit-btn { padding: 0.8rem; }
        }
      `}</style>
    </div>
  );
}
