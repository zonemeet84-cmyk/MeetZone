import Head from "next/head";
import Link from "next/link";

export default function OmeTvAlternative() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is ZoneMeet a good OmeTV alternative for meeting new people?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, ZoneMeet is one of the best OmeTV alternatives. It offers completely free matches, low latency WebRTC video connections, strict AI-driven safety moderation, and does not require you to download any bulky mobile apps."
        }
      },
      {
        "@type": "Question",
        "name": "Why do users get banned on OmeTV and how is ZoneMeet different?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "OmeTV is known for automated, strict bans that are often difficult to appeal. ZoneMeet uses a transparent system of real-time AI warnings and reports, encouraging a friendly community. While we do ban malicious actors permanently, our automated filters target bots and policy violations without punishing casual, respectful chatters."
        }
      },
      {
        "@type": "Question",
        "name": "Can I select specific regions or languages?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. ZoneMeet features regional and language preferences. If you want to connect with local matches in specific zones, you can set your preferences dynamically. We maintain optimized servers in several major regions to support smooth matching."
        }
      },
      {
        "@type": "Question",
        "name": "Is ZoneMeet completely free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, matching and text chatting are 100% free. You can earn daily check-in rewards and maintain streaks to access additional features without ever entering payment information."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need to download an APK or app from the App Store?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No downloads are required. ZoneMeet is designed as a browser-first web application. It runs natively in mobile browsers like Chrome and Safari, giving you an app-like experience without using storage space or draining your battery."
        }
      }
    ]
  };

  return (
    <div className="landing-wrap">
      <Head>
        <title>Best OmeTV Alternative: Free Video Chat with Strangers | ZoneMeet</title>
        <meta
          name="description"
          content="Looking for the best OmeTV alternative? Meet new people on ZoneMeet. Safe, free random chat and online video chat with strangers. No downloads required."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://zonemeet.chat/ome-tv-alternative" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content="Best OmeTV Alternative: Free Video Chat with Strangers | ZoneMeet" />
        <meta
          property="og:description"
          content="Discover the premier OmeTV alternative for spontaneous social discovery. Safe, free random chat with verified profiles on ZoneMeet."
        />
        <meta property="og:url" content="https://zonemeet.chat/ome-tv-alternative" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://zonemeet.chat/global-friends.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Best OmeTV Alternative: Free Video Chat with Strangers | ZoneMeet" />
        <meta name="twitter:description" content="Meet new people on ZoneMeet. Safe, free random video chat with strangers." />

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

        {/* DISCLAIMER */}
        <div className="disclaimer-box">
          <p>
            <strong>Trademark Disclaimer:</strong> ZoneMeet is an independent live video chat platform. OmeTV™ is a registered trademark of its respective owner. 
            References to OmeTV on this page are made strictly for informational, educational, and SEO comparison purposes. ZoneMeet has no affiliation, 
            sponsorship, or partnership with OmeTV, its parent company, or its brand.
          </p>
        </div>

        {/* HERO */}
        <section className="hero">
          <div className="badge">🛡️ INDEPENDENT &amp; 100% FREE</div>
          <h1>
            Best OmeTV Alternative<br />
            <span>for Meeting New People.</span>
          </h1>
          <p className="hero-sub">
            Skip the app store downloads, annoying paywalls, and random, unexplained account bans. ZoneMeet is the ultimate 
            <strong> OmeTV alternative</strong> designed to help you start an <strong>online video chat</strong> with real people instantly. 
            Enjoy seamless P2P matches, active AI-based moderation, and <strong>free random chat</strong> directly in your mobile browser.
          </p>
          <div className="hero-btns">
            <Link href="/" className="btn-primary">
              Start Free Video Chat Now
            </Link>
          </div>
        </section>

        {/* FEATURES ROW */}
        <section className="features-grid">
          <div className="feat-card">
            <div className="feat-icon">👋</div>
            <h3>Meet Real People</h3>
            <p>Connect with verified users in high-quality video formats. Our anti-bot protocols screen out loops, fake streams, and spam accounts.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📱</div>
            <h3>Browser-Native App</h3>
            <p>No downloads required. Get a full, high-performance mobile video chat application experience natively in Chrome, Safari, or Firefox.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🔒</div>
            <h3>Secure WebRTC Calls</h3>
            <p>Your connections are fully encrypted and direct peer-to-peer. We do not store or process your camera feeds on our central servers.</p>
          </div>
        </section>

        <div className="divider" />

        {/* SECTION 1: THE SEARCH FOR OMETV ALTERNATIVES */}
        <section className="content-section">
          <h2>Why Users Look for OmeTV Alternatives in 2026</h2>
          <p>
            Over the last few years, OmeTV became a popular choice for mobile video chatters looking to connect with strangers on the go. The premise of swiping to match with random users globally appealed to millions. However, as the user base grew, the platform encountered several persistent issues that left casual chatters frustrated.
          </p>
          <p>
            One of the most common complaints is the platform's ban system. OmeTV is notorious for applying automated, permanent bans to users' accounts with little to no explanation. A sudden network disconnect, a minor movement, or an accidental report from another user can trigger an IP-level block. For users who simply want to have friendly conversations, having their access revoked without a clear appeal process is extremely disappointing.
          </p>
          <p>
            Additionally, OmeTV requires users to install their mobile app to get a stable connection. Downloading apps from stores consumes phone memory, accesses contact lists, and drains battery life with background services. These app store requirements, combined with increasing ad placements and paywalls for basic features like gender filtering, have driven a search for a more accessible, web-based <strong>ome tv alternative</strong>.
          </p>
          <p>
            ZoneMeet solves these issues by delivering a browser-native <strong>video chat with strangers</strong> that doesn't require downloads. By shifting to a web-first architecture, we offer the same fast swiping experience without the risk of arbitrary bans, aggressive tracking, or device memory usage.
          </p>
        </section>

        {/* SECTION 2: HOW ZONEMEET REDEFINES STRANGER VIDEO CHAT */}
        <section className="content-section">
          <h2>How ZoneMeet Delivers a Better Random Chat Experience</h2>
          <p>
            We believe that meeting people online should be simple, safe, and stress-free. Here is what makes ZoneMeet the premier <strong>best OmeTV alternative</strong> for spontaneous digital matching:
          </p>

          <div className="sub-grid">
            <div className="sub-card">
              <h3>1. Browser-First mobile Design</h3>
              <p>
                You don't need to visit an app store or download files. ZoneMeet is designed specifically for mobile browsers. The layout is optimized to load instantly, display camera feeds in native resolutions, and provide touch-friendly controls on both iOS and Android.
              </p>
            </div>
            <div className="sub-card">
              <h3>2. Smart Anti-Ban Safeguards</h3>
              <p>
                We do not believe in banning users without reason. Our moderation system uses a combination of automated AI scanning and human review. If a user receives a warning, we clearly communicate the issue, preventing arbitrary locks and keeping the platform fair and accessible.
              </p>
            </div>
            <div className="sub-card">
              <h3>3. Verified Matchmaking Pools</h3>
              <p>
                To eliminate the spambots that plague legacy systems, ZoneMeet requires a quick account verification. This simple step filters out marketing bots and ensures that every partner you match with is a real person seeking authentic conversation.
              </p>
            </div>
            <div className="sub-card">
              <h3>4. Custom Social Features</h3>
              <p>
                Enjoyed a conversation? Use our Friend Circle list to add your matching partner. You can text chat and launch direct video calls whenever you want, ensuring you never lose touch with the people you connect with.
              </p>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* SECTION 3: COMPARISON TABLE */}
        <section className="compare-section">
          <div className="section-header">
            <h2>Feature Comparison: ZoneMeet vs. OmeTV</h2>
            <p>A quick breakdown of how our free web app compares to OmeTV's mobile client.</p>
          </div>
          <div className="table-wrapper">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>ZoneMeet (Independent)</th>
                  <th>OmeTV</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>App Installation</strong></td>
                  <td className="highlight-yes">No (Runs 100% in Mobile Browser)</td>
                  <td className="highlight-no">Recommended app store download</td>
                </tr>
                <tr>
                  <td><strong>Pricing</strong></td>
                  <td className="highlight-yes">100% Free Matching & Text Chat</td>
                  <td>Subscription features and ad popups</td>
                </tr>
                <tr>
                  <td><strong>Ban System</strong></td>
                  <td className="highlight-yes">AI Warnings + Transparent Human Appeals</td>
                  <td className="highlight-no">Frequent, arbitrary automated bans</td>
                </tr>
                <tr>
                  <td><strong>Friend List</strong></td>
                  <td className="highlight-yes">Yes (Add matches and direct call back)</td>
                  <td className="highlight-no">Limited / Paid add-ons</td>
                </tr>
                <tr>
                  <td><strong>Data Privacy</strong></td>
                  <td className="highlight-yes">P2P Encrypted WebRTC streams</td>
                  <td>Centralized server routing</td>
                </tr>
                <tr>
                  <td><strong>Spam Control</strong></td>
                  <td className="highlight-yes">AI detection + Account Sign-in checks</td>
                  <td>Basic reporting flags</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="divider" />

        {/* SECTION 4: MOBILE RESPONSIVENESS AND COMPATIBILITY */}
        <section className="content-section">
          <h2>Mobile Compatibility &amp; Optimized Web Performance</h2>
          <p>
            Mobile optimization is at the core of the ZoneMeet platform. Because our users connect from a variety of devices, including older smartphones and tablets, we optimized our video compression and WebRTC protocols to run efficiently on limited hardware.
          </p>
          <p>
            ZoneMeet detects your device configuration and adjusts the camera resolution dynamically to prevent lagging, browser crashes, or excessive data usage. Whether you are on a high-speed 5G network or a standard Wi-Fi connection, you will experience smooth transitions and clear audio.
          </p>
          <p>
            Furthermore, the user interface adapts to portrait and landscape modes seamlessly. Controls are placed at the bottom of the screen for easy single-handed swiping, making your <strong>free random chat</strong> experience comfortable and intuitive.
          </p>
          <p>
            To learn more about optimizing your device for video chats, check out our comprehensive guide on <Link href="/blog/how-to-talk-to-strangers-online" className="blog-link">How to Talk to Strangers Online</Link> or visit our <Link href="/faq" className="blog-link">Help &amp; FAQ Portal</Link> for browser troubleshooting tips.
          </p>
        </section>

        {/* SECTION 5: SAFETY AND COMMUNITY RULES */}
        <section className="content-section">
          <h2>Strict Safety and Community Guidelines</h2>
          <p>
            A common issue with open random chat platforms is the risk of encountering inappropriate behavior. At ZoneMeet, we maintain a zero-tolerance policy to protect our community. Our AI Guardian scans connections in real-time, detecting policy violations and commercial spam instantly.
          </p>
          <p>
            We enforce rules against nudity, harassment, hate speech, and marketing scripts. By maintaining these high standards, we ensure that ZoneMeet remains a safe, welcoming space for everyone. We require all users to be at least 18 years old to access the matching network.
          </p>
          <p>
            If you encounter a user violating our rules, click the report flag. Reports are prioritized immediately, and our team applies IP-level bans to keep the matching pool clean and respectful.
          </p>
        </section>

        {/* SECTION 6: HOW TO START */}
        <section className="steps-section">
          <div className="section-header">
            <h2>Start Meeting New People Online</h2>
            <p>Follow these steps to match with active streams in seconds.</p>
          </div>
          <div className="steps-container">
            <div className="step">
              <span className="num">1</span>
              <h4>Quick Login</h4>
              <p>Sign in using your Google account or email. It takes less than 10 seconds and verifies you as a real user.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="num">2</span>
              <h4>Grant Permissions</h4>
              <p>Enable browser permissions for your camera and microphone so your matching partners can see and hear you.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="num">3</span>
              <h4>Start Swiping</h4>
              <p>Click the start button to pair with verified chatters. Swipe next to change matches, or add them to your friends list.</p>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* SECTION 7: FAQ SECTION */}
        <section className="faq-section">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Answers to common questions about using ZoneMeet as your OmeTV alternative.</p>
          </div>
          <div className="faq-list">
            <div className="faq-item">
              <h3>Is ZoneMeet a good OmeTV alternative for meeting new people?</h3>
              <p>Yes, ZoneMeet is one of the best OmeTV alternatives. It offers completely free matches, low latency WebRTC video connections, strict AI-driven safety moderation, and does not require you to download any bulky mobile apps.</p>
            </div>
            <div className="faq-item">
              <h3>Why do users get banned on OmeTV and how is ZoneMeet different?</h3>
              <p>OmeTV is known for automated, strict bans that are often difficult to appeal. ZoneMeet uses a transparent system of real-time AI warnings and reports, encouraging a friendly community. While we do ban malicious actors permanently, our automated filters target bots and policy violations without punishing casual, respectful chatters.</p>
            </div>
            <div className="faq-item">
              <h3>Can I select specific regions or languages?</h3>
              <p>Yes. ZoneMeet features regional and language preferences. If you want to connect with local matches in specific zones, you can set your preferences dynamically. We maintain optimized servers in several major regions to support smooth matching.</p>
            </div>
            <div className="faq-item">
              <h3>Is ZoneMeet completely free to use?</h3>
              <p>Yes, matching and text chatting are 100% free. You can earn daily check-in rewards and maintain streaks to access additional features without ever entering payment information.</p>
            </div>
            <div className="faq-item">
              <h3>Do I need to download an APK or app from the App Store?</h3>
              <p>No downloads are required. ZoneMeet is designed as a browser-first web application. It runs natively in mobile browsers like Chrome and Safari, giving you an app-like experience without using storage space or draining your battery.</p>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="cta-bottom">
          <h2>Ready to Try the Best OmeTV Alternative?</h2>
          <p>Join thousands of verified users online. Connect, chat, and meet new friends around the world for free on ZoneMeet.</p>
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
        .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
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

        /* DISCLAIMER BOX */
        .disclaimer-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 60px;
          color: #64748b;
          font-size: 0.85rem;
          line-height: 1.6;
        }
        .disclaimer-box strong { color: #94a3b8; }

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

        .divider { height: 1px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent); margin: 70px 0; }

        /* CONTENT SECTIONS */
        .content-section { margin-bottom: 60px; font-size: 1.1rem; line-height: 1.8; color: #cbd5e1; }
        .content-section h2 { font-size: 2.2rem; font-weight: 900; color: white; margin-bottom: 24px; letter-spacing: -0.5px; }
        .content-section p { margin-bottom: 20px; }
        .content-section strong { color: white; }
        
        /* SUB GRID */
        .sub-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 30px; }
        .sub-card {
          background: rgba(255,255,255,0.01);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 24px;
          padding: 30px;
          transition: 0.3s;
        }
        .sub-card:hover { border-color: rgba(99,102,241,0.25); background: rgba(255,255,255,0.03); }
        .sub-card h3 { font-size: 1.25rem; font-weight: 800; color: white; margin-bottom: 12px; }
        .sub-card p { font-size: 0.92rem; line-height: 1.6; color: #94a3b8; }

        /* COMPARE SECTION */
        .section-header { text-align: center; margin-bottom: 50px; }
        .section-header h2 { font-size: 2.5rem; font-weight: 900; margin-bottom: 12px; }
        .section-header p { color: #64748b; font-size: 1.05rem; }

        /* COMPARISON TABLE */
        .table-wrapper { overflow-x: auto; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 10px; }
        .compare-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem; }
        .compare-table th, .compare-table td { padding: 18px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .compare-table th { font-weight: 800; color: white; font-size: 1.05rem; text-transform: uppercase; letter-spacing: 0.5px; }
        .compare-table td { color: #94a3b8; }
        .compare-table tr:last-child td { border-bottom: none; }
        .highlight-yes { color: #86efac !important; font-weight: 600; }
        .highlight-no { color: #fca5a5 !important; }

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

        .blog-link {
          color: #818cf8;
          text-decoration: underline;
          font-weight: 600;
          transition: color 0.2s;
        }
        .blog-link:hover {
          color: #a5b4fc;
        }

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
          .sub-grid { grid-template-columns: 1fr; }
          .steps-container { flex-direction: column; }
          .step-arrow { transform: rotate(90deg); margin: 10px 0; }
        }

        @media (max-width: 768px) {
          .landing-inner { padding: 20px 14px 40px !important; }
          .top-nav { flex-direction: column !important; gap: 15px !important; text-align: center !important; margin-bottom: 40px !important; }
          .disclaimer-box { padding: 15px !important; margin-bottom: 40px !important; font-size: 0.8rem !important; }
          .hero h1 { font-size: 2.2rem !important; letter-spacing: -1px !important; }
          .hero-sub { font-size: 1.05rem !important; }
          .hero { margin-bottom: 40px !important; }
          .btn-primary { padding: 14px 28px !important; font-size: 1rem !important; border-radius: 12px !important; width: 100% !important; display: block !important; text-align: center !important; }
          .btn-lg { padding: 16px 32px !important; font-size: 1.1rem !important; }
          .divider { margin: 40px 0 !important; }
          .feat-card { padding: 25px 20px !important; border-radius: 20px !important; }
          .content-section h2 { font-size: 1.7rem !important; }
          .sub-card { padding: 20px !important; border-radius: 20px !important; }
          .section-header h2 { font-size: 1.8rem !important; }
          .compare-table th, .compare-table td { padding: 12px 14px !important; font-size: 0.85rem !important; }
          .step { padding: 25px 20px !important; border-radius: 20px !important; }
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
