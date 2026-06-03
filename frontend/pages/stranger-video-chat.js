import Head from "next/head";
import Link from "next/link";

export default function StrangerVideoChat() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How can I start a stranger video chat safely?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "To stay safe during a stranger video chat, use a moderated platform like ZoneMeet, keep your personal details confidential, ensure your camera background does not show your location, and report violating users immediately."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a free stranger video chat app online?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! ZoneMeet operates as a free, mobile-optimized stranger video chat web application. You can match with random users worldwide directly in your web browser without downloading any apps or purchasing subscription passes."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need to sign up to talk to strangers?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Registration is completely optional. You can enter chat rooms and match with strangers anonymously. Creating a free account lets you access additional perks, such as the friend circle and regional filtering settings."
        }
      },
      {
        "@type": "Question",
        "name": "How does AI moderation keep the chat rooms clean?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our automated AI Guardian scanner monitors video feeds in real time, automatically flagging and banning profiles that violate our terms of service (such as presenting nudity or advertising loops), protecting you from bad actors."
        }
      },
      {
        "@type": "Question",
        "name": "Can I match with people from a specific country?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, ZoneMeet includes region and country filters. You can use these filters to narrow down matching pools to specific locations, like our optimized India video chat room for South Asian connections."
        }
      }
    ]
  };

  return (
    <div className="landing-wrap">
      <Head>
        <title>Stranger Video Chat: Meet New People Instantly | ZoneMeet</title>
        <meta
          name="description"
          content="Looking for a secure stranger video chat? Talk to strangers in safe, AI-moderated video chat rooms and make new friends on ZoneMeet free."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://zonemeet.chat/stranger-video-chat" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
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
          <div className="badge">🛡️ AI-MODERATED &amp; SECURE</div>
          <h1>
            Secure Online<br />
            <span>Stranger Video Chat.</span>
          </h1>
          <p className="hero-sub">
            Meet amazing new people from across the globe in a safe environment. Connect instantly with verified active webcams without downloading applications.
          </p>
          <div className="hero-btns">
            <Link href="/" className="btn-primary">
              Connect to Stranger Chat
            </Link>
          </div>
        </section>

        {/* FEATURES ROW */}
        <section className="features-grid">
          <div className="feat-card">
            <div className="feat-icon">🔒</div>
            <h3>P2P Encryption</h3>
            <p>Your video call data routes direct peer-to-peer using WebRTC standards. Enjoy private conversation streams without central logs.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🛡️</div>
            <h3>AI Guardian</h3>
            <p>Our real-time safety scanning system automatically identifies and bans policy violations, ensuring a respectful space.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">💬</div>
            <h3>Instant Matching</h3>
            <p>Skip complex profiles and setup hoops. Tap connect to find a friendly partner globally in under a second.</p>
          </div>
        </section>

        <div className="divider" />

        {/* SEO SECTION 1 */}
        <section className="content-section">
          <h2>Stranger Video Chat: The Modern Way to Meet People Online</h2>
          <p>
            The ways we socialize and build relationships have shifted dramatically. In the past, meeting people was limited to physical events or text-based chat containers. The rise of camera-enabled web interfaces introduced the era of **stranger video chat**, letting individuals bridge distances and share experiences with people worldwide.
          </p>
          <p>
            However, early chat rooms struggled with safety challenges. Without active moderation, legacy sites were overrun by spambots, malicious links, and offensive behavior. ZoneMeet is designed to correct these flaws. By implementing active AI scanning and secure account verification, we provide a modern stranger chat platform that keeps matching fun, authentic, and safe.
          </p>
        </section>

        {/* SEO SECTION 2 */}
        <section className="content-section">
          <h2>Why Moderation is Essential for Live Stranger Chat Rooms</h2>
          <p>
            Anonymity is exciting, but unregulated anonymity can attract bad actors. When looking for the best places to **talk to strangers**, safety should be your top priority. ZoneMeet implements several structural safeguards:
          </p>
          <ul>
            <li><strong>AI Guardian System:</strong> Running in the background of active matching channels, our AI scanner monitors video streams to identify nudity, abuse, and spam. Violations result in immediate, permanent bans.</li>
            <li><strong>Secure User Verification:</strong> We prevent emulator software and advertising loops by requiring secure social sign-ins, ensuring you only pair with live, real people.</li>
            <li><strong>Instant reporting:</strong> Help maintain a clean community. If a match behaves inappropriately, a single tap on the report icon flags their profile for immediate review.</li>
          </ul>
        </section>

        {/* SEO SECTION 3 */}
        <section className="content-section">
          <h2>High-Speed WebRTC: Direct Browser Cam Connections</h2>
          <p>
            Older chat rooms required downloading bulky client files or app store packages, which consumed device storage and battery life. ZoneMeet runs entirely on modern peer-to-peer WebRTC standards.
          </p>
          <p>
            This browser-first design lets you start video sessions natively on desktop and mobile screens. Grant temporary camera permissions to match instantly with zero downloads, ensuring low latency and high-definition video connections.
          </p>
        </section>

        {/* SEO SECTION 4 */}
        <section className="content-section">
          <h2>Practical Advice for a Positive and Secure Match Session</h2>
          <p>
            While our AI-Guardian blocks bots and inappropriate content, following standard digital safety guidelines is important:
          </p>
          <ol>
            <li><strong>Preserve Your Anonymity:</strong> Do not reveal sensitive details (such as your full name, location, address, or email) in casual matching pools.</li>
            <li><strong>Monitor Background Objects:</strong> Avoid displaying letters, school logos, or landmarks that indicate your physical address.</li>
            <li><strong>Avoid Off-Platform Links:</strong> Do not click on external links sent in chat. These are often cookies or IP harvesting attempts.</li>
            <li><strong>Be Respectful:</strong> ZoneMeet is built for friendly, respectful adults. Follow our 18+ guidelines to avoid profile suspension.</li>
          </ol>
        </section>

        {/* SEO SECTION 5 */}
        <section className="content-section">
          <h2>Explore Optimized and Regional Gateways on ZoneMeet</h2>
          <p>
            We accommodate diverse social preferences through specialized endpoints. If you want to match locally, visit our <Link href="/omegle-alternative-india" className="blog-link">Omegle alternative India</Link> portal to match with South Asian users. If you are looking for free video options, check the <Link href="/free-video-chat" className="blog-link">free video chat</Link> page.
          </p>
          <p>
            To expand your search capabilities, browse our global <Link href="/random-video-chat" className="blog-link">random video chat</Link> directory, or read safety tips in the <Link href="/blog/video-chat-with-strangers-guide" className="blog-link">video chat with strangers guide</Link>.
          </p>
        </section>

        <div className="divider" />

        {/* HOW TO START */}
        <section className="steps-section">
          <div className="section-header">
            <h2>How to Talk to Strangers Online</h2>
            <p>Connect with active, friendly people globally in three steps.</p>
          </div>
          <div className="steps-container">
            <div className="step">
              <span className="num">1</span>
              <h4>Allow Camera Access</h4>
              <p>Navigate to our match portal and grant temporary browser permissions for your camera and microphone.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="num">2</span>
              <h4>Select Filters</h4>
              <p>Select your language, country preferences, or gender tags to filter matching pools according to your preferences.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="num">3</span>
              <h4>Tap Connect</h4>
              <p>Instantly connect with a verified partner. Tap "Next" to swap partners or "Add Friend" to save connections.</p>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* SAFETY BOX */}
        <section className="safety-section">
          <div className="safety-box">
            <div className="safety-title">
              <span>🔞</span>
              <h2>Strictly 18+ Safe and Respectful Community</h2>
            </div>
            <p>
              ZoneMeet is strictly limited to adult users aged 18 and older. We enforce a zero-tolerance policy against nudity, harassment, commercial spam, and hate speech. Violations lead to immediate, permanent hardware and IP-level bans. Please help us maintain a friendly community by using our rapid-report buttons.
            </p>
          </div>
        </section>

        <div className="divider" />

        {/* FAQ SECTION */}
        <section className="faq-section">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Get answers to common questions about using ZoneMeet's stranger video chat portal.</p>
          </div>
          <div className="faq-list">
            <div className="faq-item">
              <h3>How can I start a stranger video chat safely?</h3>
              <p>To stay safe during a stranger video chat, use a moderated platform like ZoneMeet, keep your personal details confidential, ensure your camera background does not show your location, and report violating users immediately.</p>
            </div>
            <div className="faq-item">
              <h3>Is there a free stranger video chat app online?</h3>
              <p>Yes! ZoneMeet operates as a free, mobile-optimized stranger video chat web application. You can match with random users worldwide directly in your web browser without downloading any apps or purchasing subscription passes.</p>
            </div>
            <div className="faq-item">
              <h3>Do I need to sign up to talk to strangers?</h3>
              <p>Registration is completely optional. You can enter chat rooms and match with strangers anonymously. Creating a free account lets you access additional perks, such as the friend circle and regional filtering settings.</p>
            </div>
            <div className="faq-item">
              <h3>How does AI moderation keep the chat rooms clean?</h3>
              <p>Our automated AI Guardian scanner monitors video feeds in real time, automatically flagging and banning profiles that violate our terms of service (such as presenting nudity or advertising loops), protecting you from bad actors.</p>
            </div>
            <div className="faq-item">
              <h3>Can I match with people from a specific country?</h3>
              <p>Yes, ZoneMeet includes region and country filters. You can use these filters to narrow down matching pools to specific locations, like our optimized India video chat room for South Asian connections.</p>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="cta-bottom">
          <h2>Ready to start chatting with strangers?</h2>
          <p>Join millions of users who trust ZoneMeet as the safest, fastest, and most modern platform to talk to strangers.</p>
          <Link href="/" className="btn-primary btn-lg">
            Start Live Cam Chat
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

        /* CONTENT SECTIONS */
        .content-section { margin-bottom: 60px; font-size: 1.1rem; line-height: 1.8; color: #cbd5e1; }
        .content-section h2 { font-size: 2.2rem; font-weight: 900; color: white; margin-bottom: 24px; letter-spacing: -0.5px; }
        .content-section h3 { font-size: 1.6rem; font-weight: 800; color: white; margin: 30px 0 15px; letter-spacing: -0.5px; }
        .content-section p { margin-bottom: 20px; }
        .content-section strong { color: white; }
        .content-section ul, .content-section ol { margin: 0 0 24px 24px; }
        .content-section li { margin-bottom: 12px; font-size: 1.02rem; }
        .blog-link { color: #818cf8; text-decoration: underline; font-weight: 600; }
        .blog-link:hover { color: #a5b4fc; }

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
