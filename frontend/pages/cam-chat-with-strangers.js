import Head from "next/head";
import Link from "next/link";

export default function CamChatWithStrangers() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is cam chat with strangers on ZoneMeet safe?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, ZoneMeet is designed with advanced safety layers including real-time AI Guardian scanning that detects terms-of-service violations (such as inappropriate content or pre-recorded loops) and suspends violators instantly. Users also have access to report buttons to flag bad actors directly."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use the cam chat on my mobile phone?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. ZoneMeet is built using fully responsive, mobile-first WebRTC technology. It runs directly inside Chrome, Safari, and other mobile web browsers on both iOS and Android. No app store downloads or installations are required."
        }
      },
      {
        "@type": "Question",
        "name": "Are there limits on how many strangers I can chat with?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, matching on our platform is completely unlimited. You can swap partners as many times as you like by tapping the 'Next' button. There are no credit barriers or minute-based paywalls for standard matching sessions."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need to create an account or register to start?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No signup is required. You can jump directly into guest mode, grant camera and microphone permissions, and match with verified profiles immediately. Optional registration is available if you want to customize your nickname or save friend connections."
        }
      },
      {
        "@type": "Question",
        "name": "How does regional filtering work on ZoneMeet?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ZoneMeet features geolocation filters. You can use daily login streak rewards or standard credits to customize matches by country, allowing you to connect locally in India, North America, Europe, or other specific regions."
        }
      }
    ]
  };

  return (
    <div className="landing-wrap">
      <Head>
        <title>Cam Chat with Strangers: Meet New People Instantly | ZoneMeet</title>
        <meta
          name="description"
          content="Start a high-definition cam chat with strangers online. ZoneMeet offers secure, AI-moderated video chat rooms to talk to strangers with no signup required."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://zonemeet.chat/cam-chat-with-strangers" />
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
          <div className="badge">🎥 LIVE WEBCAM MATCHING</div>
          <h1>
            Instant HD Cam Chat<br />
            <span>With Strangers Online.</span>
          </h1>
          <p className="hero-sub">
            Connect face-to-face with friendly people globally. Our secure browser-based cam chat pairs you with active, verified users instantly for engaging live conversations.
          </p>
          <div className="hero-btns">
            <Link href="/" className="btn-primary">
              Start Cam Chat Now
            </Link>
          </div>
        </section>

        {/* FEATURES ROW */}
        <section className="features-grid">
          <div className="feat-card">
            <div className="feat-icon">🌐</div>
            <h3>Global Connections</h3>
            <p>Connect with millions of active webcams in over 190 countries. Experience diverse languages and cultures from your screen.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🛡️</div>
            <h3>Secure AI Guardian</h3>
            <p>Our background AI filters scan active connections for policy violations, instantly flagging nudity and harassment to preserve safety.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">⚡</div>
            <h3>Zero App Downloads</h3>
            <p>No downloads or app installs needed. ZoneMeet works directly in your browser on desktop and mobile devices using WebRTC.</p>
          </div>
        </section>

        <div className="divider" />

        {/* SEO SECTION 1 */}
        <section className="content-section">
          <h2>Cam Chat with Strangers: The Rise of Real-Time Video Socializing</h2>
          <p>
            The internet has transformed from a simple repository of text-based information into a vibrant, living ecosystem of real-time communication. Today, millions of people search for ways to connect face-to-face with new people, hoping to step outside their physical circles and experience the world through different eyes. Seeking a high-quality **cam chat with strangers** is one of the most exciting ways to achieve this. By utilizing modern webcam networks, users can instantly transport themselves into virtual meetings with partners located thousands of miles away.
          </p>
          <p>
            In the early days of webcam platforms, finding a stable connection was difficult, and users frequently faced poor video quality, lags, and disconnects. More importantly, security and safety were major issues due to the lack of moderation. Legacy chat systems were often plagued by spam profiles, commercial bots, and offensive behavior. ZoneMeet is designed to resolve these historic issues. Combining cutting-edge WebRTC audio-video streaming, secure token authentications, and state-of-the-art AI-driven moderation, ZoneMeet represents a new era in anonymous live video communication.
          </p>
        </section>

        {/* SEO SECTION 2 */}
        <section className="content-section">
          <h2>Why Choose a WebRTC Browser-First Cam Chat Platform?</h2>
          <p>
            When choosing a platform to **talk to strangers online**, user experience and device safety are paramount. Many older systems require users to download third-party software, install browser extensions, or download large mobile applications from app stores. These downloads pose a security risk, consume storage space, and drain battery life. 
          </p>
          <p>
            ZoneMeet relies entirely on WebRTC (Web Real-Time Communication) standards. This represents a major leap forward for several reasons:
          </p>
          <ul>
            <li><strong>Peer-to-Peer Encryption:</strong> WebRTC allows audio and video streams to travel directly between you and your partner, without routing through central media servers. This ensures your conversation remains private and heavily secured.</li>
            <li><strong>Ultra-Low Latency:</strong> By avoiding intermediate server hops, WebRTC minimizes connection lag. This results in natural, real-time conversations without awkward delays or audio overlaps.</li>
            <li><strong>Cross-Platform Compatibility:</strong> WebRTC is supported natively by modern web browsers, including Chrome, Safari, Firefox, and Edge. Whether you are using a high-powered desktop computer or an iPhone or Android phone, the platform responds automatically.</li>
            <li><strong>High-Definition Feeds:</strong> The protocol dynamically adjusts stream resolutions based on your network conditions, providing clear HD video and clean audio when bandwidth permits.</li>
          </ul>
        </section>

        {/* SEO SECTION 3 */}
        <section className="content-section">
          <h2>Key Features that Make ZoneMeet the Safest Chatroom on the Web</h2>
          <p>
            Socializing online should be fun, but keeping users safe is our highest priority. To maintain a respectful, welcoming community, ZoneMeet utilizes a multi-layered security system that works quietly in the background:
          </p>
          <p>
            First and foremost is our **AI Guardian System**. Our proprietary background AI constantly scans active video streams to detect violations of our community guidelines, such as nudity, graphic violence, or pre-recorded marketing loops. Violating profiles are automatically flagged and queued for instant suspension, keeping the chat feed clean and friendly.
          </p>
          <p>
            Additionally, ZoneMeet features an **Instant Report Mechanism**. If a matched user behaves rudely, uses offensive language, or displays inappropriate content, you can tap the report flag on your screen. This immediately terminates the connection, routes you to a new partner, and submits the violator's stream history to our security team. The system enforces permanent hardware and IP-level bans for severe offenses.
          </p>
          <p>
            We also implement **Bot Protection Filters**. To prevent pre-recorded streams and advertising bots, ZoneMeet uses browser telemetry checks. This ensures that you only match with real, live people who are ready to engage in genuine conversations.
          </p>
        </section>

        {/* SEO SECTION 4 */}
        <section className="content-section">
          <h2>Essential Guidelines for Secure and Fun Stranger Chats</h2>
          <p>
            While our AI moderation blocks bots and inappropriate content, users should practice smart digital citizenship when chatting with people online. Keep these safety tips in mind during your sessions:
          </p>
          <ol>
            <li><strong>Guard Your Personal Information:</strong> Never share sensitive details like your full name, home address, phone number, email address, or financial coordinates. If a match asks you to move to another app immediately, exercise caution.</li>
            <li><strong>Be Aware of Your Background:</strong> Before starting your camera, look around your room. Ensure that personal items like packages, mail, diplomas, school uniforms, or unique landmarks outside your window are not visible to the camera.</li>
            <li><strong>Do Not Click External Links:</strong> If a chat partner sends a link in a text block, do not click it. These links can lead to phishing sites, cookies tracking, or malware downloads.</li>
            <li><strong>Treat Others with Respect:</strong> ZoneMeet is built for friendly, respectful conversations. Keep your dialogue polite and follow the terms of service. Abusive behavior will result in account bans.</li>
          </ol>
        </section>

        {/* SEO SECTION 5 */}
        <section className="content-section">
          <h2>Navigating Internal Match Options and Regional Rooms</h2>
          <p>
            ZoneMeet offers customized endpoints to fit your social goals. If you want to connect with users without signing up, visit our <Link href="/free-video-chat" className="blog-link">free video chat</Link> page. If you are looking for absolute privacy, read our <Link href="/anonymous-video-chat" className="blog-link">anonymous video chat</Link> guide.
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
            <h2>How to Begin Your Cam Chat</h2>
            <p>Connect with friendly strangers in three simple steps.</p>
          </div>
          <div className="steps-container">
            <div className="step">
              <span className="num">1</span>
              <h4>Enable Your Webcam</h4>
              <p>Visit the ZoneMeet homepage and grant the browser permission to access your camera and microphone.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="num">2</span>
              <h4>Set Preferences</h4>
              <p>Configure regional or language filters to target specific countries or match preferences.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="num">3</span>
              <h4>Click Start Matching</h4>
              <p>Instantly match with verified active cams. Swap partners using the 'Next' button or add them as a friend.</p>
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
            <p>Find answers to common questions about using our stranger cam chat platform.</p>
          </div>
          <div className="faq-list">
            <div className="faq-item">
              <h3>Is cam chat with strangers on ZoneMeet safe?</h3>
              <p>Yes, ZoneMeet is designed with advanced safety layers including real-time AI Guardian scanning that detects terms-of-service violations (such as inappropriate content or pre-recorded loops) and suspends violators instantly. Users also have access to report buttons to flag bad actors directly.</p>
            </div>
            <div className="faq-item">
              <h3>Can I use the cam chat on my mobile phone?</h3>
              <p>Absolutely. ZoneMeet is built using fully responsive, mobile-first WebRTC technology. It runs directly inside Chrome, Safari, and other mobile web browsers on both iOS and Android. No app store downloads or installations are required.</p>
            </div>
            <div className="faq-item">
              <h3>Are there limits on how many strangers I can chat with?</h3>
              <p>No, matching on our platform is completely unlimited. You can swap partners as many times as you like by tapping the 'Next' button. There are no credit barriers or minute-based paywalls for standard matching sessions.</p>
            </div>
            <div className="faq-item">
              <h3>Do I need to create an account or register to start?</h3>
              <p>No signup is required. You can jump directly into guest mode, grant camera and microphone permissions, and match with verified profiles immediately. Optional registration is available if you want to customize your nickname or save friend connections.</p>
            </div>
            <div className="faq-item">
              <h3>How does regional filtering work on ZoneMeet?</h3>
              <p>ZoneMeet features geolocation filters. You can use daily login streak rewards or standard credits to customize matches by country, allowing you to connect locally in India, North America, Europe, or other specific regions.</p>
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
