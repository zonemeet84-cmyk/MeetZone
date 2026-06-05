import Head from "next/head";
import Link from "next/link";

export default function OnlineCamToCamChat() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What does cam-to-cam chat mean?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Cam-to-cam (C2C) chat refers to a two-way video communication stream where both users share their webcams simultaneously. This allows both parties to see and hear each other in real-time, creating a fully interactive, face-to-face random chat experience."
        }
      },
      {
        "@type": "Question",
        "name": "Are the two-way video streams encrypted on ZoneMeet?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. ZoneMeet utilizes standard WebRTC protocols which route video and audio streams direct peer-to-peer (P2P) between matching users. This connection is fully encrypted, ensuring that your chat streams are private and secure from external interceptions."
        }
      },
      {
        "@type": "Question",
        "name": "Does my device need a high-speed connection for cam-to-cam chat?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "While WebRTC is highly optimized for performance, a stable internet connection (WiFi or 4G/5G) is recommended. The platform dynamically adjusts stream quality and resolution based on your network bandwidth to prevent stuttering and disconnects."
        }
      },
      {
        "@type": "Question",
        "name": "Can I report a user who shows a blank screen or fake feed?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, our guidelines strictly prohibit black screens, pre-recorded virtual cams, or commercial video loops. You can use the report button to immediately flag these profiles, triggering an automated scan that filters and bans fake webcam streams."
        }
      },
      {
        "@type": "Question",
        "name": "How does ZoneMeet match users in C2C mode?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ZoneMeet features an instant algorithmic matchmaking queue. Once camera permissions are granted, you are paired with another online user. Tapping 'Next' swaps you instantly with another active webcam profile, maintaining continuous, spontaneous connections."
        }
      }
    ]
  };

  return (
    <div className="landing-wrap">
      <Head>
        <title>Online Cam-to-Cam Chat: Direct Two-Way Matching | ZoneMeet</title>
        <meta
          name="description"
          content="Connect instantly via online cam-to-cam chat. Share live video streams peer-to-peer on ZoneMeet's secure, AI-moderated video matchmaking platform."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://zonemeet.chat/online-cam-to-cam-chat" />
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
          <div className="badge">💻 DIRECT TWO-WAY STREAMING</div>
          <h1>
            Online Cam-to-Cam<br />
            <span>Chat Rooms.</span>
          </h1>
          <p className="hero-sub">
            Experience direct, crystal-clear two-way webcam matching. Connect face-to-face with verified people worldwide with zero delay and absolute encryption.
          </p>
          <div className="hero-btns">
            <Link href="/" className="btn-primary">
              Launch Cam-to-Cam Chat
            </Link>
          </div>
        </section>

        {/* FEATURES ROW */}
        <section className="features-grid">
          <div className="feat-card">
            <div className="feat-icon">🔒</div>
            <h3>P2P Encryption</h3>
            <p>Video signals connect directly between user devices using WebRTC, bypass central servers, and keep your stream fully private.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🤖</div>
            <h3>Fake Feed Detection</h3>
            <p>Our background safety filters scan and block virtual cameras, loops, and fake streams, ensuring you match with real active webcams.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">⚡</div>
            <h3>Instant Connection</h3>
            <p>Enjoy low-latency audio-video streams with smart routing. Connect globally in fractions of a second with no download lag.</p>
          </div>
        </section>

        <div className="divider" />

        {/* SEO SECTION 1 */}
        <section className="content-section">
          <h2>Online Cam-to-Cam Chat: Reimagining Interactive Virtual Matchmaking</h2>
          <p>
            The evolution of virtual communication has progressed from text messages and voice calls to dynamic, two-way visual streams. Today, users seek more than static, one-way video consumption. They want an interactive, immersive experience where they can see and be seen simultaneously. This has led to the popularity of **online cam-to-cam chat** (C2C). This two-way communication format allows matching users to exchange live video and audio streams in real-time, creating a face-to-face dynamic that mimics in-person socializing.
          </p>
          <p>
            However, achieving a high-quality cam-to-cam experience requires robust technical design and strict community moderation. Many older video platforms suffer from high latency, frequent disconnections, and, most importantly, spam accounts. Users on legacy networks often match with pre-recorded marketing videos, blank black screens, or commercial advertisements instead of real people. ZoneMeet is designed to solve these issues. By combining direct WebRTC streaming, real-time AI guard moderations, and strict rules against virtual cameras, ZoneMeet provides a clean, premium environment for authentic two-way conversations.
          </p>
        </section>

        {/* SEO SECTION 2 */}
        <section className="content-section">
          <h2>The Technical Architecture Behind High-Quality C2C Connections</h2>
          <p>
            A high-quality **online cam-to-cam chat** requires advanced networking technology. Traditional video calling platforms route all user streams through central servers. This server routing introduces latency, increases bandwidth costs, and presents privacy concerns, as user data is processed by a third party.
          </p>
          <p>
            ZoneMeet operates on peer-to-peer WebRTC standards, which change how video data is handled:
          </p>
          <ul>
            <li><strong>Direct Peer Matching:</strong> WebRTC allows matching webcams to connect directly to each other. Once a match is confirmed by our signaling server, the video and audio streams travel directly between the two user devices.</li>
            <li><strong>End-to-End Encryption:</strong> Because the connection is direct, data is encrypted peer-to-peer. This ensures that only you and your chat partner can access the audio-video stream.</li>
            <li><strong>Dynamic Bandwidth Adaptation:</strong> Internet speeds vary by device and location. Our WebRTC integration constantly monitors network quality and adjusts resolutions in real-time, preserving connection stability even on cellular networks.</li>
            <li><strong>Hardware Acceleration:</strong> Modern browsers leverage GPU acceleration to decode and render video streams. This minimizes processor usage and prevents battery drain on mobile phones and tablets.</li>
          </ul>
        </section>

        {/* SEO SECTION 3 */}
        <section className="content-section">
          <h2>Strict Anti-Bot Moderation and verified Matchmaking pools</h2>
          <p>
            The biggest challenge facing modern random video platforms is the presence of fake profiles and automated bots. Many platforms allow users to stream pre-recorded video loops or virtual cameras, which ruins the chat experience.
          </p>
          <p>
            ZoneMeet uses several layers of protection to ensure all matches are authentic:
          </p>
          <ol>
            <li><strong>Virtual Camera Blocking:</strong> Our system detects and blocks virtual camera software, emulator scripts, and static image streams. If a user attempts to run a pre-recorded loop, their connection is blocked.</li>
            <li><strong>Real-Time AI Scanning:</strong> Our background AI Guardian continuously monitors streams to identify violations of our terms of service, such as nudity, graphic content, or spam. Violating accounts are suspended instantly.</li>
            <li><strong>Community Reporting:</strong> If a user displays inappropriate content or runs a loop that bypasses the automated filter, you can tap the report button. This immediately skips the match, flags the account for manual review, and routes you to a new partner.</li>
            <li><strong>Streak Rewards and Verification:</strong> We encourage positive community engagement by offering daily login rewards, which verified users can use to access country filters and other premium options.</li>
          </ol>
        </section>

        {/* SEO SECTION 4 */}
        <section className="content-section">
          <h2>Best Practices for a Safe and Friendly Video Chat Session</h2>
          <p>
            While we work to keep our matching pools clean and verified, users should take standard precautions to protect their safety and privacy online:
          </p>
          <ul>
            <li><strong>Protect Your Privacy:</strong> Do not share personal details like your full name, location, social media profiles, or email address with strangers. Keep conversations focused on casual topics.</li>
            <li><strong>Check Your Surroundings:</strong> Ensure your background is tidy and does not show sensitive information, such as packages, school logos, or family photos.</li>
            <li><strong>Do Not Click Links:</strong> If a chat partner sends a link in a text message, do not click it. These links can lead to phishing sites, cookies tracking, or malware downloads.</li>
            <li><strong>Follow Community Rules:</strong> ZoneMeet is strictly for users aged 18 and older. Show respect, stay fully clothed, and help us maintain a friendly community.</li>
          </ul>
        </section>

        {/* SEO SECTION 5 */}
        <section className="content-section">
          <h2>Discover Optimized Gateways and Navigation Pathways</h2>
          <p>
            ZoneMeet provides specialized portals to accommodate different matchmaking goals. If you want to connect with users without signing up, visit our <Link href="/free-video-chat" className="blog-link">free video chat</Link> page. If you are looking for absolute privacy, read our <Link href="/anonymous-video-chat" className="blog-link">anonymous video chat</Link> guide.
          </p>
          <p>
            We also provide regional portals, such as our dedicated <Link href="/omegle-alternative-india" className="blog-link">Omegle alternative India</Link> room. To explore different choices, check out the <Link href="/stranger-video-chat" className="blog-link">stranger video chat</Link> page, or learn about overall security by reading our blog article <Link href="/blog/is-random-video-chat-safe" className="blog-link">is random video chat safe</Link>.
          </p>
          <p>
            No matter which portal you choose, you can always return to the main <Link href="/random-video-chat" className="blog-link">random video chat</Link> index to match instantly with verified webcams worldwide.
          </p>
        </section>

        <div className="divider" />

        {/* HOW TO START */}
        <section className="steps-section">
          <div className="section-header">
            <h2>How to Start Cam-to-Cam Chat</h2>
            <p>Connect with active, verified webcams in three easy steps.</p>
          </div>
          <div className="steps-container">
            <div className="step">
              <span className="num">1</span>
              <h4>Grant Browser Permissions</h4>
              <p>Navigate to our portal and allow camera and microphone access to enable two-way streaming.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="num">2</span>
              <h4>Select Matching Filters</h4>
              <p>Optionally configure regional, country, or language preferences to match with specific users.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="num">3</span>
              <h4>Tap Start Matching</h4>
              <p>Match immediately with active users. Swap partners with the "Next" button or click "Add Friend" to stay in touch.</p>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* SAFETY BOX */}
        <section className="safety-section">
          <div className="safety-box">
            <div className="safety-title">
              <span>🔞</span>
              <h2>Strictly 18+ Clean Community Standards</h2>
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
            <p>Find answers to common questions about using our cam-to-cam chat rooms.</p>
          </div>
          <div className="faq-list">
            <div className="faq-item">
              <h3>What does cam-to-cam chat mean?</h3>
              <p>Cam-to-cam (C2C) chat refers to a two-way video communication stream where both users share their webcams simultaneously. This allows both parties to see and hear each other in real-time, creating a fully interactive, face-to-face random chat experience.</p>
            </div>
            <div className="faq-item">
              <h3>Are the two-way video streams encrypted on ZoneMeet?</h3>
              <p>Yes. ZoneMeet utilizes standard WebRTC protocols which route video and audio streams direct peer-to-peer (P2P) between matching users. This connection is fully encrypted, ensuring that your chat streams are private and secure from external interceptions.</p>
            </div>
            <div className="faq-item">
              <h3>Does my device need a high-speed connection for cam-to-cam chat?</h3>
              <p>While WebRTC is highly optimized for performance, a stable internet connection (WiFi or 4G/5G) is recommended. The platform dynamically adjusts stream quality and resolution based on your network bandwidth to prevent stuttering and disconnects.</p>
            </div>
            <div className="faq-item">
              <h3>Can I report a user who shows a blank screen or fake feed?</h3>
              <p>Yes, our guidelines strictly prohibit black screens, pre-recorded virtual cams, or commercial video loops. You can use the report button to immediately flag these profiles, triggering an automated scan that filters and bans fake webcam streams.</p>
            </div>
            <div className="faq-item">
              <h3>How does ZoneMeet match users in C2C mode?</h3>
              <p>ZoneMeet features an instant algorithmic matchmaking queue. Once camera permissions are granted, you are paired with another online user. Tapping 'Next' swaps you instantly with another active webcam profile, maintaining continuous, spontaneous connections.</p>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="cta-bottom">
          <h2>Ready to start a two-way video chat?</h2>
          <p>Join millions of users who trust ZoneMeet as the safest, fastest, and most modern platform to talk to strangers.</p>
          <Link href="/" className="btn-primary btn-lg">
            Start Live Cam-to-Cam
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

        /* STEPS SECTION */
        .steps-section { text-align: center; }
        .section-header h2 { font-size: 2.2rem; font-weight: 900; color: white; margin-bottom: 15px; letter-spacing: -0.5px; }
        .section-header p { color: #94a3b8; font-size: 1.1rem; margin-bottom: 50px; }
        .steps-container { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
        .step {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 24px;
          padding: 35px 25px;
          flex: 1;
          transition: 0.3s;
        }
        .step:hover { border-color: rgba(99,102,241,0.25); background: rgba(99,102,241,0.02); }
        .step .num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          font-weight: 900;
          font-size: 1.25rem;
          color: white;
          margin-bottom: 20px;
        }
        .step h4 { font-size: 1.15rem; font-weight: 800; margin-bottom: 10px; }
        .step p { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; }
        .step-arrow { color: #475569; font-size: 1.8rem; font-weight: 700; }

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
        .faq-item p { color: #94a3b8; font-size: 0.9rem; line-height: 1.65; }

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
