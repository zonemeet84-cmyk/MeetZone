import Head from "next/head";
import Link from "next/link";

export default function About() {
  return (
    <div className="about-wrap">
      <Head>
        <title>About Us | ZoneMeet AI</title>
        <meta name="description" content="Learn about ZoneMeet — the AI-powered global video chat platform independently built by Davinder Singh. Strictly 18+ only." />
      </Head>

      {/* DYNAMIC BACKGROUND */}
      <div className="sphere s1" />
      <div className="sphere s2" />
      <div className="sphere s3" />
      <div className="grid-bg" />

      <div className="page-inner">

        {/* NAV */}
        <nav className="top-nav">
          <Link href="/" className="logo">Zone<span>Meet</span></Link>
          <Link href="/" className="back-btn">← Back to Home</Link>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="badge">🌐 ABOUT ZONEMEET</div>
          <h1>Built to Connect<br /><span>the Entire World.</span></h1>
          <p className="hero-sub">
            ZoneMeet is an AI-powered random video chat platform that lets you meet real people from 190+ countries — 
            instantly, safely, and without borders.
          </p>
        </section>

        {/* STATS */}
        <section className="stats-row">
          <div className="stat-card">
            <h3>190+</h3>
            <p>Countries Connected</p>
          </div>
          <div className="stat-card">
            <h3>50k+</h3>
            <p>Users Worldwide</p>
          </div>
          <div className="stat-card">
            <h3>24/7</h3>
            <p>Platform Uptime</p>
          </div>
          <div className="stat-card">
            <h3>100%</h3>
            <p>Independent & Ad-Light</p>
          </div>
        </section>

        <div className="divider" />

        {/* ⚠️ 18+ SECTION */}
        <section className="age-section">
          <div className="age-card">
            <div className="age-top">
              <div className="age-icon">🔞</div>
              <div>
                <h2>Strictly 18+ Platform</h2>
                <p className="age-tagline">This platform is exclusively for adults aged 18 and above.</p>
              </div>
            </div>
            <div className="age-grid">
              <div className="age-item">
                <span className="age-item-icon">⚠️</span>
                <div>
                  <strong>Age Verification</strong>
                  <p>By accessing ZoneMeet, you confirm that you are at least 18 years old. Underage access is strictly prohibited and results in an immediate permanent ban.</p>
                </div>
              </div>
              <div className="age-item">
                <span className="age-item-icon">🛡️</span>
                <div>
                  <strong>AI Guardian Moderation</strong>
                  <p>Our real-time AI Guardian monitors all video sessions to detect nudity, inappropriate behaviour, and violations. Offenders are permanently banned and evidence is logged.</p>
                </div>
              </div>
              <div className="age-item">
                <span className="age-item-icon">⚖️</span>
                <div>
                  <strong>Legal Compliance</strong>
                  <p>ZoneMeet complies with all applicable laws including COPPA, GDPR, and IT Act 2000. We have a zero-tolerance policy for any content involving minors.</p>
                </div>
              </div>
              <div className="age-item">
                <span className="age-item-icon">🚨</span>
                <div>
                  <strong>Report & React</strong>
                  <p>Users can instantly report violations using the in-call Report button. Our team reviews all reports within 24 hours and takes necessary legal action when required.</p>
                </div>
              </div>
            </div>
            <div className="age-footer-note">
              By using ZoneMeet, you agree to our <Link href="/terms">Terms & Conditions</Link> and confirm compliance with our <Link href="/safety">18+ Safety Policy</Link>.
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* MISSION & VALUES */}
        <section className="values-section">
          <div className="section-header">
            <h2>Our Mission & Values</h2>
            <p>What drives every decision we make at ZoneMeet</p>
          </div>
          <div className="values-grid">
            <div className="val-box">
              <div className="val-icon">🌍</div>
              <h3>Global Connections</h3>
              <p>We believe that meaningful human connections have no borders. Our platform bridges language, culture, and geography so the world feels smaller.</p>
            </div>
            <div className="val-box">
              <div className="val-icon">🔐</div>
              <h3>Privacy & Security</h3>
              <p>All video calls are encrypted end-to-end. We never sell your data and we never store private conversations. Your privacy is a right, not a feature.</p>
            </div>
            <div className="val-box">
              <div className="val-icon">⚡</div>
              <h3>Speed & Reliability</h3>
              <p>Lightning-fast WebRTC-powered video calls with intelligent network routing. We maintain 99.9% uptime so you're never left with a blank screen.</p>
            </div>
            <div className="val-box">
              <div className="val-icon">🤖</div>
              <h3>AI-Powered Safety</h3>
              <p>Our Guardian AI runs silently in the background during every session, automatically detecting and acting on policy violations in real time.</p>
            </div>
            <div className="val-box">
              <div className="val-icon">🎯</div>
              <h3>Smart Matchmaking</h3>
              <p>Our AI pairs you with strangers based on your preferences, country, and interests — making every conversation feel intentional, not random.</p>
            </div>
            <div className="val-box">
              <div className="val-icon">💰</div>
              <h3>Fair & Transparent</h3>
              <p>No hidden fees, no shady subscriptions. Our coin-based economy is fully transparent — you see exactly what you pay for and what you get.</p>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* HOW IT WORKS */}
        <section className="how-section">
          <div className="section-header">
            <h2>How ZoneMeet Works</h2>
            <p>Simple, fast, and safe — every time</p>
          </div>
          <div className="steps-row">
            <div className="step">
              <div className="step-num">01</div>
              <h4>Create Your Account</h4>
              <p>Sign up with email or Google. Complete your profile in under 2 minutes.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-num">02</div>
              <h4>Set Preferences</h4>
              <p>Choose your gender filter, country preference, and interest tags.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-num">03</div>
              <h4>Start Chatting</h4>
              <p>Get matched instantly. Skip, chat, or add as a friend — it's that simple.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-num">04</div>
              <h4>Earn & Grow</h4>
              <p>Collect coins daily, invite friends, and unlock premium features.</p>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* FOUNDER / INDIE BUILT */}
        <section className="founder-section">
          <div className="founder-card">
            <div className="founder-top-bar" />
            <div className="founder-inner">
              <div className="founder-left">
                <div className="founder-avatar">DS</div>
                <div className="indie-badge">🛠 Indie Built</div>
              </div>
              <div className="founder-right">
                <h2>Independently Built with ❤️</h2>
                <p className="founder-highlight">
                  ZoneMeet is independently developed and managed by{" "}
                  <span className="name-highlight">Davinder Singh</span>.
                </p>
                <p className="founder-sub">
                  What started as a bold vision to build a world-class, safe and lightning-fast video chat 
                  platform has grown into a global community. By staying independent, ZoneMeet remains 
                  focused on what truly matters — <strong>your experience, your safety, and constant innovation</strong> — 
                  without the pressure of corporate agendas or investor timelines.
                </p>
                <p className="founder-sub">
                  Every feature, every line of code, every design decision reflects a commitment to building 
                  something that genuinely helps people connect across the world.
                </p>

                <div className="contact-card">
                  <div className="contact-left">
                    <div className="contact-emoji">✉️</div>
                  </div>
                  <div className="contact-right">
                    <p className="contact-label">For support, partnerships, business inquiries, or any important concerns, please contact:</p>
                    <a href="mailto:support@zonemeet.chat" className="contact-email">support@zonemeet.chat</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="about-footer">
          <p>© 2026 ZoneMeet AI. All rights reserved. | Independently owned & operated by Davinder Singh.</p>
          <div className="footer-links">
            <Link href="/">Home</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/refund">Refunds</Link>
            <Link href="/safety" style={{ color: '#ef4444', fontWeight: 700 }}>18+ Policy</Link>
          </div>
        </footer>

      </div>

      <style jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .about-wrap {
          background: #000;
          min-height: 100vh;
          color: white;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* BG */
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
        .grid-bg {
          position: fixed; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 40px 40px;
          z-index: 1;
        }

        .page-inner {
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
        .hero { text-align: center; max-width: 750px; margin: 0 auto 80px; }
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
        .hero-sub { color: #94a3b8; font-size: 1.2rem; line-height: 1.7; }

        /* STATS */
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 80px; }
        .stat-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 35px 20px;
          border-radius: 28px;
          text-align: center;
          transition: 0.3s;
        }
        .stat-card:hover { transform: translateY(-8px); border-color: #6366f1; background: rgba(99,102,241,0.05); }
        .stat-card h3 { font-size: 2.2rem; font-weight: 900; background: linear-gradient(to bottom, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
        .stat-card p { color: #64748b; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

        .divider { height: 1px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent); margin: 70px 0; }

        /* 18+ SECTION */
        .age-section { margin-bottom: 20px; }
        .age-card {
          background: linear-gradient(145deg, rgba(239,68,68,0.07), rgba(15,23,42,0.6));
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 36px;
          padding: 50px;
          position: relative;
          overflow: hidden;
        }
        .age-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(to right, #ef4444, #f97316);
        }
        .age-top {
          display: flex; align-items: center; gap: 24px;
          margin-bottom: 40px;
        }
        .age-icon {
          font-size: 3.5rem;
          background: rgba(239,68,68,0.15);
          width: 90px; height: 90px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 24px;
          border: 1px solid rgba(239,68,68,0.3);
          flex-shrink: 0;
        }
        .age-top h2 { font-size: 2rem; font-weight: 900; color: #fca5a5; margin-bottom: 6px; }
        .age-tagline { color: #f87171; font-size: 1rem; font-weight: 600; }
        .age-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .age-item {
          display: flex; gap: 16px; align-items: flex-start;
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(239,68,68,0.12);
          border-radius: 20px;
          padding: 22px;
        }
        .age-item-icon { font-size: 1.6rem; flex-shrink: 0; }
        .age-item strong { display: block; color: #fca5a5; font-size: 1rem; margin-bottom: 8px; }
        .age-item p { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; }
        .age-footer-note {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.15);
          border-radius: 14px;
          padding: 16px 22px;
          color: #f87171;
          font-size: 0.9rem;
          font-weight: 600;
          text-align: center;
        }
        .age-footer-note a { color: #fca5a5; text-decoration: underline; }

        /* VALUES */
        .values-section { margin-bottom: 20px; }
        .section-header { text-align: center; margin-bottom: 50px; }
        .section-header h2 { font-size: 2.5rem; font-weight: 900; margin-bottom: 12px; }
        .section-header p { color: #64748b; font-size: 1.05rem; }
        .values-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .val-box {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 28px;
          padding: 34px 28px;
          transition: 0.35s;
        }
        .val-box:hover { transform: translateY(-8px); border-color: rgba(99,102,241,0.35); background: rgba(99,102,241,0.04); }
        .val-icon { font-size: 2.2rem; margin-bottom: 18px; background: rgba(255,255,255,0.05); width: 62px; height: 62px; display: flex; align-items: center; justify-content: center; border-radius: 18px; border: 1px solid rgba(255,255,255,0.08); }
        .val-box h3 { font-size: 1.2rem; font-weight: 800; margin-bottom: 12px; }
        .val-box p { color: #94a3b8; font-size: 0.92rem; line-height: 1.65; }

        /* HOW IT WORKS */
        .how-section { margin-bottom: 20px; }
        .steps-row { display: flex; align-items: center; gap: 12px; }
        .step {
          flex: 1;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: 30px 22px;
          text-align: center;
          transition: 0.3s;
        }
        .step:hover { border-color: rgba(99,102,241,0.3); background: rgba(99,102,241,0.04); transform: translateY(-6px); }
        .step-num {
          font-size: 2.5rem;
          font-weight: 900;
          background: linear-gradient(135deg, #6366f1, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 14px;
        }
        .step h4 { font-size: 1rem; font-weight: 800; margin-bottom: 10px; }
        .step p { color: #64748b; font-size: 0.85rem; line-height: 1.5; }
        .step-arrow { font-size: 1.5rem; color: #334155; flex-shrink: 0; }

        /* FOUNDER */
        .founder-section { margin-bottom: 20px; }
        .founder-card {
          background: linear-gradient(145deg, rgba(30,41,59,0.4), rgba(15,23,42,0.7));
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 40px;
          overflow: hidden;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
        }
        .founder-top-bar { height: 4px; background: linear-gradient(to right, #6366f1, #a855f7, #ec4899); }
        .founder-inner { display: flex; gap: 50px; padding: 55px; align-items: flex-start; }
        .founder-left { display: flex; flex-direction: column; align-items: center; gap: 16px; flex-shrink: 0; }
        .founder-avatar {
          width: 100px; height: 100px;
          background: linear-gradient(135deg, #6366f1, #ec4899);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 2rem; font-weight: 900;
          box-shadow: 0 0 30px rgba(99,102,241,0.4);
        }
        .indie-badge {
          background: rgba(236,72,153,0.12);
          border: 1px solid rgba(236,72,153,0.25);
          color: #f472b6;
          padding: 6px 14px;
          border-radius: 50px;
          font-size: 0.78rem;
          font-weight: 800;
          white-space: nowrap;
        }
        .founder-right h2 { font-size: 2rem; font-weight: 900; margin-bottom: 18px; }
        .founder-highlight { font-size: 1.25rem; color: #e2e8f0; font-weight: 500; margin-bottom: 18px; line-height: 1.6; }
        .name-highlight { font-weight: 800; color: #a5b4fc; background: rgba(99,102,241,0.15); padding: 2px 10px; border-radius: 8px; }
        .founder-sub { color: #94a3b8; font-size: 0.97rem; line-height: 1.8; margin-bottom: 16px; }
        .founder-sub strong { color: #cbd5e1; }

        .contact-card {
          display: flex; align-items: center; gap: 22px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 22px;
          padding: 26px 28px;
          margin-top: 30px;
          transition: 0.3s;
        }
        .contact-card:hover { border-color: rgba(99,102,241,0.3); }
        .contact-emoji { font-size: 2.2rem; background: rgba(255,255,255,0.05); width: 62px; height: 62px; display: flex; align-items: center; justify-content: center; border-radius: 50%; flex-shrink: 0; }
        .contact-label { color: #94a3b8; font-size: 0.9rem; margin-bottom: 8px; line-height: 1.5; }
        .contact-email { color: #818cf8; font-size: 1.2rem; font-weight: 800; text-decoration: none; transition: 0.3s; display: inline-block; }
        .contact-email:hover { color: #a5b4fc; transform: translateX(4px); }

        /* FOOTER */
        .about-footer {
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
          .stats-row { grid-template-columns: 1fr 1fr; }
          .age-grid { grid-template-columns: 1fr; }
          .values-grid { grid-template-columns: 1fr; }
          .steps-row { flex-direction: column; }
          .step-arrow { transform: rotate(90deg); }
          .founder-inner { flex-direction: column; padding: 30px; }
          .age-card { padding: 30px 20px; }
        }

        @media (max-width: 768px) {
          .page-inner { padding: 20px 14px 40px !important; }
          .top-nav { flex-direction: column !important; gap: 15px !important; text-align: center !important; margin-bottom: 40px !important; }
          .hero h1 { font-size: 2.2rem !important; letter-spacing: -1px !important; }
          .hero-sub { font-size: 1.05rem !important; }
          .hero { margin-bottom: 40px !important; }
          .stats-row { gap: 15px !important; margin-bottom: 40px !important; }
          .stat-card { padding: 20px 10px !important; border-radius: 20px !important; }
          .stat-card h3 { font-size: 1.8rem !important; }
          .divider { margin: 40px 0 !important; }
          .age-card { padding: 25px 15px !important; border-radius: 24px !important; }
          .age-top { flex-direction: column !important; text-align: center !important; gap: 15px !important; }
          .age-icon { margin: 0 auto !important; width: 70px !important; height: 70px !important; font-size: 2.5rem !important; }
          .age-item { padding: 15px !important; border-radius: 16px !important; }
          .values-grid { gap: 15px !important; }
          .val-box { padding: 20px !important; border-radius: 20px !important; }
          .steps-row { gap: 8px !important; }
          .step { padding: 20px 15px !important; border-radius: 18px !important; }
          .step-arrow { font-size: 1.2rem !important; margin: 5px 0 !important; }
          .founder-inner { padding: 20px 15px !important; gap: 20px !important; align-items: center !important; text-align: center !important; }
          .founder-left { flex-shrink: 1 !important; }
          .founder-right h2 { font-size: 1.6rem !important; margin-bottom: 12px !important; }
          .founder-highlight { font-size: 1.1rem !important; }
          .contact-card { flex-direction: column !important; text-align: center !important; padding: 15px !important; border-radius: 18px !important; gap: 15px !important; }
          .contact-emoji { margin: 0 auto !important; }
          .contact-email { font-size: 1.1rem !important; }
        }

        @media (max-width: 480px) {
          .stats-row { grid-template-columns: 1fr !important; }
          .hero h1 { font-size: 1.8rem !important; }
          .age-top h2 { font-size: 1.6rem !important; }
        }
      `}</style>
    </div>
  );
}
