import Head from "next/head";
import Link from "next/link";

export default function RandomVideoCallApp() {
  return (
    <div className="landing-wrap">
      <Head>
        <title>The Best Random Video Call App for Strangers | ZoneMeet</title>
        <meta
          name="description"
          content="Looking for a top random video call app? Experience the ultimate free video calling app with ZoneMeet. Connect instantly via random video chat app and start live video call with strangers."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://zonemeet.chat/random-video-call-app" />
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
          <div className="badge">📱 THE MODERN WEB-APP EXPERIENCE</div>
          <h1>
            The Ultimate<br />
            <span>Random Video Call App.</span>
          </h1>
          <p className="hero-sub">
            Skip the bulky app stores and complicated sign-ups. Experience the fastest and safest 
            <strong>free video calling app</strong> running natively in your browser. ZoneMeet is a premium 
            <strong>random video chat app</strong> designed to let you launch a secure 
            <strong>live video call with strangers</strong> and meet fascinating people around the globe instantly.
          </p>
          <div className="hero-btns">
            <Link href="/" className="btn-primary">
              Launch Web App Now
            </Link>
          </div>
        </section>

        {/* FEATURES ROW */}
        <section className="features-grid">
          <div className="feat-card">
            <div className="feat-icon">🌐</div>
            <h3>No Download Needed</h3>
            <p>Runs smoothly inside Safari, Chrome, or Firefox. Our responsive web-app layout delivers the native app experience without consuming your phone's storage capacity.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">⚡</div>
            <h3>Instant WebRTC Speed</h3>
            <p>Powered by peer-to-peer WebRTC technology, ensuring crystal-clear HD video and low-latency audio transmission, even on standard mobile networks.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🛡️</div>
            <h3>AI-Driven Safety</h3>
            <p>Our real-time smart moderation checks flag inappropriate streams and bad behavior instantly, creating a safe environment for genuine conversationalists.</p>
          </div>
        </section>

        <div className="divider" />

        {/* WHY ZONEMEET IS THE BEST APP */}
        <section className="compare-section">
          <div className="section-header">
            <h2>Why ZoneMeet is the Leading Random Video Call App</h2>
            <p>We designed our platform from the ground up to solve the bugs and security problems of standard web chat rooms.</p>
          </div>
          <div className="compare-grid">
            <div className="compare-card">
              <span className="bullet">🔒</span>
              <div>
                <strong>End-to-End Encryption</strong>
                <p>Enjoy absolute privacy. All connections are routed directly peer-to-peer. We never record, monitor, or store details of your conversations.</p>
              </div>
            </div>
            <div className="compare-card">
              <span className="bullet">🚫</span>
              <div>
                <strong>Active Anti-Bot Moderation</strong>
                <p>We require account authentication (like Google Sign-In) to block fake users and spambots. Rest assured you only connect with real people.</p>
              </div>
            </div>
            <div className="compare-card">
              <span className="bullet">💬</span>
              <div>
                <strong>Add and Direct Call Friends</strong>
                <p>Connected with a great conversational partner? Add them to your global circle to make free direct calls and text chat anytime.</p>
              </div>
            </div>
            <div className="compare-card">
              <span className="bullet">✨</span>
              <div>
                <strong>Stunning Responsive UI</strong>
                <p>Built with beautiful, modern glassmorphism design styles. Experience micro-animations and smooth page transitions on all device layouts.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* HOW TO START */}
        <section className="steps-section">
          <div className="section-header">
            <h2>Start a Live Video Call with Strangers Instantly</h2>
            <p>Connect with active people globally in three effortless steps.</p>
          </div>
          <div className="steps-container">
            <div className="step">
              <span className="num">1</span>
              <h4>Quick and Secure Authentication</h4>
              <p>Register securely using Google or email in less than 10 seconds. We protect your personal credentials completely.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="num">2</span>
              <h4>Select Matching Preferences</h4>
              <p>Customize matching options based on region, language, or interest categories to refine who you match with.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="num">3</span>
              <h4>Tap "Connect Now"</h4>
              <p>Immediately launch a video session. Seamlessly swap to a new match by hitting the "Next" button anytime you want.</p>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* 18+ RULES ACCESSIBILITY */}
        <section className="safety-section">
          <div className="safety-box">
            <div className="safety-title">
              <span>🔞</span>
              <h2>Strictly 18+ Safety & Respect Guidelines</h2>
            </div>
            <p>
              ZoneMeet is dedicated to fostering a friendly, respectful, and safe community. Our random video chat app is strictly restricted to users aged 18 and older. We enforce a zero-tolerance policy against nudity, harassment, commercial advertising, and abusive behavior. Violating our terms leads to an immediate and permanent IP and hardware ban. Please help us keep the community positive by reporting bad behavior.
            </p>
          </div>
        </section>

        <div className="divider" />

        {/* FAQ SECTION */}
        <section className="faq-section">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about using our free video calling app.</p>
          </div>
          <div className="faq-list">
            <div className="faq-item">
              <h3>Do I need to download a file to use this free video calling app?</h3>
              <p>No! ZoneMeet is designed as a browser-first web application. You don't need to visit the Google Play Store or Apple App Store. Simply open our site in your browser on iOS, Android, or desktop and get instant native-app performance.</p>
            </div>
            <div className="faq-item">
              <h3>What makes ZoneMeet the ultimate random video chat app?</h3>
              <p>Unlike classic legacy chat platforms, ZoneMeet integrates advanced AI safety filters, eliminates automated spambots through user verification, and lets you add friends to stay in touch for unlimited direct calls.</p>
            </div>
            <div className="faq-item">
              <h3>How can I securely enjoy a live video call with strangers?</h3>
              <p>Our streams are routed via WebRTC using direct end-to-end encryption. In addition, our report system and AI safety scanners work in the background to ensure you have a secure and enjoyable chatting experience.</p>
            </div>
            <div className="faq-item">
              <h3>Can I use my mobile network (3G/4G/5G) for matching?</h3>
              <p>Yes! ZoneMeet is highly optimized for performance. Our systems adjust stream resolutions dynamically based on your internet connection to deliver lag-free video feeds.</p>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="cta-bottom">
          <h2>Ready to launch the ultimate random video call app?</h2>
          <p>Join millions of active users who trust ZoneMeet as the safest, fastest, and most gorgeous platform to talk to strangers. Tap below to start now!</p>
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
        .hero { text-align: center; max-width: 800px; margin: 0 auto 90px; }
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
        .hero-sub strong { color: white; }
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
        .feat-card strong { color: white; }

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

        /* FAQ SECTION */
        .faq-section { margin-top: 20px; }
        .faq-list { display: flex; flex-direction: column; gap: 16px; }
        .faq-item {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 20px;
          padding: 28px 32px;
          transition: 0.3s;
        }
        .faq-item:hover { border-color: rgba(99,102,241,0.2); background: rgba(99,102,241,0.03); }
        .faq-item h3 { font-size: 1.05rem; font-weight: 800; margin-bottom: 10px; color: #e2e8f0; }
        .faq-item p { color: #64748b; font-size: 0.9rem; line-height: 1.65; }

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
          .faq-item { padding: 20px 18px !important; border-radius: 16px !important; }
          .cta-bottom h2 { font-size: 1.8rem !important; }
          .cta-bottom p { font-size: 1rem !important; }
          .cta-bottom { margin: 60px auto !important; }
        }

        @media (max-width: 480px) {
          .hero h1 { font-size: 1.8rem !important; }
          .section-header h2 { font-size: 1.5rem !important; }
        }
      `}</style>
    </div>
  );
}
