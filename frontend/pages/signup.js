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
    if (localStorage.getItem("token")) {
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
      const res = await axios.post("https://meetzone-backend.onrender.com/api/auth/send-email-otp", { email: form.email });
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
      const res = await axios.post("https://meetzone-backend.onrender.com/api/auth/register", {
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
      const res = await axios.post("https://meetzone-backend.onrender.com/api/auth/session-login", {
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

      <div className="bg-gradient" />

      <div className="login-card">
        <div className="login-header">
          <div className="zonemeet-logo">✨</div>
          <h1>Create Account</h1>
          <p>Join ZoneMeet and start matching today!</p>
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

      <style jsx>{`
        .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; padding: 20px; position: relative; overflow: hidden; }
        .bg-gradient { position: absolute; width: 200%; height: 200%; background: radial-gradient(circle at center, rgba(99, 102, 241, 0.1) 0%, transparent 50%); animation: rotate 30s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .login-card { width: 100%; max-width: 420px; background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 32px; padding: 3rem; z-index: 1; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); text-align: center; }
        .zonemeet-logo { font-size: 2.5rem; margin-bottom: 1rem; }
        h1 { font-size: 1.75rem; color: white; margin-bottom: 0.5rem; }
        p { color: #94a3b8; margin-bottom: 2rem; font-size: 0.95rem; }
        .modern-form { text-align: left; }
        .input-item { margin-bottom: 1.25rem; }
        .animate-in { animation: slideUp 0.4s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .input-item label { display: block; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 0.5rem; }
        .input-item input { width: 100%; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 0.75rem 1rem; color: white; font-size: 1rem; }
        .email-input-group { display: flex; gap: 10px; }
        .otp-btn { background: #6366f1; color: white; border: none; border-radius: 12px; padding: 0 1rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: 0.3s; }
        .otp-btn:hover { background: #4f46e5; }
        .verified-badge { background: rgba(34, 197, 94, 0.1); color: #4ade80; padding: 0.5rem 1rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; border: 1px solid rgba(34, 197, 94, 0.2); }
        .terms-container { margin: 1.5rem 0; padding: 1rem; background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 16px; }
        .checkbox-label { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.85rem; color: #94a3b8; user-select: none; }
        .checkbox-label input[type="checkbox"] { display: none; }
        .custom-check { width: 22px; height: 22px; border-radius: 6px; border: 2px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: white; flex-shrink: 0; transition: all 0.3s; }
        .checkbox-label input:checked + .custom-check { background: #6366f1; border-color: #6366f1; }
        .label-text a { color: #818cf8; text-decoration: none; font-weight: 600; }
        .submit-btn { width: 100%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; border: none; padding: 1rem; border-radius: 16px; font-size: 1rem; font-weight: 700; cursor: pointer; margin-top: 1rem; transition: all 0.3s; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3); }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(99, 102, 241, 0.4); }
        .submit-btn.btn-locked { background: rgba(255,255,255,0.05) !important; color: #475569; cursor: not-allowed; }
        .error-box { background: rgba(239, 68, 68, 0.1); color: #f87171; padding: 0.75rem; border-radius: 12px; margin-bottom: 1rem; font-size: 0.85rem; }
        .success-box { background: rgba(34, 197, 94, 0.1); color: #4ade80; padding: 0.75rem; border-radius: 12px; margin-bottom: 1rem; font-size: 0.85rem; }
        .login-footer { margin-top: 2rem; color: #64748b; font-size: 0.9rem; }
        .google-auth-section { margin-top: 1.5rem; }
        .divider { position: relative; margin: 1.5rem 0; text-align: center; }
        .divider::before { content: ""; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: rgba(255,255,255,0.1); }
        .divider span { position: relative; background: #1e293b; padding: 0 10px; color: #64748b; font-size: 0.85rem; }
        .google-btn { width: 100%; background: white; color: #1e293b; border: none; padding: 0.75rem; border-radius: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: 0.3s; }
        .google-btn:hover:not(:disabled) { background: #f1f5f9; transform: translateY(-1px); }
        .google-btn img { width: 18px; height: 18px; }
        .highlight { color: #6366f1; font-weight: 700; cursor: pointer; }
        
        @media (max-width: 480px) {
          .login-card {
            padding: 2rem 1.5rem;
            width: 95%;
          }
          h1 { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  );
}
