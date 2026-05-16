import { useState, useEffect } from "react";
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";

export default function Signup() {
  const router = useRouter();
  const { data: session } = useSession();

  const [form, setForm] = useState({ name: "", email: "", password: "", gender: "Male", country: "India" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (session || localStorage.getItem("token")) {
      router.push("/");
    }
  }, [session, router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError("Please accept Terms & Privacy Policy.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post("https://meetzone-backend.onrender.com/api/auth/register", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
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
            <input name="email" type="email" placeholder="your@email.com" value={form.email} onChange={handleChange} required />
          </div>

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

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className={`submit-btn ${!termsAccepted ? 'btn-locked' : ''}`} disabled={loading || !termsAccepted}>
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

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
        .input-item label { display: block; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 0.5rem; }
        .input-item input { width: 100%; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 0.75rem 1rem; color: white; font-size: 1rem; }
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
        .login-footer { margin-top: 2rem; color: #64748b; font-size: 0.9rem; }
        .highlight { color: #6366f1; font-weight: 700; cursor: pointer; }
      `}</style>
    </div>
  );
}
