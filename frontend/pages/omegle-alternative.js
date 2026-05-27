import Head from "next/head";
import Link from "next/link";

export default function OmegleAlternative() {
  return (
    <div className="landing-wrap">
      <Head>
        <title>The Best Omegle Alternative: Secure Live Video Chat | ZoneMeet</title>
        <meta name="description" content="Looking for a safe, moderated, and high-quality Omegle alternative? Talk to strangers and meet new people online with ZoneMeet's secure live video chat." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      {/* DYNAMIC SPHERES */}
      <div className="sphere s1" />
      <div className="sphere s2" />
      <div className="sphere s3" />
      <div className="grid-overlay" />

      <div className="landing-inner">
        {/* NAV */}
        <nav className="top-nav">
          <Link href="/" className="logo">
            Zone<span>Meet</span>
          </Link>
          <Link href="/" className="back-btn">
            ← Live Video Chat
          </Link>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="badge">🚀 THE PREMIER SUCCESSOR</div>
          <h1>The Ultimate<br /><span>Omegle Alternative.</span></h1>
          <p className="hero-sub">
            The era of unsafe random video chats is over. Welcome to ZoneMeet — a secure, moderated, 
            and modern communication platform built to help you talk to strangers and meet new people 
            online in a safe environment.
          </p>
          <div className="hero-btns">
            <Link href="/" className="btn-primary">
              Start Live Video Chat Now
            </Link>
          </div>
        </section>

        {/* FEATURES ROW */}
        <section className="features-grid">
          <div className="feat-card">
            <div className="feat-icon">🛡️</div>
            <h3>AI Guardian Moderation</h3>
            <p>Our real-time AI moderation tracks and flags inappropriate content, creating a safe space for respectful conversations.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🌍</div>
            <h3>190+ Countries</h3>
            <p>Talk to strangers globally, practice new languages, expand your professional circle, and make friends worldwide.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">⚡</div>
            <h3>Instant P2P Video</h3>
            <p>Built on cutting-edge WebRTC technology for ultra-low latency, crisp HD video, and crystal clear voice connections.</p>
          </div>
        </section>

        <div className="divider" />

        {/* WHY ZONEMEET IS BETTER THAN OMEGLE */}
        <section className="compare-section">
          <div className="section-header">
            <h2>Why ZoneMeet is the successor you need</h2>
            <p>Omegle closed its doors, but the desire for global connection lives on. Here is why ZoneMeet is the next generation platform.</p>
          </div>
          <div className="compare-grid">
            <div className="compare-card">
              <span className="bullet">⚡</span>
              <div>
                <strong>Say Goodbye to Spambots</strong>
                <p>We implement active account verification to prevent automated bots and fake streams, ensuring you only pair with real, verified people.</p>
              </div>
            </div>
            <div className="compare-card">
              <span className="bullet">🔒</span>
              <div>
                <strong>Absolute Privacy Protection</strong>
                <p>All video chat streams are fully encrypted and peer-to-peer. We do not store your private logs, preserving your personal security.</p>
              </div>
            </div>
            <div className="compare-card">
              <span className="bullet">💬</span>
              <div>
                <strong>Smart Professional Circle</strong>
                <p>Found a great connection? Easily add them to your global circle. Stay in touch and enjoy unlimited direct calls for free later.</p>
              </div>
            </div>
            <div className="compare-card">
              <span className="bullet">🪙</span>
              <div>
                <strong>Fair Play Economy</strong>
                <p>Maintain your daily login streaks, invite companions, and collect coins to unlock premium features and fun customization.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* HOW TO START */}
        <section className="steps-section">
          <div className="section-header">
            <h2>How to talk to strangers on ZoneMeet</h2>
            <p>Connect with friendly people globally in three simple steps.</p>
          </div>
          <div className="steps-container">
            <div className="step">
              <span className="num">1</span>
              <h4>Quick Sign Up</h4>
              <p>Register safely using Google or email verification. Set up your basic profile details in seconds.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="num">2</span>
              <h4>Select Filters</h4>
              <p>Customize your language, gender preferences, or region settings to match with relevant conversationalists.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="num">3</span>
              <h4>Instant Matching</h4>
              <p>Hit "Connect Now" to jump into high-quality live video chat rooms. Swap, chat, or add friends instantly.</p>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* 18+ RULES ACCESSIBILITY */}
        <section className="safety-section">
          <div className="safety-box">
            <div className="safety-title">
              <span>🔞</span>
              <h2>Strictly 18+ Safe & Respectful Community</h2>
            </div>
            <p>
              ZoneMeet is built exclusively for adults aged 18 and older. Our zero-tolerance policy applies to nudity, harassment, spam, and abusive behavior. Any policy violations result in an immediate and permanent account ban. Feel free to report any bad behavior with our in-call flag button to help us keep our platform safe and positive.
            </p>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="cta-bottom">
          <h2>Ready to meet new people online?</h2>
          <p>Join millions of users who trust ZoneMeet as the safest, fastest, and most modern platform to talk to strangers.</p>
          <Link href="/" className="btn-primary btn-lg">
            Start Live Video Chat
          </Link>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <p>© 2026 ZoneMeet AI. All rights reserved. | Developed by Davinder Singh.</p>
          <div className="footer-links">
            <Link href="/">Home</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/refund">Refunds</Link>
          </div>
        </footer>
      </div>

      <style jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .landing-wrap {
          background: #000;
          min-height: 100vh;
          color: white;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* DYNAMIC BG */
        .sphere {
          position: fixed;
          border-radius: 50%;
          filter: blur(130px);
          z-index: 0;
          pointer-events: none;
        }
        .s1 { width: 700px; height: 700px; top: -15%; right: -10%; background: #6366f1; opacity: 0.12; }
        .s2 { width: 600px; height: 600px; bottom: -10%; left: -10%; background: #ec4899; opacity: 0.1; }
        .s3 { width: 400px; height: 400px; top: 50%; left: 40%; background: #a855f7; opacity: 0.07; }
        .grid-overlay {
          position: fixed; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 40px 40px;
          z-index: 1;
        }

        .landing-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 40px 24px 60px;
          position: relative;
          z-index: 2;
        }

        /* NAV */
        .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 80px; }
        .logo { font-size: 1.8rem; font-weight: 900; text-decoration: none; color: white; letter-spacing: -1px; }
        .logo span { color: #6366f1; }
        .back-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 10px 22px;
          border-radius: 50px;
          color: #94a3b8;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.88rem;
          transition: 0.3s;
        }
        .back-btn:hover { background: #6366f1; color: white; transform: translateX(-4px); }

        /* HERO */
        .hero { text-align: center; max-width: 780px; margin: 0 auto 90px; }
        .badge {
          display: inline-block;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          color: #a5b4fc;
          padding: 7px 18px;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          margin-bottom: 24px;
        }
        .hero h1 { font-size: 4rem; font-weight: 900; line-height: 1.1; letter-spacing: -2px; margin-bottom: 22px; }
        .hero h1 span { background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-sub { color: #94a3b8; font-size: 1.25rem; line-height: 1.7; margin-bottom: 35px; }
        .hero-btns { display: flex; justify-content: center; }
        .btn-primary {
          background: linear-gradient(135deg, #6366f1, #ec4899);
          color: white;
          padding: 18px 36px;
          border-radius: 16px;
          font-weight: 800;
          font-size: 1.1rem;
          text-decoration: none;
          transition: 0.3s;
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.35);
          border: none;
          cursor: pointer;
        }
        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(99, 102, 241, 0.55);
        }
        .btn-lg {
          padding: 20px 42px;
          font-size: 1.2rem;
        }

        /* FEATURES GRID */
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 50px; }
        .feat-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 35px 24px;
          border-radius: 28px;
          transition: 0.3s;
        }
        .feat-card:hover { transform: translateY(-8px); border-color: #6366f1; background: rgba(99,102,241,0.04); }
        .feat-icon { font-size: 2.2rem; margin-bottom: 16px; }
        .feat-card h3 { font-size: 1.25rem; font-weight: 800; margin-bottom: 10px; }
        .feat-card p { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; }

        .divider { height: 1px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent); margin: 70px 0; }

        /* COMPARE SECTION */
        .section-header { text-align: center; margin-bottom: 50px; }
        .section-header h2 { font-size: 2.5rem; font-weight: 900; margin-bottom: 12px; }
        .section-header p { color: #64748b; font-size: 1.05rem; }
        .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .compare-card {
          display: flex; gap: 16px; align-items: flex-start;
          background: rgba(255,255,255,0.01);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 24px;
          padding: 28px;
          transition: 0.3s;
        }
        .compare-card:hover { border-color: rgba(99,102,241,0.25); background: rgba(255,255,255,0.03); }
        .bullet { font-size: 1.5rem; flex-shrink: 0; }
        .compare-card strong { display: block; color: white; font-size: 1.1rem; margin-bottom: 8px; }
        .compare-card p { color: #94a3b8; font-size: 0.92rem; line-height: 1.6; }

        /* STEPS */
        .steps-container { display: flex; align-items: center; gap: 12px; }
        .step {
          flex: 1;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: 35px 24px;
          text-align: center;
          transition: 0.3s;
        }
        .step:hover { border-color: rgba(99,102,241,0.3); background: rgba(99,102,241,0.04); transform: translateY(-6px); }
        .num {
          display: inline-flex;
          align-items: center; justify-content: center;
          width: 50px; height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #ec4899);
          font-weight: 900; font-size: 1.3rem;
          margin-bottom: 18px;
        }
        .step h4 { font-size: 1.1rem; font-weight: 800; margin-bottom: 10px; }
        .step p { color: #64748b; font-size: 0.85rem; line-height: 1.5; }
        .step-arrow { font-size: 1.5rem; color: #334155; flex-shrink: 0; }

        /* SAFETY SECTION */
        .safety-box {
          background: linear-gradient(145deg, rgba(239,68,68,0.07), rgba(15,23,42,0.6));
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 30px;
          padding: 40px;
          position: relative;
          overflow: hidden;
        }
        .safety-box::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(to right, #ef4444, #f97316);
        }
        .safety-title { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .safety-title span { font-size: 2.2rem; }
        .safety-title h2 { font-size: 1.6rem; font-weight: 900; color: #fca5a5; }
        .safety-box p { color: #94a3b8; font-size: 0.95rem; line-height: 1.7; }

        /* CTA BOTTOM */
        .cta-bottom { text-align: center; max-width: 700px; margin: 90px auto; padding: 0 20px; }
        .cta-bottom h2 { font-size: 2.6rem; font-weight: 900; margin-bottom: 15px; }
        .cta-bottom p { color: #94a3b8; font-size: 1.15rem; margin-bottom: 30px; line-height: 1.6; }

        /* FOOTER */
        .footer {
          text-align: center;
          padding: 50px 0 20px;
          border-top: 1px solid rgba(255,255,255,0.05);
          color: #475569;
          font-size: 0.88rem;
        }
        .footer-links { display: flex; justify-content: center; flex-wrap: wrap; gap: 24px; margin-top: 18px; }
        .footer-links a { color: #64748b; text-decoration: none; transition: 0.3s; font-weight: 600; }
        .footer-links a:hover { color: #6366f1; }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .hero h1 { font-size: 2.8rem; }
          .features-grid { grid-template-columns: 1fr; }
          .compare-grid { grid-template-columns: 1fr; }
          .steps-container { flex-direction: column; }
          .step-arrow { transform: rotate(90deg); margin: 10px 0; }
        }

        @media (max-width: 768px) {
          .landing-inner { padding: 20px 14px 40px !important; }
          .top-nav { flex-direction: column !important; gap: 15px !important; text-align: center !important; margin-bottom: 40px !important; }
          .hero h1 { font-size: 2.2rem !important; letter-spacing: -1px !important; }
          .hero-sub { font-size: 1.05rem !important; }
          .hero { margin-bottom: 40px !important; }
          .btn-primary { padding: 14px 28px !important; font-size: 1rem !important; border-radius: 12px !important; width: 100% !important; display: block !important; text-align: center !important; }
          .btn-lg { padding: 16px 32px !important; font-size: 1.1rem !important; }
          .divider { margin: 40px 0 !important; }
          .feat-card { padding: 25px 20px !important; border-radius: 20px !important; }
          .section-header h2 { font-size: 1.8rem !important; }
          .compare-card { padding: 20px !important; border-radius: 20px !important; }
          .step { padding: 25px 20px !important; border-radius: 20px !important; }
          .safety-box { padding: 25px 15px !important; border-radius: 20px !important; }
          .safety-title h2 { font-size: 1.3rem !important; }
          .cta-bottom h2 { font-size: 1.8rem !important; }
          .cta-bottom p { font-size: 1rem !important; }
          .cta-bottom { margin: 60px auto !important; }
        }

        @media (max-width: 480px) {
          .hero h1 { font-size: 1.8rem !important; }
        }
      `}</style>
    </div>
  );
}
