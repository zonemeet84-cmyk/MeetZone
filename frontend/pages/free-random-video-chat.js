import Head from "next/head";
import Link from "next/link";

export default function FreeRandomVideoChat() {
  return (
    <div className="landing-wrap">
      <Head>
        <title>Free Random Video Chat — Talk to Strangers Online | ZoneMeet</title>
        <meta
          name="description"
          content="Experience the ultimate free random video chat on ZoneMeet. Connect instantly with active users, enjoy live cam chat, and talk to strangers free without any hidden fees."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://zonemeet.com/free-random-video-chat" />
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
          <div className="badge">⚡ 100% FREE &amp; INSTANT</div>
          <h1>
            Free Random<br />
            <span>Video Chat Online.</span>
          </h1>
          <p className="hero-sub">
            Connect instantly with thousands of friendly people around the globe.
            Enjoy high-quality, completely free random video chat without any registration 
            or subscriptions. Simply tap to start matching!
          </p>
          <div className="hero-btns">
            <Link href="/" className="btn-primary">
              Start Free Cam Chat Now
            </Link>
          </div>
        </section>

        {/* FEATURES ROW */}
        <section className="features-grid">
          <div className="feat-card">
            <div className="feat-icon">💸</div>
            <h3>Always 100% Free</h3>
            <p>No paywalls, no credits, no premium trials needed to connect. Enjoy unlimited free random video chat sessions anytime.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">⚡</div>
            <h3>Instant Connection</h3>
            <p>Skip the setup and profile building. Our ultra-fast matching algorithm finds an active user for you in under a second.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🌐</div>
            <h3>Global Network</h3>
            <p>Meet and talk to strangers free from every continent. Expand your cultural boundaries and practice languages effortlessly.</p>
          </div>
        </section>

        <div className="divider" />

        {/* WHAT IS FREE RANDOM VIDEO CHAT */}
        <section className="compare-section">
          <div className="section-header">
            <h2>The Ultimate Live Cam Chat Experience</h2>
            <p>Connect with real people worldwide through random video call online.</p>
          </div>
          <div className="compare-grid">
            <div className="compare-card">
              <span className="bullet">🎥</span>
              <div>
                <strong>High-Quality Live Cam Chat</strong>
                <p>ZoneMeet utilizes modern peer-to-peer technology to deliver crystal-clear HD video and low-latency audio. Enjoy seamless live cam chat with strangers without lag or pixelated feeds.</p>
              </div>
            </div>
            <div className="compare-card">
              <span className="bullet">🌍</span>
              <div>
                <strong>Talk to Strangers Free</strong>
                <p>Connecting with people has never been simpler. Share your thoughts, tell stories, show off your talents, and talk to strangers free from any hidden costs or forced registrations.</p>
              </div>
            </div>
            <div className="compare-card">
              <span className="bullet">📞</span>
              <div>
                <strong>Quick Random Video Call Online</strong>
                <p>Experience a seamless random video call online that bridges geographical distances instantly. Meet incredible, authentic conversationalists with a single tap on your screen.</p>
              </div>
            </div>
            <div className="compare-card">
              <span className="bullet">🛡️</span>
              <div>
                <strong>Moderated &amp; Safe Network</strong>
                <p>We combine advanced real-time AI moderation with an active reporting system to block bots, spam, and inappropriate behavior. Relax and chat in a safe, secure atmosphere.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* BENEFITS OF ZONEMEET */}
        <section className="why-section">
          <div className="section-header">
            <h2>Why Choose ZoneMeet for Free Random Video Chat?</h2>
            <p>Features and utilities that make ZoneMeet the leading global platform for live random video call online.</p>
          </div>
          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon">🔒</div>
              <h3>Privacy Guaranteed</h3>
              <p>Your video call streams are direct and end-to-end encrypted. We do not store or keep records of your private conversations.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">📱</div>
              <h3>Mobile-Optimized</h3>
              <p>Designed beautifully to run natively on iOS, Android, and tablets through your default web browser — no bulky app downloads required.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">💬</div>
              <h3>Optional Text Messaging</h3>
              <p>Feeling a bit shy? Start off by using our high-speed text messaging feature alongside your video feed to warm up the conversation.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">🌟</div>
              <h3>Zero Fake Users</h3>
              <p>We deploy strict anti-spam filters to ensure you only pair with live, real people. Skip through matches with absolute ease.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">✨</div>
              <h3>Modern Web UI</h3>
              <p>Enjoy a sleek, clean, modern glassmorphism design with a fully responsive layout that responds dynamically to your action.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">🎖️</div>
              <h3>No Sign-up Required</h3>
              <p>Start a video session anonymously. You only register if you want to unlock premium filters and build your personal friend list.</p>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* HOW TO START */}
        <section className="steps-section">
          <div className="section-header">
            <h2>How to Talk to Strangers Free</h2>
            <p>Connect with active cams instantly in three effortless steps.</p>
          </div>
          <div className="steps-container">
            <div className="step">
              <span className="num">1</span>
              <h4>Tap Start</h4>
              <p>Navigate to our homepage. The system requires no downloads or registration. You are instantly ready to chat.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="num">2</span>
              <h4>Allow Camera &amp; Mic</h4>
              <p>Grant temporary browser permissions for your camera and microphone so matches can see and hear you.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="num">3</span>
              <h4>Enjoy Live Cam Chat</h4>
              <p>Get matched instantly! Swap through partners with the "Next" button whenever you want to find a new stranger.</p>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* COMMUNITY COMPLIANCE */}
        <section className="safety-section">
          <div className="safety-box">
            <div className="safety-title">
              <span>🔞</span>
              <h2>Strictly 18+ Safety &amp; Content Guidelines</h2>
            </div>
            <p>
              ZoneMeet is dedicated to fostering a friendly, respectful, and safe community. Our free random video chat is strictly restricted to users aged 18 and older. Any depiction of nudity, harassment, hate speech, or commercial advertising is strictly prohibited and leads to an immediate, permanent IP and hardware ban. Please use our instant reporting tools to keep the network fun and safe for everyone.
            </p>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="faq-section">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Answers to common questions regarding free random video chat on ZoneMeet.</p>
          </div>
          <div className="faq-list">
            <div className="faq-item">
              <h3>Is ZoneMeet's random video chat really free?</h3>
              <p>Yes! ZoneMeet offers unlimited, 100% free random video chat. You can match, talk, and browse through other cam chats completely free of charge.</p>
            </div>
            <div className="faq-item">
              <h3>Do I need to download an application?</h3>
              <p>No downloads are needed. Our web application runs perfectly in any standard modern mobile or desktop web browser.</p>
            </div>
            <div className="faq-item">
              <h3>How does a random video call online work?</h3>
              <p>When you click start, our WebRTC server matches you with another active user. The connection is direct peer-to-peer, meaning it's fast and highly secure.</p>
            </div>
            <div className="faq-item">
              <h3>Is it safe to talk to strangers free here?</h3>
              <p>We work tirelessly to ensure a safe environment by implementing AI content scanning and rapid moderation. You can skip any match instantly if you feel uncomfortable.</p>
            </div>
            <div className="faq-item">
              <h3>Can I choose who I match with?</h3>
              <p>Yes. After registering a free account, you can customize your match settings by language and region filters to find your ideal conversation partners.</p>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="cta-bottom">
          <h2>Ready to Start Your Free Random Video Chat?</h2>
          <p>
            Join thousands of active users currently online. Click below to initiate your secure random video call online and meet people now.
          </p>
          <Link href="/" className="btn-primary btn-lg">
            Start Live Cam Chat Now
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

        /* WHY SECTION */
        .why-section { margin-bottom: 20px; }
        .why-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .why-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 24px;
          padding: 30px 22px;
          transition: 0.3s;
        }
        .why-card:hover { transform: translateY(-6px); border-color: rgba(99,102,241,0.3); background: rgba(99,102,241,0.04); }
        .why-icon { font-size: 2rem; margin-bottom: 14px; }
        .why-card h3 { font-size: 1.1rem; font-weight: 800; margin-bottom: 10px; }
        .why-card p { color: #64748b; font-size: 0.88rem; line-height: 1.6; }

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
          .why-grid { grid-template-columns: 1fr 1fr; }
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
          .why-grid { grid-template-columns: 1fr !important; }
          .why-card { padding: 22px 18px !important; border-radius: 18px !important; }
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
