import { useState, useEffect } from "react";
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";

export default function Login() {
  const router = useRouter();
  const { callbackUrl } = router.query;
  const { data: session } = useSession();

  const [form, setForm] = useState({ emailOrPhone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!termsAccepted) {
      setError("Please accept Terms & Privacy Policy to continue.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = { identifier: form.emailOrPhone, password: form.password };
      const res = await axios.post("https://meetzone-backend.onrender.com/api/auth/login", payload);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === "User not found") {
        setError("Account not found. Please Sign Up first to create your account.");
      } else {
        setError(err.response?.data?.message || "Login failed. Please check your credentials.");
      }
    } finally {
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
          <p>Login to your account to start matching</p>
        </div>

        <div className="social-quick-login">
          <button className="social-pill" onClick={() => signIn("google")} disabled={!termsAccepted}>
            <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" />
            Google
          </button>
          <button className="social-pill" onClick={() => alert("Apple Login coming soon!")} disabled={!termsAccepted}>
            <img src="https://www.svgrepo.com/show/511330/apple-fill.svg" alt="Apple" />
            Apple
          </button>
        </div>

        <div className="divider">
          <span>OR LOGIN WITH CREDENTIALS</span>
        </div>

        <form onSubmit={handleSubmit} className="modern-form">
          <div className="input-item">
            <label>Email Address</label>
            <input name="emailOrPhone" type="email" placeholder="your@email.com" value={form.emailOrPhone} onChange={handleChange} required />
          </div>

          <div className="input-item">
            <label>Password</label>
            <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
          </div>

          <div className="terms-container">
            <label className="checkbox-label">
              <input type="checkbox" id="agreeTerms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
              <span className="custom-check">{termsAccepted ? "✓" : ""}</span>
              <span className="label-text">
                I agree to the <a href="/terms" target="_blank">Terms & Conditions</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
              </span>
            </label>
          </div>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className={`submit-btn ${!termsAccepted ? 'btn-locked' : ''}`} disabled={loading || !termsAccepted}>
            {!termsAccepted ? "🔒 Accept Terms to Continue" : loading ? "Logging in..." : "Login to ZoneMeet"}
          </button>
        </form>

        <div className="login-footer">
          Don't have an account? <span className="highlight" onClick={() => router.push("/signup")}>Sign Up</span> or <span className="highlight" onClick={() => signIn("google")}>with Google</span>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f172a;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        .bg-gradient {
          position: absolute;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at center, rgba(99, 102, 241, 0.1) 0%, transparent 50%);
          animation: rotate 30s linear infinite;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          padding: 3rem;
          z-index: 1;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          text-align: center;
        }

        .zonemeet-logo { font-size: 2.5rem; margin-bottom: 1rem; }
        h1 { font-size: 1.75rem; color: white; margin-bottom: 0.5rem; }
        p { color: #94a3b8; margin-bottom: 2rem; font-size: 0.95rem; }

        .social-quick-login { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
        .social-pill {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 0.75rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          font-weight: 600;
        }
        .social-pill img { width: 18px; height: 18px; }

        .divider { display: flex; align-items: center; margin: 1.5rem 0; color: #475569; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; }
        .divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: rgba(255, 255, 255, 0.1); }
        .divider span { padding: 0 1rem; }

        .modern-form { text-align: left; }
        .input-item { margin-bottom: 1.25rem; }
        .input-item label { display: block; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 0.5rem; }
        .input-item input {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          color: white;
          font-size: 1rem;
        }

        .terms-container { margin: 1.5rem 0; padding: 1rem; background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 16px; }
        .checkbox-label { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.85rem; color: #94a3b8; user-select: none; }
        .checkbox-label input[type="checkbox"] { display: none; }
        .custom-check { width: 22px; height: 22px; border-radius: 6px; border: 2px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: white; flex-shrink: 0; transition: all 0.3s; }
        .checkbox-label input:checked + .custom-check { background: #6366f1; border-color: #6366f1; box-shadow: 0 0 12px rgba(99,102,241,0.4); }
        .label-text { line-height: 1.4; }
        .label-text a { color: #818cf8; text-decoration: none; font-weight: 600; }
        .label-text a:hover { text-decoration: underline; }

        .submit-btn {
          width: 100%;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          border: none;
          padding: 1rem;
          border-radius: 16px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 1rem;
          transition: all 0.3s;
          box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(99, 102, 241, 0.4); }
        .submit-btn.btn-locked {
          background: rgba(255,255,255,0.05) !important;
          color: #475569;
          box-shadow: none;
          cursor: not-allowed;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .social-pill:disabled { opacity: 0.4; cursor: not-allowed; filter: grayscale(1); }
        .error-box { background: rgba(239, 68, 68, 0.1); color: #f87171; padding: 0.75rem; border-radius: 12px; margin-bottom: 1rem; font-size: 0.85rem; }
        .login-footer { margin-top: 2rem; color: #64748b; font-size: 0.9rem; }
        .highlight { color: #6366f1; font-weight: 700; cursor: pointer; }
      `}</style>
    </div>
  );
}
