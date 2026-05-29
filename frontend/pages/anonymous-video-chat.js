import Head from "next/head";
import Link from "next/link";

export default function AnonymousVideoChat() {
  return (
    <div className="landing-wrap">
      <Head>
        <title>Anonymous Video Chat with Strangers — Free & Private | ZoneMeet</title>
        <meta
          name="description"
          content="Start anonymous video chat with strangers instantly. ZoneMeet offers private, secure random video calls — no sign-up required to meet new people anonymously online."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://zonemeet.com/anonymous-video-chat" />
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
            ← Start Video Chat
          </Link>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="badge">🕵️ 100% ANONYMOUS &amp; PRIVATE</div>
          <h1>
            Anonymous Video Chat<br />
            <span>with Strangers.</span>
          </h1>
          <p className="hero-sub">
            Meet new people instantly with completely anonymous video chat. No personal
            information required — just connect, talk, and explore genuine conversations
            with strangers from around the world in a safe, private environment.
          </p>
          <div className="hero-btns">
            <Link href="/" className="btn-primary">
              Start Anonymous Chat Now
            </Link>
          </div>
        </section>

        {/* FEATURES ROW */}
        <section className="features-grid">
          <div className="feat-card">
            <div className="feat-icon">🎭</div>
            <h3>Truly Anonymous</h3>
            <p>Your identity stays hidden by default. No display name, no profile photo — just a live, real connection with another person.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🔐</div>
            <h3>End-to-End Encrypted</h3>
            <p>All video streams are peer-to-peer and fully encrypted using WebRTC. Your private conversations stay between you and your match.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">⚡</div>
            <h3>Instant Random Matching</h3>
            <p>Our intelligent algorithm pairs you with a random stranger in seconds. One click is all it takes to start a new conversation.</p>
          </div>
        </section>

        <div className="divider" />

        {/* WHAT IS ANONYMOUS VIDEO CHAT */}
        <section className="compare-section">
          <div className="section-header">
            <h2>What is Anonymous Video Chat?</h2>
            <p>Meet strangers anonymously — no accounts, no tracking, no trace.</p>
          </div>
          <div className="compare-grid">
            <div className="compare-card">
              <span className="bullet">🕵️</span>
              <div>
                <strong>Private Video Chat with Strangers</strong>
                <p>Anonymous video chat lets you video call random strangers without revealing your identity. You choose what to share — if anything at all. Your privacy is always in your hands.</p>
              </div>
            </div>
            <div className="compare-card">
              <span className="bullet">🌐</span>
              <div>
                <strong>Meet Strangers Anonymously Worldwide</strong>
                <p>ZoneMeet connects you with people from 190+ countries. Whether you want to practice a language, make new friends, or just have a spontaneous conversation, the world is at your fingertips.</p>
              </div>
            </div>
            <div className="compare-card">
              <span className="bullet">🔒</span>
              <div>
                <strong>Secure Random Video Call</strong>
                <p>Every random video call on ZoneMeet is protected by enterprise-grade encryption. No recordings, no data logs, no surveillance. Connect with confidence and total peace of mind.</p>
              </div>
            </div>
            <div className="compare-card">
              <span className="bullet">🚫</span>
              <div>
                <strong>No Sign-Up Needed to Explore</strong>
                <p>Jump straight into anonymous video chat without creating an account. Experience the platform freely before you decide to register and unlock additional features.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* WHY CHOOSE ANONYMOUS VIDEO CHAT */}
        <section className="why-section">
          <div className="section-header">
            <h2>Why People Choose Anonymous Video Chat</h2>
            <p>Millions of users trust ZoneMeet for private, meaningful connections with strangers every day.</p>
          </div>
          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon">💬</div>
              <h3>Speak Freely</h3>
              <p>Anonymity breaks down social barriers. People open up more honestly when they feel safe and unjudged. Have real, authentic conversations without fear.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">🌍</div>
              <h3>Discover New Perspectives</h3>
              <p>Every random match is a window into a different culture, language, or worldview. Expand your horizons one conversation at a time.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">🛡️</div>
              <h3>AI-Moderated Safety</h3>
              <p>Our real-time AI moderation system keeps every chat safe and respectful. Harmful content is detected and removed instantly so you can focus on connecting.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">🎯</div>
              <h3>Smart Interest Filters</h3>
              <p>Filter your matches by language or region to find strangers who share your interests. Anonymous doesn't mean random — it means free.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">📱</div>
              <h3>Works on Any Device</h3>
              <p>Start anonymous video chats on your phone, tablet, or desktop — no app download required. Just open your browser and connect instantly.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">♾️</div>
              <h3>Unlimited Connections</h3>
              <p>Skip, next, or add a stranger to your circle. There's no limit to how many new people you can meet. Every session brings a fresh face.</p>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* HOW IT WORKS */}
        <section className="steps-section">
          <div className="section-header">
            <h2>How to Start Anonymous Video Chat</h2>
            <p>Meet strangers privately in three effortless steps.</p>
          </div>
          <div className="steps-container">
            <div className="step">
              <span className="num">1</span>
              <h4>Open ZoneMeet</h4>
              <p>Visit ZoneMeet in any browser. No downloads, no plugins, no waiting. The platform is ready the moment you arrive.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="num">2</span>
              <h4>Choose Preferences</h4>
              <p>Set optional filters like language or country. Leave them blank for a fully random, anonymous experience with strangers worldwide.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="num">3</span>
              <h4>Connect &amp; Chat</h4>
              <p>Hit "Connect" and your secure, private video call begins immediately. Skip anytime to meet the next stranger in seconds.</p>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* PRIVACY PROMISE */}
        <section className="privacy-section">
          <div className="privacy-box">
            <div className="privacy-title">
              <span>🔒</span>
              <h2>Our Anonymous Video Chat Privacy Promise</h2>
            </div>
            <p>
              ZoneMeet was built with privacy at its core. We do not record your video calls, store your chat logs, or sell your data to third parties. 
              All connections are direct peer-to-peer — meaning your video stream never passes through our servers. 
              When you disconnect, your session is gone forever. That's what true anonymous video chat looks like.
            </p>
          </div>
        </section>

        <div className="divider" />

        {/* SAFETY */}
        <section className="safety-section">
          <div className="safety-box">
            <div className="safety-title">
              <span>🔞</span>
              <h2>Strictly 18+ Safe &amp; Respectful Community</h2>
            </div>
            <p>
              ZoneMeet's anonymous video chat is exclusively for adults aged 18 and older. Our zero-tolerance policy covers nudity, harassment, spam, 
              and any abusive behavior. Violations result in an immediate permanent ban. Use the in-call report button to flag anyone breaking the rules 
              and help us keep this community safe, respectful, and welcoming for everyone.
            </p>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="faq-section">
          <div className="section-header">
            <h2>Anonymous Video Chat — Frequently Asked Questions</h2>
            <p>Everything you need to know before your first anonymous video call.</p>
          </div>
          <div className="faq-list">
            <div className="faq-item">
              <h3>Is ZoneMeet's video chat truly anonymous?</h3>
              <p>Yes. By default, you are completely anonymous. No real name, no profile photo, and no personal details are shared with strangers unless you choose to share them yourself.</p>
            </div>
            <div className="faq-item">
              <h3>Are private video chats with strangers recorded?</h3>
              <p>Absolutely not. ZoneMeet never records your video calls. All streams are encrypted and peer-to-peer, meaning no data passes through or is stored on our servers.</p>
            </div>
            <div className="faq-item">
              <h3>Is it safe to video chat with random strangers?</h3>
              <p>ZoneMeet makes random video calls as safe as possible with AI moderation, real-time content filtering, and a strict 18+ policy. You can also skip or report any user instantly.</p>
            </div>
            <div className="faq-item">
              <h3>Do I need to create an account to start an anonymous video chat?</h3>
              <p>You can explore ZoneMeet without registering. Creating a free account unlocks extra features like interest filters, friend circles, and daily coin rewards.</p>
            </div>
            <div className="faq-item">
              <h3>Which countries can I meet strangers from?</h3>
              <p>ZoneMeet connects you with strangers from over 190 countries. Use the country filter to narrow your matches or leave it open to meet people from anywhere in the world.</p>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="cta-bottom">
          <h2>Ready for Your First Anonymous Video Chat?</h2>
          <p>
            Join millions of users who choose ZoneMeet for private, secure, and spontaneous video conversations with strangers every single day.
          </p>
          <Link href="/" className="btn-primary btn-lg">
            Start Anonymous Video Chat Free
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

        /* PRIVACY SECTION */
        .privacy-box {
          background: linear-gradient(145deg, rgba(99,102,241,0.07), rgba(15,23,42,0.6));
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 30px;
          padding: 40px;
          position: relative;
          overflow: hidden;
        }
        .privacy-box::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(to right, #6366f1, #a855f7, #ec4899);
        }
        .privacy-title { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .privacy-title span { font-size: 2.2rem; }
        .privacy-title h2 { font-size: 1.6rem; font-weight: 900; color: #a5b4fc; }
        .privacy-box p { color: #94a3b8; font-size: 0.95rem; line-height: 1.7; }

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
          .privacy-box { padding: 25px 18px !important; border-radius: 20px !important; }
          .privacy-title h2 { font-size: 1.3rem !important; }
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
